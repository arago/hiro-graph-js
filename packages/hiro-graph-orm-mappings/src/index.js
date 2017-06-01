/*
 *  Import all for export.
 */
import Account from "./account";
import License from "./license";
import Person from "./person";
import Org from "./org";
import Role from "./role";
import Email from "./email";
import Game from "./game";
import Question from "./question";

//we export an array by default as this is what the schema.define method expects.
export default [Account, License, Person, Org, Role, Email, Game, Question];

//but we also export them as named exports for convenience
export { Account, License, Person, Org, Role, Email, Game, Question };
