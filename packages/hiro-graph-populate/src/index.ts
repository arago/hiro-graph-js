#!/usr/bin/env node
import chalk from "chalk";
import cosmiconfig from "cosmiconfig";
import dotenv from "dotenv";
import HiroGraphOrm, { ORM } from "hiro-graph-orm";
import mappings, { MappedTypes } from "hiro-graph-orm-mappings";
import Joi from "joi";
import fetch from "node-fetch";
import shell from "shelljs";

const explorer = cosmiconfig("hiro-graph-populate");

const envSchema = Joi.object().keys({
    HIRO_CLIENT_ID: Joi.string()
    .required(),
    HIRO_CLIENT_SECRET: Joi.string().required(),
    HIRO_GRAPH_URL: Joi.string()
        .uri()
        .required(),
    HIRO_GRAPH_USER_NAME: Joi.string().required(),
    HIRO_GRAPH_USER_PASSWORD: Joi.string().required()
});

const userSchema = Joi.object({
    email: Joi.string().required(),
    name: Joi.string().required()
});

const configSchema = Joi.object({
    orgs: Joi.array()
        .items(
            Joi.object({
                admins: Joi.array()
                    .items(userSchema)
                    .required(),
                name: Joi.string().required(),
                users: Joi.array()
                    .items(userSchema)
                    .required()
            }).required()
        )
        .required()
});

const getOrm = async () => {
    // Load env
    const { parsed: envConfig } = dotenv.config();
    const result = envSchema.validate(envConfig);

    if (!envConfig) {
        shell.echo(chalk.red("Enivronmental variables missing!"));
        shell.exit(1);
        return;
    }

    if (result.error) {
        shell.echo(chalk.red(result.error.annotate()));
        shell.exit(1);
        return;
    }

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
    return new HiroGraphOrm(
        {
            endpoint: envConfig.URL,
            token
        },
        mappings
    ) as ORM<MappedTypes>;
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
    const search = await explorer.search();

    // Exit if populate config missing
    if (!search) {
        shell.echo(chalk.red("Config missing!"));
        shell.exit(1);
        return;
    }

    // Get config value
    const config = search.config.module as IConfig;

    const result = configSchema.validate(config);
    if (result.error) {
        shell.echo(chalk.red(result.error.annotate()));
        shell.exit(1);
        return;
    }

    const orm = await getOrm();

    if (orm) {
        await populate(orm, config.orgs);
    }
})();
