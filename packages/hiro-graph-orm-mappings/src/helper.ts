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

export const createIndex = (output: IOutput) => {
    let imports = "";
    let exports = "";
    let singleExports = "";
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
    });

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
