import chalk from "chalk";
import cosmiconfig = require("cosmiconfig");
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import Joi from "joi";
import shell from "shelljs";

import { IConfig, IEnv, IPopulateValue } from "../typings";

import { generate } from "./generate";

const envSchema = Joi.object().keys({
    HIRO_GRAPH_URL: Joi.string().uri().required(),
    HIRO_CLIENT_ID: Joi.string(),
    HIRO_CLIENT_SECRET: Joi.string(),
    HIRO_GRAPH_USER_NAME: Joi.string(),
    HIRO_GRAPH_USER_PASSWORD: Joi.string(),
    HIRO_GRAPH_TOKEN: Joi.string()
  })
  .and(["HIRO_GRAPH_TOKEN"])
  .and(["HIRO_CLIENT_ID", "HIRO_CLIENT_SECRET", "HIRO_GRAPH_USER_NAME", "HIRO_GRAPH_USER_PASSWORD"]);

const userSchema = Joi.object({
    email: Joi.string().required(),
    name: Joi.string().required(),
    password: Joi.string().required()
});

const configGenerateSchema = Joi.object({
    admins: Joi.object({
        password: Joi.string().required(),
        perOrg: Joi.number().required()
    }),
    orgs: Joi.object({
        count: Joi.number().required(),
        name: Joi.string().required()
    }),
    users: Joi.object({
        password: Joi.string().required(),
        perOrg: Joi.number().required()
    })
});

const configPopulateSchema = Joi.array().items(
    Joi.object({
        admins: Joi.array()
            .items(userSchema)
            .required(),
        name: Joi.string().required(),
        users: Joi.array()
            .items(userSchema)
            .required()
    }).required()
);

const configSchema = Joi.object({
    generate: configGenerateSchema,
    populate: configPopulateSchema
}).xor("populate", "generate");

const explorer = cosmiconfig("hiro-graph-populate");

export const loadConfigs = async () => {
    let result;

    // Load env
    const { parsed: envConfig } = dotenv.config();
    result = envSchema.validate(envConfig);

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

    // Load configs
    const search = await explorer.search();

    // Exit if populate config missing
    if (!search) {
        shell.echo(chalk.red("Config missing!"));
        shell.exit(1);
        return;
    }

    // Get config value
    const config = search.config as IConfig;

    result = configSchema.validate(config);
    if (result.error) {
        shell.echo(chalk.red(result.error.annotate()));
        shell.exit(1);
        return;
    }

    let finalConfig = config.populate as IPopulateValue[];

    if (config.generate) {
        finalConfig = generate(config.generate);
        writeFileSync("generated.json", JSON.stringify(finalConfig, null, 2));
    }

    return {
        config: finalConfig,
        env: (envConfig as any) as IEnv // Force to IEnv, Joi handles the checks
    };
};

export const configsSingleton = loadConfigs();
