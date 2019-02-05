#!/usr/bin/env node
import HiroGraphOrm from "@hiro-graph/orm";
import mappings from "@hiro-graph/orm-mappings";

import fetch from "node-fetch";

import { IEnv, Orm } from "../typings";

import { createOrg, createUser } from "./auth";
import { configsSingleton } from "./config";

// @ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const login = async (envConfig: IEnv) => {
    let token = envConfig.HIRO_GRAPH_TOKEN || "";

    if (token === "") {
        // Get token
        token = await fetch(`${envConfig.HIRO_GRAPH_URL}/api/6/auth/app`, {
            body: JSON.stringify({
                client_id: envConfig.HIRO_CLIENT_ID,
                client_secret: envConfig.HIRO_CLIENT_SECRET,
                password: envConfig.HIRO_GRAPH_USER_PASSWORD,
                username: envConfig.HIRO_GRAPH_USER_NAME
            }),
            headers: {"Content-Type": "application/json"},
            method: "POST"
        })
        .then(res => res.json())
        .then(res => res._TOKEN);
    }

    // Get orm
    return {
        orm: new HiroGraphOrm(
            {
                endpoint: envConfig.HIRO_GRAPH_URL,
                token
            },
            mappings
        ) as Orm,
        token
    };
};

(async () => {
    // Load configs
    const configs = await configsSingleton;

    const { orm } = await login(configs!.env);

    for (const o of configs!.config) {
        console.group("Creating org:", o.name);
        const res = await createOrg(orm, o.name);
        const orgId = res!.org["ogit/_id"] || "";

        const admins = [];

        for (const a of o.admins) {
            const user = await createUser(orm, a, orgId);
            if (user) {
                admins.push(user.account["ogit/_id"]);
            }
        }

        for (const a of o.users) {
            await createUser(orm, a, orgId);
        }

        await res!.addAdmins(admins);

        console.groupEnd();
    }
})();
