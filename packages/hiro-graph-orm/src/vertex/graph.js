import Vertex, { isVertex } from "./index";
export { isVertex };

import { merge } from "../utils";

const $guard = Symbol("VertexGaurd");
/**
 *  Create a Context bound GraphVertex
 *
 *  The GraphVertex constructor should not be used directly, rather through
 *  this function.
 *
 *  It keeps the cache fresh, but clobbers object references
 *  so only a single object for each ID is created and updates
 *  create new versions.
 *
 *  @param {object} data - the initial data (as with {@link Vertex})
 *  @param {Context} context - the context this vertex was retrieved in
 *  @return {GraphVertex} - the vertex
 */
export function createVertex(data, context) {
    const id = data._id;
    data._fetched = Date.now();
    const vtx = new GraphVertex(data, context, $guard);
    mergeRelations(context._cache.get(id), vtx);
    context._cache.set(id, vtx);
    return vtx;
}

/**
 * Used internally
 * @ignore
 */
export function mergeRelations(oldVtx, newVtx) {
    if (oldVtx) {
        ["_counts", "_ids", "_vertices"].forEach(prop => {
            newVtx[prop] = merge(oldVtx[prop], newVtx[prop]);
        });
    }
}

//pull only the changed data from the vertex object
const getChangedData = vertex => {
    return Object.keys(vertex._before).reduce(
        (obj, key) => ((obj[key] = vertex._data[key]), obj),
        {}
    );
};

/**
 *  This is like the regular vertex, but has database access.
 *  Depending on your use case, you would do different things.
 *  If your frontend has no direct GraphIT access, the use plain Vertex
 *  If you are on the backend (or frontend with graph access) use the GraphVertex
 *  which can be saved.
 */
export default class GraphVertex extends Vertex {
    /**
     *  @ignore
     */
    constructor(data, context, guardSymbol) {
        super(data);
        if (guardSymbol !== $guard) {
            throw new Error(
                `use 'createVertex', do not instaniate directly with 'new GraphVertex'`
            );
        }
        this._ctx = context;
        this._db = context[this.type()];
    }

    /**
     *  Save any changes back to the Graph
     *
     *  @param {object} options - any extra options to pass to the GraphIT connection
     *  @return {Promise<GraphVertex>} - the new version of this Vertex
     */
    save(options = {}) {
        if (this._clean && !options.force) {
            return Promise.resolve(this);
        }
        //get changed data.
        const data = getChangedData(this);
        return this._db.update(this._id, data, options);
    }

    /**
     *  Create a connection between this Vertex and another
     *
     *  The connection type is defined by the named Schema relationship.
     *
     *  @param {string} relation - the schema relationship to use
     *  @param {string|Vertex} vertexOrId - the vertex or vertex id to connect to
     *  @return {Promise<GraphVertex>} - the new version of this Vertexes
     */
    connect(relation, vertexOrId) {
        return this._db
            .connect(relation, this._id, vertexOrId)
            .then(refetchRelationData(this, relation));
    }

    /**
     *  Remove a connection between this Vertex and another
     *
     *  The connection type is defined by the named Schema relationship.
     *
     *  @param {string} relation - the schema relationship to use
     *  @param {string|Vertex} vertexOrId - the vertex or vertex id to sever connection to
     *  @return {Promise<GraphVertex>} - the new version of this Vertexi
     */
    disconnect(relation, vertexOrId) {
        return this._db
            .disconnect(relation, this._id, vertexOrId)
            .then(refetchRelationData(this, relation));
    }

    /**
     *  Fetch relationship info from the Graph (just counts)
     *
     *  @param {Array<string>} relations the array of relation names to fetch.
     *  @param {object} options - any extra options to send to the GraphIT connection
     *  @return {Promise<GraphVertex>} - the new version of this Vertex
     */
    fetchCount(relations, options = {}) {
        return this._db
            .fetchCount(
                relations,
                options
            )(this)
            .then(addRelationInfo(this));
    }

    /**
     *  Fetch relationship info from the Graph (just Ids)
     *
     *  @param {Array<string>} relations the array of relation names to fetch.
     *  @param {object} options - any extra options to send to the GraphIT connection
     *  @return {Promise<GraphVertex>} - the new version of this Vertex
     */
    fetchIds(relations, options = {}) {
        return this._db
            .fetchIds(
                relations,
                options
            )(this)
            .then(addRelationInfo(this));
    }

