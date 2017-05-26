/**
 *  The vertex class represents an instance of a vertex and it's relations to
 *  other vertices.
 */
import { clone } from "../utils";

/**
 *  Check is an object is a vertex
 *
 *  @param {*} vertex - the thing which *could* be a {@link Vertex}
 *  @return {bool} - whether or not it is.
 */
export function isVertex(vertex) {
    return vertex instanceof Vertex;
}

/**
 *  The base Vertex class representing a node in the graph.
 */
export default class Vertex {
    /**
     *  Create a vertex from the given data
     *
     *  @param {object} data - the object holding the data, should have at least `_id` and `_type`
     *  @return {Vertex} - the Vertex
     */
    constructor(data) {
        this._id = data._id;
        this._isDeleted = "_is-deleted" in data ? data["_is-deleted"] : false;

        this._data = clone(data);

        //relations
        this._counts = {};
        this._ids = {};
        this._vertices = {};

        //unmapped data.
        //this should come in in a property called `_unmapped`
        let _free = {};
        if ("_free" in this._data) {
            _free = this._data._free;
            delete this._data._free;
        }
        this._free = _free;

        this._clean = true;
        this._before = {};
    }

    /**
     *  Custom JSON pre-processing to get the relations and free props in order
     *
     *  @return {object}
     */
    toJSON() {
        //ensure we dereference anything...
        return Object.assign(
            {
                _rel: mergeRelations(this),
                _free: clone(this._free)
            },
            clone(this._data)
        );
    }

    /**
     *  Return a plain object with the data in this one
     *
     *  @return {object}
     */
    plain() {
        return this.toJSON();
    }

    /**
     *  Get the type of this Vertex
     *
     *  @return {string} type = the type as named in the Schema
     */
    type() {
        return this._data._type;
    }

    /**
     *  Get a property value
     *
     *  @param {string} prop
     */
    get(prop) {
        return this._data[prop];
    }

    /**
     *  Get a free attributes.
     *
     *  These are generally not known at runtime, so we must
     *  iterate ourselves
     */
    getFree() {
        return this._free;
    }

    /**
     *  Get the number of entities bound by the given relation (if known)
     *
     *  @param {string} relation - the name of the relation to query
     *  @return {number} - the count
     */
    getCount(relation) {
        return this._counts[relation] || 0;
    }

    /**
     *  Get the ids of entities bound by the given relation (if known)
     *
     *  @param {string} relation - the name of the relation to query
     *  @return {Array<string>} - the array of Ids
     */
    getIds(relation) {
        return this._ids[relation] || [];
    }

    /**
     *  Setters for mutating the data.
     *
     *  @param {string|object} prop - the string property or an object prop -> value.
     *  @param {?any} value - the value to set (unless using the object version)
     *  @return {Vertex} - this (i.e. chainable)
     */
    set(prop, value = null) {
        if (this._isDeleted) {
            throw new Error("cannot update deleted vertex");
        }
        if (typeof prop !== "string") {
            Object.keys(prop).forEach(key => this.set(key, prop[key]));
            return this;
        }
        if (this._data[prop] === value) {
            return this;
        }
        this._clean = false;
        if (prop in this._before === false) {
            //only set this the first time, i.e. to the value of the original data
            this._before[prop] = this._data[prop];
        }
        this._data[prop] = value;
        return this;
    }

    /**
     *  Set the relationship data for a vertex (with related vertices)
     *
     *  This may seem superfluous because we don't set the nodes, just the ids.
     *  but actually we don't want the interconnections.
     *  the GraphVertex can pull the relations from cache, setting this here
     *  with the different key is saying "I fetched the nodes".
     *
     *  Implies `setIds` and `setCount`
     *
     *  @param {string} relation - the relation identifier from the schema
     *  @param {Array<Vertex>} nodes - the vertices to set.
     *  @return {Vertex} - this (i.e. chainable)
     */
    setVertices(relation, nodes) {
        const ids = nodes.map(n => n._id);
        this._vertices[relation] = ids;
        return this.setIds(relation, ids.slice());
    }

    /**
     *  Set the relationship data for a vertex (with related vertex ids)
     *
     *  Implies `setCount`
     *
     *  @param {string} relation - the relation identifier from the schema
     *  @param {Array<string>} ids - the vertex ids
     *  @return {Vertex} - this (i.e. chainable)
     */
    setIds(relation, ids) {
        this._ids[relation] = ids;
        return this.setCount(relation, ids.length);
    }

    /**
     *  Set the relationship data for a vertex (with related vertex counts)
     *
     *  @param {string} relation - the relation identifier from the schema
     *  @param {number} count - the vertex count to set
     *  @return {Vertex} - this (i.e. chainable)
     */
    setCount(relation, count) {
        this._counts[relation] = count;
        return this;
    }
}

//pulls out ids and counts together.
const mergeRelations = vertex => {
    return mapKeys(
        vertex._counts,
        addSuffix("Count"),
        mapKeys(vertex._ids, addSuffix("Ids"))
    );
};

//adds a suffix to a key
const addSuffix = suffix => key => key + suffix;

//calls a function of each key of an object returning a new object
// or the given one, with the new key names.
const mapKeys = (obj, fn, initial = {}) =>
    Object.keys(obj).reduce(
        (acc, key) => ((acc[fn(key)] = obj[key]), acc),
        initial
    );
