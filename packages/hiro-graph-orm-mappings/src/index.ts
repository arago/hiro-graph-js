import fs from "fs";
import { join } from "path";
import shell from "shelljs";
import Mustache from "mustache";

import {
    getRequiredAttributes,
    getOptionalAttributes,
    getRelations
} from "./regex";
import {
    getName,
    flipRelationshipName,
    toTypes,
    toProp,
    cleanName
} from "./helper";
import { mapRelationship } from "./relations";

import config from "../config.json";

const tbd: IToBeDone = {};

const addRelation = (parentDir: string) => (v: string[], from: string) => {
    const to = v[1].replace("oslc", "OSLC");
    if (!output[to]) {
        const name = getName(to);
        output[to] = { name: name.ns + name.name, ogit: to };
        tbd[to] = { ...name, parentDir };
    }

    if (!output[to].relations) {
        output[to].relations = {};
    }

    const left = v[0].split("/").pop() || "";
    const safeLeft = flipRelationshipName(left);
    const right = from.split("/").pop() || "";

    if (!left || !right) {
        throw Error(`Failed to add relation: ${v} [${from}]`);
    }

    const relationship = v[0] + " <- " + from;
    // @ts-ignore
    output[to].relations[
        mapRelationship(relationship, safeLeft + right)
    ] = relationship;
};

const createMapping = (
    namespace: string,
    name: string,
    parentDir: string
): IDefinition => {
    const filePath =
        namespace && namespace !== "sgo"
            ? join(parentDir, "../NTO", namespace, "entities", `${name}.ttl`)
            : join(parentDir, "../SGO/sgo", "entities", `${name}.ttl`);

    const data = fs.readFileSync(filePath).toString();

    const finalNamespace = namespace.replace(/-/g, "");
    const ogit =
        namespace && namespace !== "sgo"
            ? `ogit/${namespace}/${name}`
            : `ogit/${name}`;

    const currentValue = output[ogit];
    const required = getRequiredAttributes(data);

    // @ts-ignore
    const additionalData = config.extras[ogit] || {};
    const optional = { ...getOptionalAttributes(data), ...additionalData };

    const relations = getRelations(
        data,
        ogit,
        currentValue ? currentValue.relations || {} : undefined,
        addRelation(parentDir)
    );

    return {
        name: cleanName(namespace, finalNamespace, name),
        ogit,
        required,
        optional,
        relations
    };
};

const getEntitiesInFolder = (
    folder: string
): { ns: string; parent: string }[] =>
    fs
        .readdirSync(folder)
        .map((v: string) => v.split(".").shift() || "")
        .filter(v => {
            const dirPath = join(folder, v);
            return (
                fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()
            );
        })
        .filter(v => {
            const dirPath = join(folder, v);
            const d = fs.readdirSync(dirPath);
            return d.findIndex(f => f === "entities") > -1;
        })
        .filter(v => !(config.blacklist as string[]).includes(v))
        .map(ns => ({ ns, parent: folder }));

const output: IOutput = {};

(async () => {
    const topDir = [
        ...getEntitiesInFolder(config.OGIT + "/NTO"),
        { ns: "sgo", parent: config.OGIT + "/SGO" }
    ];

    console.group("Build:", config.OGIT);
    for (const { ns, parent } of topDir) {
        const dirPath = join(parent, ns, "entities");
        const dir = fs
            .readdirSync(dirPath)
            .map((v: string) => v.split(".").shift() || "")
            .filter(
                v => !(config.blacklist as string[]).includes(ns + "/" + v)
            );

        if (!dir) {
            console.error("Failed to parse namespace: " + ns);
            continue;
        }

        for (const entity of dir) {
            if (!entity) {
                continue;
            }

            const name = (ns === "sgo"
                ? `ogit/${entity}`
                : `ogit/${ns}/${entity}`
            ).replace("oslc", "OSLC");

            // Delete from TBD list
            delete tbd[name];

            console.log(name);
            output[name] = createMapping(ns, entity, parent);
        }
    }
    console.groupEnd();

    // Handle dependencies until none
    console.group("Build: deps");
    for (let keys; (keys = Object.keys(tbd)); ) {
        // Check if empty
        if (keys.length === 0) {
            break;
        }

        const key = keys.pop() || "";

        // Check if already done
        if (output[key] && (output[key].optional || output[key].required)) {
            delete tbd[key];
            continue;
        }

        // Handle mapping
        const data = tbd[key];
        console.log(key);
        output[key] = createMapping(data.ns, data.name, data.parentDir);

        // Remove when done
        delete tbd[key];
    }
    console.groupEnd();

    if (fs.existsSync(config.OUTPUT_DIR)) {
        console.log("Remove build dir:", config.OUTPUT_DIR);
        shell.rm("-r", config.OUTPUT_DIR);
    }

    console.log("Create build dir:", config.OUTPUT_DIR);
    fs.mkdirSync(config.OUTPUT_DIR);

    // Write each mapping to a mapping file, typings and GraphVertex
    const templates = {
        mapping: fs.readFileSync("./src/templates/mapping.mustache").toString(),
        mappingTypes: fs
            .readFileSync("./src/templates/mappingTypes.mustache")
            .toString(),
        index: fs.readFileSync("./src/templates/index.mustache").toString(),
        typings: fs.readFileSync("./src/templates/typings.mustache").toString()
    };
    const exports: Array<{ name: string; fileName: string }> = [];

    Object.keys(output).map(key => {
        const fileName = key
            .toLowerCase()
            .replace("ogit/", "")
            .replace(/\//g, "-").trim();
        const name = output[key].name
            .replace(/-|\//g, "")
            .replace("oslc", "OSLC");

        // Export js
        fs.writeFileSync(
            join(config.OUTPUT_DIR, `${fileName}.js`),
            Mustache.render(templates.mapping, {
                mapping: JSON.stringify(output[key])
            })
        );

        // Export types
        const props = [
            ...Object.keys(output[key].optional || {}),
            ...Object.keys(output[key].required || {})
        ]
            .map(k => `"${k}"`)
            .join("|");

        fs.writeFileSync(
            join(config.OUTPUT_DIR, `${fileName}.d.ts`),
            Mustache.render(templates.mappingTypes, {
                name,
                required: output[key].required,
                optional: output[key].optional,
                relations: output[key].relations,
                relationKeys: Object.keys(output[key].relations || {}),
                props: props || `""`,
                toTypes,
                toProp
            })
        );
        exports.push({ name, fileName });
    });

    // Create index.js
    fs.writeFileSync(
        join(config.OUTPUT_DIR, `index.js`),
        Mustache.render(templates.index, {
            exports
        })
    );

    // Create index.d.ts
    fs.writeFileSync(
        join(config.OUTPUT_DIR, `index.d.ts`),
        Mustache.render(templates.typings, {
            exports
        })
    );
})();
