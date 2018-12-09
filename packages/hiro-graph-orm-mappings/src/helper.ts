export const getName = (value: string) => {
    const split = value.replace(/-/g, "").split("/");
    if (split.length === 2) {
        return split[1];
    }

    return split[split.length - 2] + split[split.length - 1];
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
        const fileName = key
            .toLowerCase()
            .replace("ogit/", "")
            .replace(/\//g, "-");

        imports += `const ${value.name} = require("./${fileName}");\n`;
        exports += `    ${value.name}${i === keys.length - 1 ? "" : ",\n"}`;
        singleExports += `exports.${value.name} = ${value.name};`;
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
