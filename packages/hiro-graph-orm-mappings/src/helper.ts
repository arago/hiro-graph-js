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
    const names: Array<{ name: string; fileName: string }> = [];
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
        exports += `    ${safeName}.default${
            i === keys.length - 1 ? "" : ",\n"
        }`;
        singleExports += `exports.${safeName} = ${safeName}.default;`;
        names.push({ name: safeName, fileName });
    });

    return { imports, exports, singleExports, names };
};

export const createTypings = (output: IOutput) => {
    const { names } = generateOutputs(output);
    return `declare const mapping: Array<IDefinition>;
export default mapping;

export interface IDefinitionData {
    [index: string]: string;
}

export interface ICoreAttributes {
    optional?: {
      _id?: string;
      "_modified-on"?: string;
    }
}

export interface IDefinition {
    name: string;
    ogit: string;
    required?: IDefinitionData;
    optional?: IDefinitionData;
    relations?: IDefinitionData;
}

${names
        .map(({ name: n, fileName: f }) => `import { I${n} } from "./${f}";`)
        .join("\n")}

export type MappedTypes = keyof typeof Definitions;

export namespace Definitions {
${names.map(({ name: n }) => `    export const ${n}: I${n};`).join("\n")}
}

${names.map(({ name: n }) => `export const ${n}: I${n};`).join("\n")}

${names
        .map(
            ({ name: n }) =>
                `export type I${n} = (typeof ${n}) & ICoreAttributes;`
        )
        .join("\n")}
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

export const createExport = (output: IDefinition) => {
    return `"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = ${JSON.stringify(output, null, 2)}
`;
};

export const createExportTypes = (output: IDefinition) => {
    return `import { IDefinition } from ".";

export interface I${output.name.replace(/-|\//g, "")} extends IDefinition{
${Object.keys(output)
        .map(key => valueToType(key, output[key]))
        .join("\n")}
}`;
};

const valueToType = (
    key: string,
    value?: string | IDefinitionData
): string | undefined => {
    const valueType = typeof value;

    if (valueType === "string") {
        return `${key}: string;`;
    } else if (value && valueType === "object") {
        return `${key}: {
        ${Object.keys(value)
            .map(k => valueToType(k, (value as IDefinitionData)[k]))
            .join("\n")}
    }`;
    }

    return;
};
