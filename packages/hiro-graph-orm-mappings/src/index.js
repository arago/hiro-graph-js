/*
 *  Import all for export.
 */
import Account from "./account";
import AuthAccount from "./auth-account";
import CustomApplicationData from "./custom-application-data";
import Email from "./email";
import Game from "./game";
import KnowledgeItem from "./knowledge-item";
import License from "./license";
import Notification from "./notification";
import Org from "./org";
import Person from "./person";
import Question from "./question";
import Role from "./role";

//we export an array by default as this is what the schema.define method expects.
export default [
    Account,
    AuthAccount,
    CustomApplicationData,
    Email,
    Game,
    KnowledgeItem,
    License,
    Notification,
    Org,
    Person,
    Question,
    Role
];

//but we also export them as named exports for convenience
export {
    Account,
    AuthAccount,
    CustomApplicationData,
    Email,
    Game,
    KnowledgeItem,
    License,
    Notification,
    Org,
    Person,
    Question,
    Role
};
