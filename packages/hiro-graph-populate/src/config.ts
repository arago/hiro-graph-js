import chalk from "chalk";
import cosmiconfig = require("cosmiconfig");
import dotenv from "dotenv";
import Joi from "joi";
import shell from "shelljs";

const envSchema = Joi.object().keys({
    HIRO_CLIENT_ID: Joi.string().required(),
    HIRO_CLIENT_SECRET: Joi.string().required(),
    HIRO_GRAPH_URL: Joi.string()
        .uri()
        .required(),
    HIRO_GRAPH_USER_NAME: Joi.string().required(),
    HIRO_GRAPH_USER_PASSWORD: Joi.string().required()
});

const userSchema = Joi.object({
    email: Joi.string().required(),
    name: Joi.string().required(),
    password: Joi.string().required()
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
    const config = search.config.module as IConfig;

    result = configSchema.validate(config);
    if (result.error) {
        shell.echo(chalk.red(result.error.annotate()));
        shell.exit(1);
        return;
    }

    return {
        config,
        env: (envConfig as any) as IEnv // Force to IEnv, Joi handles the checks
    };
};

export const configsSingleton = loadConfigs();
