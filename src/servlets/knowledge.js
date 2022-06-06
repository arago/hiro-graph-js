import { stringify } from 'qs';

import { KNOWLEDGE_API_BASE } from '../api-version';

const URL_PATH_INSTANCE = 'instance';

const URL_PATH_DEPLOYED = 'deployed';
const URL_PATH_DEPLOY = 'deploy';

const URL_PATH_POOLS = 'pools';
const URL_PATH_KIS = 'kis';
const URL_PATH_POOL = 'pool';
const URL_PATH_KI = 'ki';
const URL_PATH_HISTORY = 'history';

const toPath = (...paths) => `${KNOWLEDGE_API_BASE}/${paths.join('/')}`;

export default function knowledgeServletFactory(fetch, options) {
    return {
        // All Visible Pools (perspective of Engine)
        pools: (scopeId) =>
            fetch(toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_POOLS), options),

        // All Visible Kis (perspective of Engine)
        kis: (scopeId) =>
            fetch(toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_KIS), options),

        // Search All Visible Kis (perspective of Engine)
        search: (scopeId, searchTerms) =>
            fetch(
                toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_KIS) +
                    `?${stringify({ search: [...searchTerms] })}`,
                options,
            ),

        // All Deployed Pools to Instance / Engine
        poolsDeployed: (scopeId) =>
            fetch(
                toPath(
                    URL_PATH_INSTANCE,
                    scopeId,
                    URL_PATH_DEPLOYED,
                    URL_PATH_POOLS,
                ),
                options,
            ),

        // All Deployed Kis to Instance / Engine (via Pool)
        kisDeployed: (scopeId) =>
            fetch(
                toPath(
                    URL_PATH_INSTANCE,
                    scopeId,
                    URL_PATH_DEPLOYED,
                    URL_PATH_KIS,
                ),
                options,
            ),

        // Check if Pool is Deployed to Instance / Engine
        poolDeployed: (scopeId, poolId) =>
            fetch(
                toPath(
                    URL_PATH_INSTANCE,
                    scopeId,
                    URL_PATH_DEPLOYED,
                    URL_PATH_POOL,
                    poolId,
                ),
                options,
            ),

        // Check if Ki is Deployed to Instance / Engine
        kiDeployed: (scopeId, kiId) =>
            fetch(
                toPath(
                    URL_PATH_INSTANCE,
                    scopeId,
                    URL_PATH_DEPLOYED,
                    URL_PATH_KI,
                    kiId,
                ),
                options,
            ),

        kiDeployedStatuses: (scopeId, kiId) =>
            fetch(
                toPath(
                    URL_PATH_INSTANCE,
                    scopeId,
                    'statuses',
                    URL_PATH_KI,
                    kiId,
                ),
                options,
            ),

        // Deploy Pool to Instance / Engine
        deployPool: (scopeId, poolId) =>
            fetch(toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_DEPLOY, poolId), {
                ...options,
                method: 'POST',
            }),

        // Undeploy Pool to Instance / Engine
        undeployPool: (scopeId, poolId) =>
            fetch(toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_DEPLOY, poolId), {
                ...options,
                method: 'DELETE',
            }),

        // Create New Pool in Instance
        newPool: (scopeId, data) =>
            fetch(toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_POOL), {
                ...options,
                method: 'POST',
                body: JSON.stringify({ ...data }),
            }),

        // Create New Ki in Instance
        newKi: (scopeId, data) =>
            fetch(toPath(URL_PATH_INSTANCE, scopeId, URL_PATH_KI), {
                ...options,
                method: 'POST',
                body: JSON.stringify({ ...data }),
            }),

        // Get Pool by Id
        pool: (poolId) => fetch(toPath(URL_PATH_POOL, poolId), options),

        // Delete Pool by Id
        deletePool: (poolId) =>
            fetch(toPath(URL_PATH_POOL, poolId), {
                ...options,
                method: 'DELETE',
            }),

        // Get Kis attached to Pool
        poolKis: (poolId) =>
            fetch(toPath(URL_PATH_POOL, poolId, URL_PATH_KIS), options),

        // Check if Ki is Deployed to Pool
        poolKiDeployed: (poolId, kiId) =>
            fetch(
                toPath(URL_PATH_POOL, poolId, URL_PATH_DEPLOYED, kiId),
                options,
            ),

        // Deploy Ki to Pool
        deployKi: (poolId, kiId) =>
            fetch(toPath(URL_PATH_POOL, poolId, URL_PATH_DEPLOY, kiId), {
                ...options,
                method: 'POST',
            }),

        // Undeploy Ki to Pool
        undeployKi: (poolId, kiId) =>
            fetch(toPath(URL_PATH_POOL, poolId, URL_PATH_DEPLOY, kiId), {
                ...options,
                method: 'DELETE',
            }),

        // Get Ki by Id
        ki: (kiId) => fetch(toPath(URL_PATH_KI, kiId), options),

        // Get Ki History by Id
        kiHistory: (kiId) =>
            fetch(toPath(URL_PATH_KI, kiId, URL_PATH_HISTORY), options),

        updateKi: (kiId, data) =>
            fetch(toPath(URL_PATH_KI, kiId), {
                ...options,
                method: 'POST',
                body: JSON.stringify({ ...data }),
            }),

        // Delete Ki by Id
        deleteKi: (kiId) =>
            fetch(toPath(URL_PATH_KI, kiId), {
                ...options,
                method: 'DELETE',
            }),
    };
}