    /**
     *  Fetch relationship info from the Graph (full vertices)
     *
     *  @param {Array<string>} relations the array of relation names to fetch.
     *  @param {object} options - any extra options to send to the GraphIT connection
     *  @return {Promise<GraphVertex>} - the new version of this Vertex
     */
    fetchVertices(relations, options = {}) {
        return this._db
            .fetchVertices(
                relations,
                options
            )(this)
            .then(addRelationInfo(this));
    }

    /**
     *  Delete this vertex from the Graph
     *
     *  @return {Promise<undefined>}
     */
    delete(options = {}) {
        return this._ctx.delete(this._id, options).then(() => {
            this._ctx._cache.delete(this._id);
        });
    }

    /**
     *  Get the GraphVertices of entities bound by the given relation (if known)
     *
     *  Only available on a GraphVertex as we need Context
     *
     *  @param {string} relation - the name of the relation to query
     *  @return {Array<GraphVertex>} - the array of GraphVertices
     */
    getVertices(relation) {
        const ids = this._vertices[relation];
        return (Array.isArray(ids) ? ids : [])
            .map(id => this._ctx._cache.get(id))
            .filter(Boolean);
    }

    // have we fetched vertices...
    hasVertices(relation) {
        return Array.isArray(this._vertices[relation]);
    }

    /**
     *  Ascertain whether we have write privileges on this node
     *
     *  @return {Promise<boolean>} - eventually returns whether we have write access or not.
     */
    canWrite() {
        const randVal =
            (Math.random().toString(16) + Math.random().toString(16)).replace(
                /[0.]*/g,
                ""
            ) + Date.now();
        const testKey = `/__jsGraphOrm_${randVal}`;
        const rawConn = this._ctx.getClient();
        return rawConn
            .update(this._id, { [testKey]: randVal })
            .then(res => {
                if (res[testKey] !== randVal) {
                    throw new Error("value doesn't match - no write access");
                }
                return rawConn.update(this._id, { [testKey]: null });
            })
            .then(() => true)
            .catch(err => {
                console.error(err);
                return false;
            });
    }

    // if this is a Timeseries vertex or a Log vertex we can fetchEntries();
    // this will fail if called on a different.
    // note that this returns the entries, they are not stored on the vertex as they have
    // no primary key and we cannot merge safely without more knowledge.
    // best left up to user code.
    fetchEntries(options) {
        const t = this.type();
        const o = this._ctx.get(t).ogit;
        switch (o) {
            case "ogit/Timeseries":
                return this._ctx.getClient().streamts(this._id, options);
            case "ogit/Log":
                return this._ctx.getClient().readlogs(this._id, options);
            default:
                return Promise.reject(
                    new Error(
                        `Cannot fetch entries for vertex type: ${t} (${o})`
                    )
                );
        }
    }
}

//This refetches the minimum data possible about the relation
const refetchRelationData = (vertex, relation) => () => {
    //find what we have on this and do the minimum possible.
    const vtx = vertex.getVertices(relation).length;
    const ids = vertex.getIds(relation).length;
    const cts = vertex.getCount(relation);
    if (vertex.hasVertices(relation) && vtx === ids && vtx === cts) {
        return vertex.fetchVertices([relation], { refetch: true });
    }
    if (vertex.hasIds(relation) && ids === cts) {
        return vertex.fetchIds([relation], { refetch: true });
    }
    if (vertex.hasCount(relation)) {
        return vertex.fetchCount([relation], { refetch: true });
    }
    //don't bother.
    return vertex;
};

const addRelationInfo = vertex => data => {
    //data will be an object keyed on the relation and
    //values will be either:
    // - Array of Vertexes (getVertices) - but we only keep the id's
    // - Array of strings (getIds)
    // - an Integer (getCount)
    const promises = Object.keys(data).map(relation => {
        const value = data[relation];
        if (Array.isArray(value)) {
            //nodes or ids.
            if (typeof value[0] === "string") {
                // ids
                return vertex.setIds(relation, value);
            } else {
                return vertex.setVertices(relation, value);
            }
        } else {
            return vertex.setCount(relation, value);
        }
    });
    return Promise.all(promises).then(res => (res.length ? res[0] : vertex));
};
