#!/usr/bin/env node
import HiroGraphOrm, { ORM } from "@hiro-graph/orm";
import mappings, { MappedTypes } from "@hiro-graph/orm-mappings";

import fetch from "node-fetch";

import { createOrg, createUser } from "./auth";
import { configsSingleton } from "./config";

// @ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const login = async (envConfig: IEnv) => {
    // Get token
    const token = await fetch(`${envConfig.HIRO_GRAPH_URL}/api/6/auth/app`, {
        body: JSON.stringify({
            client_id: envConfig.HIRO_CLIENT_ID,
            client_secret: envConfig.HIRO_CLIENT_SECRET,
            password: envConfig.HIRO_GRAPH_USER_PASSWORD,
            username: envConfig.HIRO_GRAPH_USER_NAME
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
    })
        .then(res => res.json())
        .then(res => res._TOKEN);

    // Get orm
    return {
        orm: new HiroGraphOrm(
            {
                endpoint: envConfig.HIRO_GRAPH_URL,
                token
            },
            mappings
        ) as ORM<MappedTypes>,
        token
    };
};

(async () => {
    // Load configs
    const configs = await configsSingleton;

    const { token } = await login(configs!.env);

    for (const o of configs!.config) {
        console.group("Creating org:", o.name);
        const res = await createOrg(token, o.name);

        const admins = [];

        for (const a of o.admins) {
            const user = await createUser(token, a, o.name);
            if (user) {
                admins.push(user.account["ogit/_id"]);
            }
        }

        for (const a of o.users) {
            await createUser(token, a, o.name);
        }

        await res!.addAdmins(admins);

        console.groupEnd();
    }
})();
