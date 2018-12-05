#!/usr/bin/env node
import dotenv from "dotenv";
const cosmiconfig = require("cosmiconfig");
const shell = require("shelljs");
const chalk = require("chalk").default;
const fetch = require("node-fetch");

const HiroGraphOrm = require("hiro-graph-orm").default;
const mappings = require("hiro-graph-orm-mappings").default;

const explorer = cosmiconfig("hiro-graph-populate");

const getOrm = async () => {
    // Load env
    const { parsed: envConfig } = dotenv.config();

    // Get token
    const token = await fetch(`${envConfig.URL}/api/6/auth/app`, {
        method: "POST",
        body: JSON.stringify({
            client_id: envConfig.CLIENT_ID,
            client_secret: envConfig.CLIENT_SECRET,
            username: envConfig.USER_NAME,
            password: envConfig.USER_PASSWORD
        }),
        headers: { "Content-Type": "application/json" }
    })
        .then(res => res.json())
        .then(res => res._TOKEN);

    // Get orm
    return new HiroGraphOrm(
        {
            endpoint: envConfig.URL,
            token
        },
        mappings
    );
};

const populate = async (orm, values) => {
    let i = 0;
    for (const org of values) {
        console.group("Org #" + i);

        // Create org
        console.group("Creating org");
        if (!(await orm.findById(org.name))) {
            orm.Org.create({ name: org.name });
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
                orm.Org.create({ name, email });
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
                orm.Account.create({ name, email });
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
    const search = await explorer.search();

    // Exit if populate config missing
    if (!search) {
        shell.echo(chalk.red("Config not found!"));
        shell.exit(1);
    }

    // Get config value
    const { module: config } = search.config;

    const orm = await getOrm();

    if (config.populate) {
        await populate(orm, config.populate);
    }
})();
