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

const populate = async (orm: ORM<MappedTypes>, values: IPopulateValue[]) => {
    let i = 0;
    for (const org of values) {
        console.group("Org #" + i);

        // Create org
        console.group("Creating org");
        if (!(await orm.findById(org.name))) {
            orm.AuthOrganization.create({ name: org.name });
            console.log(`Org '${org.name}' created`);
        } else {
            console.log(`Org '${org.name}' already exists`);
        }
        console.groupEnd();

        // Create admins
        console.group("Creating admins");
        for (const admin of org.admins) {
            const { name, email } = admin;
            if (!(await orm.findById(email))) {
                orm.AuthOrganization.create({ name, email });
                console.log(`Admin '${email}' created`);
            } else {
                console.log(`Admin '${email}' already exists`);
            }
        }
        console.groupEnd();

        // Create users
        console.group("Creating users");
        for (const user of org.users) {
            const { name, email } = user;
            if (!(await orm.findById(email))) {
                orm.AuthAccount.create({ name, email });
                console.log(`User '${email}' created`);
            } else {
                console.log(`User '${email}' already exists`);
            }
        }
        console.groupEnd();

        console.groupEnd();
        i += 1;
    }
};

(async () => {
    // Load configs
    const configs = await configsSingleton;

    const { orm, token } = await login(configs!.env);

    /*
    if (orm) {
        await populate(orm, configs!.config.orgs);
    }
    */

    // await createUser(token, "test2", "password", "test2@tabtab.co");

    /*
    const users = (await Promise.all([
        createUser(token, "user1", "password", "user1@tabtab.co"),
        createUser(token, "user2", "password", "user2@tabtab.co")
    ])).map(a => (a ? a.account["ogit/_id"] : ""));
*/

    configs!.config.orgs.map(async o => {
        const res = await createOrg(token, o.name);

        const admins = (await Promise.all(
            o.admins.map(a => createUser(token, a, o.name))
        )).map(a => (a ? a.account["ogit/_id"] : ""));

        await Promise.all(o.users.map(a => createUser(token, a, o.name)));

        await res!.addAdmins(admins);
    });
})();
