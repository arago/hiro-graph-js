import createEntity, { $internal } from "./entity";
import { mapIfArray } from "../utils";

/**
 *  Defines an Ontology to application mapping
 */
export default class Schema {
    /**
     *  @param {Array<object>} initialDefinitions - definitions to apply on create
     */
    constructor(initialDefinitions = false) {
        /**
         *  the entity lookup table
         *
         *  @private
         *  @type {object<string, Entity>}
         */
        this.entities = {};
        /**
         *  the list of all entity names
         *
         *  @private
         *  @type {Array<string>}
         */
        this.names = [];

        /**
         *  The internal only type entity
         *
         *  @private
         *  @type {Entity}
         */
        this.internal = createEntity(
            {
                [$internal]: true
            },
            this
        );

        //allows define to work seamlessly with single and arrays of definitions
        this.define = mapIfArray(this.define.bind(this));

        if (initialDefinitions) {
            this.define(initialDefinitions);
        }
    }

    /**
     *  Define a new entity type in the Schema
     *
     *  @param {object} entityMapping - the definition
     *  @return {undefined}
     */
    define(entityMapping) {
        const entity = createEntity(entityMapping, this);
        if (entity.name in this.entities) {
            throw new Error(`duplicate entity name: ${entity.name}`);
        }
        if (entity.ogit in this.entities) {
            throw new Error(`duplicate entity for vertex type: ${entity.ogit}`);
        }
        this.entities[entity.name] = entity;
        this.entities[entity.ogit] = entity;
        this.names.push(entity.name);
    }

    /**
     *  Retrieve an entity by app name or OGIT name
     *
     *  A special case when no argument is given returns the *internal*
     *  entity, which can translate OGIT internal props only.
     *
     *  @param {?string} entityType - the name or OGIT name of the entity
     *  @return {?Entity} - may be null if the type given does not exist
     */
    get(entityType = false) {
        //special case for no type given
        if (!entityType) {
            return this.internal;
        }
        return this.entities[entityType];
    }
}
