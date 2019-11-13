/**
 *  This is where the crazy queries for relation data are handled.
 */
import { queryBuilder } from '../gremlin';
import { mapPromiseIfArray } from '../utils';
import { vertexize } from './graph';

function createRelationMap(relations, keyFn = () => []) {
    return relations.reduce((obj, rel) => ((obj[rel] = keyFn(rel)), obj), {});
}

//returns an object { relation: [ obj, ... ] }
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function fetchVertices(ctx, entity) {
    return relationQuery(ctx, entity, (relations, gremlin, options) => {
        //get the nodes as well
        const query = gremlin.copySplit([
            //this is the edge map
            (_) => _.groupBy('$_alias', 'ogit/_id'),
            //and this is all the nodes
            (_) => _.dedup(),
        ]);

        if (options.returnQuery) {
            return query;
        }

        return mapPromiseIfArray((vertex) => {
            return query
                .executeInContext(
                    ctx,
                    vertex._id,
                    Object.assign({ raw: true }, options),
                )
                .then(([edgeMap, ...raw]) => {
                    //patch them together again
                    return vertexize(ctx)(raw).then((vertices) => {
                        const vertexMap = vertices.reduce(
                            (o, v) => ((o[v._id] = v), o),
                            {},
                        );

                        return createRelationMap(relations, (key) => {
                            if (edgeMap[key]) {
                                return edgeMap[key].map((id) => vertexMap[id]);
                            }

                            return [];
                        });
                    });
                });
        });
    });
}

//returns an object { relation: [ id, id, ... ] }
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function fetchIds(ctx, entity) {
    return relationQuery(ctx, entity, (relations, gremlin, options) => {
        //count the aliases.
        const query = gremlin.groupBy('$_alias', 'ogit/_id');

        if (options.returnQuery) {
            return query;
        }

        return mapPromiseIfArray((vertex) => {
            return query
                .executeInContext(
                    ctx,
                    vertex._id,
                    Object.assign({ raw: true }, options),
                )
                .then(([info]) =>
                    createRelationMap(relations, (key) => info[key] || []),
                );
        });
    });
}

//returns an object { relation: X }
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function fetchCount(ctx, entity) {
    return relationQuery(ctx, entity, (relations, gremlin, options) => {
        //count the aliases.
        const query = gremlin.groupCount('$_alias');

        return mapPromiseIfArray((vertex) => {
            return query
                .executeInContext(
                    ctx,
                    vertex._id,
                    Object.assign({ raw: true }, options),
                )
                .then(([info]) =>
                    createRelationMap(relations, (key) => info[key] || 0),
                );
        });
    });
}

//expose this to allow getting the query for a relation
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function getRelationQuery(entity, relation, options = {}) {
    return relationQueryGenerator(entity)(relation, options)(queryBuilder());
}

//creates a relation query and returns it.
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
function relationQuery(ctx, entity, finaliser) {
    const getQuery = relationQueryGenerator(entity, { withAlias: '$_alias' });

    return (relations, options = {}) => {
        const queries = relations.map((r) => getQuery(r, options));

        //now we have an array.
        const gremlin = ctx.gremlin();

        if (queries.length === 1) {
            queries[0](gremlin); //apply directly.
        } else {
            gremlin.copySplit(queries);
        }

        //finish up indiviually
        return finaliser(relations, gremlin, options);
    };
}

// The complex one (although simplified and generalised from the TabTab original...)
// This function creates a gremlin query that traverses according to the defined
// relation in the schema.
/**
 * @ignore - we don't need docs about this. they are internal exports
 */
export function relationQueryGenerator(entity, { withAlias = false }) {
    return (relation, { offset = 0, limit = false } = {}) => {
        const { alias, hops } = entity.relation(relation);
        let limiter = (x) => x;

        if (limit !== false) {
            limiter = (g) => g.range(offset, offset + limit);
        } else if (offset !== 0) {
            // this is a bit of a hack, there is no offset without limit
            // but Integer.MAX_VALUE is as big as we are allowed anyway.
            // Hopefully we won't get that many results!
            limiter = (g) => g.range(offset, 'Integer.MAX_VALUE');
        }

        return (gremlin) => {
            hops.forEach(({ verb, direction, filter, vertices }) => {
                const inbound = direction === 'in';
                const firstEdge = inbound ? 'inE' : 'outE';
                const secondEdge = inbound ? 'outV' : 'inV';
                const edgeTypeProp = inbound
                    ? 'ogit/_out-type'
                    : 'ogit/_in-type';

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
                        gremlin.has(edgeTypeProp, 'T.in', vertices);
                }

                //now out to the vertices
                gremlin[secondEdge]();

                //now we filter if there is one.
                if (filter) {
                    gremlin.has(filter);
                }

                limiter(gremlin);
            });

            //now we have the vertices, if we were going to add an alias, here it comes.
            if (withAlias) {
                gremlin.addTempProp(withAlias, alias);
            }

            return gremlin;
        };
    };
}
