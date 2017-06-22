import createEntity, { $internal } from "./entity";
import { mapIfArray } from "../utils";

const defaultOptions = {
    immutable: true
};

/**
 *  Defines an Ontology to application mapping
 */
export default class Schema {
    /**
     *  @param {Array<object>} initialDefinitions - definitions to apply on create
     */
    constructor(initialDefinitions = false, opts = {}) {
        this._changeListeners = [];
        this.options = {
            ...defaultOptions,
            ...opts
        };

        this.__init = () => {
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
        };

        this.__init();

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

        if (initialDefinitions) {
            this.define(initialDefinitions);
        }

        /**
         *  Define a new entity type in the Schema
         *
         *  @param {object} entityMapping - the definition
         *  @return {undefined}
         */
        this.__define = entityMapping => {
            const { immutable } = this.options;
            let exists = false;
            const entity = createEntity(entityMapping, this);
            if (entity.name in this.entities) {
                if (immutable) {
                    throw new Error(`duplicate entity name: ${entity.name}`);
                }
                exists = true;
            }
            if (entity.ogit in this.entities) {
                if (immutable) {
                    throw new Error(
                        `duplicate entity for vertex type: ${entity.ogit}`
                    );
                }
            }
            this.entities[entity.name] = entity;
            this.entities[entity.ogit] = entity;
            if (!exists) {
                this.names.push(entity.name);
            }
        };

        this.setSchema = entityMapping => {
            const { immutable } = this.options;
            if (immutable) {
                throw new TypeError("Cannot setSchema when `immutable: true`");
            }
            this.__init();
            return this.define(entityMapping);
        };

        this.updateSchema = entityMapping => {
            const { immutable } = this.options;
            if (immutable) {
                throw new TypeError(
                    "Cannot updateSchema when `immutable: true`"
                );
            }
            return this.define(entityMapping);
        };
    }
    /**
     *  Define a entity type(s) in the Schema and emit the update event
     *
     *  @param {object} entityMapping - the definition
     *  @return {undefined}
     */
    define(entityMapping) {
        //allows define to work seamlessly with single and arrays of definitions
        mapIfArray(this.__define)(entityMapping);
        this.emitUpdate();
    }

    emitUpdate() {
        this._changeListeners.forEach(fn => {
            fn(this);
        });
    }

    addUpdateListener(fn) {
        if (this._changeListeners.indexOf(fn) === -1) {
            this._changeListeners.push(fn);
        }
        return () => {
            this._changeListeners.splice(this._changeListeners.indexOf(fn), 1);
        };
    }

    removeUpdateListener(fn) {
        const idx = this._changeListeners.indexOf(fn);
        if (idx > -1) {
            this._changeListeners.splice(idx, 1);
        }
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
