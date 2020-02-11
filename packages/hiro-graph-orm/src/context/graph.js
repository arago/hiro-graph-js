/**
 *  The Graph interaction methods.
 *
 *  These wrap the base methods, the gremlin relation queries,
 *  the context and entity definitions to produce Vertex objects
 *  from queries.
 */
import { notFound, badRequest } from '@hiro-graph/client/lib/errors';
import { lucene as parseLucene } from '@hiro-graph/client';

import { decodeResults, filter, mapIfArray } from '../utils';
import { createVertex, isVertex } from '../vertex/graph';

// Structural helper
const identity = (val) => val;

// Convenience method based on user options
const convertVerticesToPlain = mapIfArray((input) =>
    typeof input.plain === 'function' ? input.plain() : input,
);

export const naiveDetectRaw = (input) =>
    input['ogit/_id'] && input['ogit/_type'];

//this is not in utils, so utils doesn't need to import GraphVertex
const createVertices = (ctx) => mapIfArray((data) => createVertex(data, ctx));

//this is a pipeline of a few functions.
//first decode results, then filter empties, then turn to vertexes.
//the ctx._schema.get() with no arg is the internal entity, used
//when we don't know the type in advance
/**
 * @ignore
 */
export const vertexize = (ctx, entity = ctx._schema.get()) => (input) => {
    return Promise.resolve(input)
        .then(decodeResults(ctx, entity))
        .then(filter(Boolean))
        .then(createVertices(ctx));
};

//this is for results that expect a single result.
const returnOneOrThrow = (result) => {
    if (!result || result.length === 0) {
        throw notFound('single vertex not found');
    }

    return Array.isArray(result) ? result[0] : result;
};

// order specified as ["field1 desc", "field2 asc"]
const convertSortOrderToOGIT = (order, entity) => {
    if (!Array.isArray(order)) {
        const a = order.split(' ');

        if (a.length === 2 && /^(asc|desc)$/i.test(a[1])) {
            //OK we can work with this
            return convertSortOrderToOGIT([order], entity);
        }
    }

    return order.map((def) => {
        const [field, dir = ''] = def.split(' ');
        const p = entity.prop(field);

        if (p) {
            return [p.src, dir].join(' ');
        }

        return def;
    });
};

/**
 * @ignore
 */
export function find(ctx, entity, query, options = {}) {
    const { querystring, placeholders } = parseLucene(query, entity);
    const luceneOptions = Object.assign({}, options, placeholders);

    if (luceneOptions.order) {
        luceneOptions.order = convertSortOrderToOGIT(
            luceneOptions.order,
            entity,
        );
    }

    const req = ctx.getClient().lucene(querystring, luceneOptions);

    return options.raw
        ? req
        : req
              .then(vertexize(ctx, entity))
              .then(options.plain === true ? convertVerticesToPlain : identity);
}

/**
 * @ignore
 */
export function findOne(ctx, entity, query, options = {}) {
    // force the limit to be 1
    const limitOneOptions = Object.assign({}, options, { limit: 1 });

    return find(ctx, entity, query, limitOneOptions).then(returnOneOrThrow);
}

/**
 *  @ignore
 */
export function findCount(ctx, entity, query, options = {}) {
    const { querystring, placeholders } = parseLucene(query, entity);
    // the default limit is set to -1 here, so we get all results.
    // otherwise the max count will be `limit` (we may/may not be desirable)
    const luceneOptions = Object.assign({ limit: -1 }, options, placeholders, {
        count: true,
    });

    return ctx
        .getClient()
        .lucene(querystring, luceneOptions)
        .then(([count]) => count);
}
//this function return the response from the callback
// in which ever case.
const noop = () => {};
const cacheCheck = (
    entity,
    cache,
    id,
    { isCached = noop, isCachedButWrongType = noop, notCached = noop },
) => {
    const cached = cache.get(id);

    //the second check is in case errors or something else get in the cache
    if (!cached || !isVertex(cached)) {
        return notCached(id);
    }

    if (entity && !entity.internal && entity.name !== cached.type()) {
        return isCachedButWrongType(cached);
    }

    return isCached(cached);
};

//get Me is a little different as we have no ID to start with,
//but we will get an "ogit/Auth/Account" node.
/**
 * @ignore
 */
export function fetchMe(ctx) {
    const accountEntity = ctx.getEntity('ogit/Auth/Account');
    const profileEntity = ctx.getEntity('ogit/Auth/AccountProfile');

    return ctx
        .getClient()
        .me()
        .then(({ account, avatar, profile }) =>
            Promise.all([
                vertexize(ctx, accountEntity)(account),
                vertexize(ctx, profileEntity)(profile),
                Promise.resolve(avatar),
            ]),
        )
        .then(([account, profile, avatar]) => ({ account, avatar, profile }))
        .then(returnOneOrThrow);
}

