import { statSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { safeLoad } from 'js-yaml';

import { $dangerouslyGetProps, $dangerouslyGetRelations } from './entity';

/**
 *  Validate a schema against an OGIT ontology
 *
 *  This allows a schema to validate itself against a given YAML OGIT
 *  ontology definition, either as a single file or multiple (e.g. a cloned repo)
 *
 *  This is important as it allows our schema definitions to remain correct with
 *  respect to the ontology that your GraphIT uses.
 *
 *  This is a `node` only piece of functionality and is intended to run as part of a linting
 *  or testing phase.
 *
 *  NB this will not validate (yet) against a directory of `.ttl` files (like the current OGIT repo)
 *
 *  @param {Schema} schema - the schema to check
 *  @param {string} ontologyLocation - a path to an ontology file or repo.
 *  @return {object} result
 *  @property {number} errors - the number of problems found
 *  @property {object.<string,Array<string>>} detail - the errors grouped by entity name
 */
export default function validate(schema, ontologyLocation) {
    let ontology;

    try {
        ontology = load(ontologyLocation);
    } catch (e) {
        return {
            errors: 1,
            loadOntologyFail: e.message,
        };
    }

    //schema.names has the application name of each entity.
    return schema.names
        .map((name) => schema.get(name))
        .reduce(
            (output, entity) => {
                const errors = validateEntity(entity, ontology);

                if (errors.length) {
                    output.errors += errors.length;
                    output.detail[entity.name] = errors;
                }

                return output;
            },
            { errors: 0, detail: {} },
        );
}

//load an ontology.
//location should be a path
//if a file, load just that.
//if a dir, recurse and load all files.
const load = (location, ontology = emptyOntology()) => {
    const stat = statSync(location);

    if (stat.isDirectory()) {
        readdirSync(location).forEach((entry) => {
            const fullPath = join(location, entry);

            load(fullPath, ontology);
        });
    } else if (stat.isFile() && isYamlFile(location)) {
        const data = safeLoad(readFileSync(location, 'utf8'), {
            onWarning: () => {},
        });

        //data should be an array
        if (Array.isArray(data)) {
            data.forEach((object) => {
                let type, item;

                switch (true) {
                    case 'Entity' in object:
                        type = 'entities';
                        item = object.Entity;
                        break;
                    // we don't actually care about this...
                    // case ("Attribute" in object):
                    //     type = "attributes";
                    //     item = object.Attribute;
                    //     break;
                    case 'Verb' in object:
                        type = 'verbs';
                        item = object.Verb;
                        break;
                    default:
                        //no default
                        return;
                }

                item.__sourcefile__ = location;
                item.ogit = depurl(item.id);
                ontology[type][item.ogit] = item;
            });
        }
    }

    return ontology;
};

const depurl = (name) => name.replace('http://www.purl.org/', '');

const isYamlFile = (file) => /\.ya?ml$/.test(file);

const emptyOntology = () => ({
    entities: {},
    //attributes: {},
    verbs: {},
});

// now the tricky one, validate an entity against an ontology.
//
// The rules are:
//
//  - the entity.ogit name MUST exist in the ontology
//  - any *mandatory* fields in ontology MUST be *required* here.
//  - any required/optional fields using *non-free* attributes MUST reference valid attributes in ontology
//  - any relations must be valid:
//    - all hops have valid verbs for the entities and directions
//    - any filters must be on valid properties
function validateEntity(appEntity, { entities, verbs }) {
    if (appEntity.ogit in entities === false) {
        return [
            `Entity (${appEntity.name}) does not exist in Ontology as '${appEntity.ogit}'`,
        ];
    }

    const ogitEntity = entities[appEntity.ogit];
    const errors = [];

    //check mandatory attributes
    if (ogitEntity.attributes.mandatory) {
        ogitEntity.attributes.mandatory.map(depurl).forEach((attr) => {
            //invalid if not in appEntity.required.
            const prop = appEntity.prop(attr);

            if (!prop) {
                errors.push(
                    `Ontology mandatory field (${attr}) not defined in Entity (${appEntity.name})`,
                );
            } else if (!prop.required) {
                errors.push(
                    `Ontology mandatory field (${attr}) not listed as 'required' in Entity (${appEntity.name})`,
                );
            }
        }, []);
    }

    //check non-free attributes valid
    //first get the list of attributes in this ontology item
    const validAttributes = getValidAttributes(ogitEntity);

    appEntity[$dangerouslyGetProps]() //eslint-disable-line no-unexpected-multiline
        //we are checking non-free attributes. so we remove the free ones
        //and also remove the "ogit" internal attributes
        .filter(
            (prop) => prop.src.charAt(0) !== '/' && !/^ogit\/_/.test(prop.src),
        )
        .filter((prop) => !validAttributes[prop.src]) //remove valid ones.
        .forEach((invalidProp) => {
            //all the remaining are invalid
            errors.push(
                `Entity ${
                    invalidProp.required ? 'required' : 'optional'
                } property (${
                    invalidProp.dst
                }) does not reference an available attribute in Ontology (${
                    invalidProp.src
                })`,
            );
        });

    //now check relations.
    const relations = appEntity[$dangerouslyGetRelations]();

    Object.keys(relations).forEach((alias) => {
        let startNodes = [appEntity.ogit];
        let broken = false;

        relations[alias].hops.forEach((hop, i) => {
            if (broken) {
                return;
            }

            const { direction, verb, filter, vertices } = hop;

            //first check the verb exists.
            if (verb in verbs === false) {
                errors.push(
                    `Relation (${alias}) invalid at hop (${i +
                        1}): Verb (${verb}) does not exist in ontology.`,
                );
                broken = false;

                return;
            }

            const connections = getValidConnections(verbs[verb]);

            vertices.forEach((endNode) => {
                startNodes.forEach((startNode) => {
                    const key =
                        direction === 'out'
                            ? [startNode, endNode]
                            : [endNode, startNode];

                    if (!connections[key.join()]) {
                        errors.push(
                            `Relation (${alias}) invalid at hop (${i +
                                1}): Connection from '${
                                key[0]
                            } --> ${verb} -> ${key[1]}' not allowed.`,
                        );
                    }
                });

                // also check the endNodes for filter props if filter exists and has
                // non-free attributes in it.
                if (filter) {
                    const endDefinition = entities[endNode];
                    const validEndAttributes = getValidAttributes(
                        endDefinition,
                    );

                    Object.keys(filter)
                        //remove any free or internal props.
                        .filter(
                            (prop) =>
                                prop.src.charAt(0) !== '/' ||
                                !/^ogit\/_/.test(prop.src),
                        )
                        //remove valid props.
                        .filter((prop) => !validEndAttributes[prop])
                        //the rest are errors
                        .forEach((prop) =>
                            errors.push(
                                `Relation (${alias}) invalid at hop (${i +
                                    1}): filter contains invalid prop (${prop}) for Entity (${endNode})`,
                            ),
                        );
                }
            });
            //now switch the start nodes and let it repeat.
            startNodes = vertices;
        });
    });

    return errors;
}

const validAttributeCache = {};

function getValidAttributes(entity) {
    if (entity.ogit in validAttributeCache === false) {
        validAttributeCache[entity.ogit] = (entity.attributes.mandatory || [])
            .concat(entity.attributes.optional || [])
            .map(depurl)
            .reduce((valid, attr) => ((valid[attr] = true), valid), {});
    }

    return validAttributeCache[entity.ogit];
}

const validConnectionsCache = {};

function getValidConnections(verb) {
    if (verb.ogit in validConnectionsCache === false) {
        validConnectionsCache[verb.ogit] = (verb.allowed || [])
            .map(({ from, to }) => [depurl(from), depurl(to)].join())
            .reduce((valid, attr) => ((valid[attr] = true), valid), {});
    }

    return validConnectionsCache[verb.ogit];
}
