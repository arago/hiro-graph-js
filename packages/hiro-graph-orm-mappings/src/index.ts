import fs from "fs";
import { join } from "path";
import shell from "shelljs";
import {
    getRequiredAttributes,
    getOptionalAttributes,
    getRelations
} from "./regex";
import { getName, createIndex } from "./helper";
import { mapRelationship } from "./relations";

import config from "../config.json";

const tbd: IToBeDone = {};

const addRelation = (v: string[], from: string) => {
    const to = v[1];

    if (!output[to]) {
        const name = getName(to);
        output[to] = { name: name.ns + name.name, ogit: to };
        tbd[to] = name;
    }

    if (!output[to].relations) {
        output[to].relations = {};
    }

    const left = v[0].split("/").pop() || "";
    const right = from.split("/").pop() || "";

    if (!left || !right) {
        console.error(`Failed to add relation: ${v} [${from}]`);
        return;
    }

    const relationship = v[0] + " <- " + from;
    // @ts-ignore
    output[to].relations[
        mapRelationship(relationship, left + right)
    ] = relationship;
};

const createMapping = (namespace: string, name: string) => {
    const filePath = namespace
        ? join(config.OGIT, namespace, "entities", `${name}.ttl`)
        : join(config.OGIT, "../SGO/sgo", "entities", `${name}.ttl`);

    const data = fs.readFileSync(filePath).toString();

    const safeNamespace = namespace.replace(/-/g, "");
    const ogit = namespace ? `ogit/${namespace}/${name}` : `ogit/${name}`;
    const mapping: IEntity = {
        name: safeNamespace + name,
        ogit
    };

    const currentValue = output[ogit];
    const required = getRequiredAttributes(data);
    const optional = getOptionalAttributes(data);
    const relations = getRelations(
        data,
        ogit,
        currentValue ? currentValue.relations || {} : undefined,
        addRelation
    );

    if (required) {
        mapping.required = required;
    }
    if (optional) {
        mapping.optional = optional;
    }
    if (relations) {
        mapping.relations = relations;
    }

    return mapping;
};

const output: IOutput = {};

(async () => {
    const topDir = fs
        .readdirSync(config.OGIT)
        .map((v: string) => v.split(".").shift() || "")
        .filter(v => {
            const dirPath = join(config.OGIT, v);
            return (
                fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()
            );
        })
        .filter(v => {
            const dirPath = join(config.OGIT, v);
            const d = fs.readdirSync(dirPath);
            return d.findIndex(f => f === "entities") > -1;
        })
        .filter(v => !config.blacklist.includes(v));

    for (const ns of topDir) {
        const dirPath = join(config.OGIT, ns, "entities");
        const dir = fs
            .readdirSync(dirPath)
            .map((v: string) => v.split(".").shift());

        if (!dir) {
            console.error("Failed to parse namespace: " + ns);
            continue;
        }

        for (const entity of dir) {
            if (!entity) {
                continue;
            }

            const name = `ogit/${ns}/${entity}`;

            // Delete from TBD list
            delete tbd[name];

            console.log(name);
            output[name] = createMapping(ns, entity);
        }
    }

    Object.keys(tbd).map(key => {
        const data = tbd[key];
        console.log({ data });
        output[key] = createMapping(data.ns, data.name);
    });

    if (fs.existsSync(config.OUTPUT_DIR)) {
        shell.rm("-r", config.OUTPUT_DIR);
    }

    fs.mkdirSync(config.OUTPUT_DIR);

    Object.keys(output).map(key => {
        const name = key
            .toLowerCase()
            .replace("ogit/", "")
            .replace(/\//g, "-");
        fs.writeFileSync(
            config.OUTPUT_DIR + "/" + name + ".js",
            `exports.module = ${JSON.stringify(output[key], null, 2)};`
        );
    });

    fs.writeFileSync(config.OUTPUT_DIR + "/index.js", createIndex(output));
})();
