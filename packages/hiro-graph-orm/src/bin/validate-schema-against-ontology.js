#!/usr/bin/env node
/**
 *  Validate a schema against an ontology
 *
 *  Usage:
 *      validate <module_path> <ontology_path>
 *
 *  `module_path` should be a path to a javascript module that exports
 *  the schema definitions you want to validate (or a schema object)
 *
 *  `ontology_path` should be the path to you ontology, either a file or a base directory.
 */
const [modulePath, ontologyPath] = process.argv.slice(2, 4);
import { join } from "path";
import Schema from "../schema";
import validate from "../schema/validate";

let module = require(join(process.cwd(), modulePath).replace(/\/$/, ""));
if (module.__esModule) {
    module = module.default;
}

if (module instanceof Schema === false) {
    module = new Schema(module);
}

const result = validate(module, ontologyPath);

console.log(result);
process.exit(result.errors);