//find by ID can do multiple things.
//first it can be given either one or many ids.
//also if entity is null, we should use the IDs query.
/**
 * @ignore
 */
export function findById(ctx, entity, query, options = {}) {
    if (Array.isArray(query)) {
        //do an ids query.
        const cached = [];
        let toFetch;

        if (!options.refetch) {
            const callbacks = {
                isCached: (vertex) => {
                    cached.push(vertex);

                    return false; //
                },
                isCachedButWrongType: () => false,
                notCached: (id) => id,
            };

            toFetch = query
                .map((id) => cacheCheck(entity, ctx._cache, id, callbacks))
                .filter(Boolean);
        } else {
            toFetch = query;
        }

        const finalise = (promise) =>
            options.raw
                ? promise
                : promise
                      .then(vertexize(ctx, entity))
                      .then(
                          options.plain === true
                              ? convertVerticesToPlain
                              : identity,
                      );

        const fetched =
            toFetch.length === 0
                ? Promise.resolve([])
                : finalise(ctx.getClient().ids(toFetch, options));

        return fetched.then((vertices) => cached.concat(vertices));
    }

    //check cache first.
    if (!options.refetch) {
        const cached = cacheCheck(entity, ctx._cache, query, {
            isCached: (vertex) => vertex,
            isCachedButWrongType: () => false,
            notCached: () => false,
        });

        if (cached) {
            return Promise.resolve(cached);
        }
    }

    return findOne(ctx, entity, { _id: query }, options);
}

/**
 * @ignore
 */
export function search(ctx, entity, query, filters = {}, options = {}) {
    return find(
        ctx,
        entity,
        Object.assign({ $search: query }, filters),
        options,
    );
}

/**
 * @ignore
 */
export function create(ctx, entity, data, options = {}) {
    if (options.addCreatedOn && !data.created_on) {
        data.created_on = Date.now();
    }

    const dbData = entity.encode(data);

    return ctx
        .getClient()
        .create(entity.ogit, dbData, options)
        .then(vertexize(ctx, entity));
}

/**
 * @ignore
 */
export function update(ctx, entity, vertexId, data, options = {}) {
    const dbData = entity.encode(data);

    return ctx
        .getClient()
        .update(vertexId, dbData, options)
        .then(vertexize(ctx, entity));
}

/**
 * @ignore
 */
export function replace(ctx, entity, vertexId, data, options = {}) {
    const dbData = entity.encode(data);

    return ctx
        .getClient()
        .replace(vertexId, dbData, options)
        .then(vertexize(ctx, entity));
}

/**
 * @ignore
 */
export function deleteVertex(ctx, vertexId, options = {}) {
    return ctx.getClient().delete(vertexId, options);
}

/**
 * @ignore
 */
export function connect(
    ctx,
    entity,
    { relation, source, target },
    options = {},
) {
    const relationDef = entity.relation(relation);

    if (!relationDef) {
        throw badRequest(`No Relation ${relation} defined for ${entity.name}`);
    }

    if (relationDef.hops.length > 1) {
        throw badRequest(
            `Cannot "connect" multi-hop relation ${relation} for ${entity.name}`,
        );
    }

    const { verb, direction } = relationDef.hops[0];
    const [inId, outId] =
        direction === 'in' ? [source, target] : [target, source];

    return ctx.getClient().connect(verb, inId, outId, options);
}

/**
 * @ignore
 */
export function disconnect(
    ctx,
    entity,
    { relation, source, target },
    options = {},
) {
    const relationDef = entity.relation(relation);

    if (!relationDef) {
        throw badRequest(`No Relation ${relation} defined for ${entity.name}`);
    }

    if (relationDef.hops.length > 1) {
        throw badRequest(
            `Cannot "disconnect" multi-hop relation ${relation} for ${entity.name}`,
        );
    }

    const { verb, direction } = relationDef.hops[0];
    const [inId, outId] =
        direction === 'in' ? [source, target] : [target, source];

    return ctx.getClient().disconnect(verb, inId, outId, options);
}

/**
 * @ignore
 */
export function gremlin(ctx, rootVertexId, query, options = {}) {
    const queryResults = ctx
        .getClient()
        .gremlin(rootVertexId, query.toString(), options);

    if (options.raw) {
        return queryResults;
    }

    return queryResults
        .then(vertexize(ctx))
        .then(options.plain === true ? convertVerticesToPlain : identity);
}
