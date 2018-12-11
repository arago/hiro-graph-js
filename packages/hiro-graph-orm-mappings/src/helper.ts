export const getName = (value: string) => {
    const split = value.split("/");
    if (split.length === 2) {
        return { ns: "", name: split[1] };
    } else if (split.length === 4) {
        return {
            name: split[split.length - 1],
            ns: split[split.length - 3] + "/" + split[split.length - 2]
        };
    }

    return { ns: split[split.length - 2], name: split[split.length - 1] };
};

export const flipRelationshipName = (value: string) => {
    if (value.endsWith("s")) {
        if (value === "belongs") {
            return "owns";
        }
        return value.charAt(value.length - 2) === "e"
            ? value.substr(0, value.length - 2) + "edBy"
            : value.substr(0, value.length - 1) + "edBy";
    } else if (value.endsWith("To")) {
        return value + "By";
    } else if (value === "runsOn") {
        return "runnable";
    } else if (value.endsWith("With")) {
        return value.substr(0, value.length - 4) + "From";
    } else if (value === "derivesFrom") {
        return "deriving";
    } else if (value === "dependsOn") {
        return "dependant";
    }

    return value;
};

const generateOutputs = (output: IOutput) => {
    let imports = "";
    let exports = "";
    let singleExports = "";
    const names: string[] = [];
    const keys = Object.keys(output).sort((a, b) => {
        if (a === b) {
            return 0;
        }
        if (a > b) {
            return 1;
        }
        return -1;
    });
    keys.map((key, i) => {
        const value = output[key];
        const safeName = value.name.replace(/-|\//g, "");
        const fileName = key
            .toLowerCase()
            .replace("ogit/", "")
            .replace(/\//g, "-");

        imports += `const ${safeName} = require("./${fileName}");\n`;
        exports += `    ${safeName}${i === keys.length - 1 ? "" : ",\n"}`;
        singleExports += `exports.${safeName} = ${safeName};`;
        names.push(safeName);
    });

    return { imports, exports, singleExports, names };
};

export const createTypings = (output: IOutput) => {
    const { exports, names } = generateOutputs(output);
    return `declare module "hiro-graph-orm-mappings" {
    export interface IEntity {
        name: string;
        ogit: string;
        required?: IData;
        optional?: IData;
        relations?: IData;
    }

    export type MappedTypes =
${names.map(n => `        | "${n}"`).join("\n")};

${names.map(n => `    export const ${n}: IEntity;`).join("\n")}

    export default [
${names.map(n => `        ${n},`).join("\n")}
    ];
}
`;
};

export const createIndex = (output: IOutput) => {
    const { imports, exports, singleExports } = generateOutputs(output);
    return `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

${imports}

exports.default = [
${exports}
];

${singleExports}
`;
};

// \nexport default [\n${exports}\n];
