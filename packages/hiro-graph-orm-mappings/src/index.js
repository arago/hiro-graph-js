/*
 *  Import all for export.
 */
import Account from "./account";
import License from "./license";
import Person from "./person";
import Org from "./org";
import Role from "./role";

//we export an array by default as this is what the schema.define method expects.
export default [Account, License, Person, Org, Role];

//but we also export them as named exports for convenience
export { Account, License, Person, Org, Role };
