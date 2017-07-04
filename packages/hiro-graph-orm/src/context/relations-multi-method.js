/**
 *  This is where the crazy queries for relation data are handled.
 */
import { mapPromiseIfArray } from "../utils";
import { queryBuilder } from "../gremlin";

function createRelationMap(relations, keyFn = () => []) {
    return relations.reduce((obj, rel) => ((obj[rel] = keyFn(rel)), obj), {});
}

//returns an object { relation: [ obj, ... ] }
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function fetchVertices(ctx, entity) {
    return relationQuery(ctx, entity, (relations, gremlins, options) => {
        return mapPromiseIfArray(vertex => {
            const map = {};
            return Promise.all(
                gremlins
                    .map(fn => fn(queryBuilder()))
                    .map(({ alias, query }) => {
                        return query
                            .executeInContext(ctx, vertex._id, options)
                            .then(vtxs => (map[alias] = vtxs));
                    })
            ).then(() => createRelationMap(relations, key => map[key] || []));
        });
    });
}

//returns an object { relation: [ id, id, ... ] }
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function fetchIds(ctx, entity) {
    return relationQuery(ctx, entity, (relations, gremlins, options) => {
        return mapPromiseIfArray(vertex => {
            const map = {};
            return (
                Promise.all(
                    gremlins
                        .map(fn => fn(queryBuilder()))
                        .map(({ alias, query }) => {
                            return query
                                .property("ogit/_id")
                                .executeInContext(
                                    ctx,
                                    vertex._id,
                                    Object.assign({ raw: true }, options)
                                )
                                .then(ids => (map[alias] = ids));
                        })
                )
                    //                .executeInContext(ctx, vertex._id, Object.assign({ raw: true }, options))
                    .then(() =>
                        createRelationMap(relations, key => map[key] || [])
                    )
            );
        });
    });
}

//returns an object { relation: X }
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function fetchCount(ctx, entity) {
    return relationQuery(ctx, entity, (relations, gremlins, options) => {
        //count the aliases
        return mapPromiseIfArray(vertex => {
            const counts = {};
            return Promise.all(
                gremlins
                    .map(fn => fn(queryBuilder()))
                    .map(({ alias, query }) => {
                        return query
                            .count()
                            .executeInContext(
                                ctx,
                                vertex._id,
                                Object.assign({ raw: true }, options)
                            )
                            .then(([count]) => (counts[alias] = count));
                    })
            ).then(() => createRelationMap(relations, key => counts[key] || 0));
        });
    });
}

//expose this to allow getting the query for a relation
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function getRelationQuery(entity, relation, options = {}) {
    return relationQueryGenerator(entity)(relation, options)(queryBuilder())
        .query;
}

//creates a relation query and returns it.
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
function relationQuery(ctx, entity, finaliser) {
    const getQuery = relationQueryGenerator(entity);
    return (relations, options = {}) => {
        const queries = relations.map(r => getQuery(r, options));
        //finish up indiviually
        return finaliser(relations, queries, options);
    };
}

// The complex one (although simplified and generalised from the TabTab original...)
// This function creates a gremlin query that traverses according to the defined
// relation in the schema.
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function relationQueryGenerator(entity) {
    return (relation, { limit = false, offset = 0 } = {}) => {
        const { alias, hops } = entity.relation(relation);
        let limiter = x => x;
        if (limit !== false) {
            limiter = g => g.limit(offset, offset + limit);
        } else if (offset !== 0) {
            // this is a bit of a hack, there is no offset without limit
            // but Integer.MAX_VALUE is as big as we are allowed anyway.
            // Hopefully we won't get that many results!
            limiter = g => g.limit(offset, "Integer.MAX_VALUE");
        }
        return gremlin => {
            hops.forEach(({ verb, direction, filter, vertices }) => {
                const inbound = direction === "in";
                const firstEdge = inbound ? "inE" : "outE";
                const secondEdge = inbound ? "outV" : "inV";
                const edgeTypeProp = inbound
                    ? "ogit/_out-type"
                    : "ogit/_in-type";

                //traverse the edge by verb label.
                gremlin[firstEdge](verb);

                //now there are three paths dependent on whether there is zero, only one or multiple vertex type(s).
                //if so we can optimise.
                switch (true) {
                    case vertices.length === 0:
                        //no node type specified, could be anything.
                        break;
                    case vertices.length === 1:
                        //only a single vertextype.
                        gremlin.has(edgeTypeProp, vertices[0]);
                        break;
                    default:
                        //many possible nodes, we use T.in to filter.
                        gremlin.has(edgeTypeProp, "T.in", vertices);
                }

                //now out to the vertices
                gremlin[secondEdge]();

                //now we filter if there is one.
                if (filter) {
                    gremlin.has(filter);
                }

                limiter(gremlin);
            });

            return { alias, query: gremlin };
        };
    };
}
