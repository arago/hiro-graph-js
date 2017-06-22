/**
 *  A non-arago-id account, e.g. OAuth like facebook, google, etc...
 */
export default {
    name: "Account",
    ogit: "ogit/Account",
    required: {},
    optional: {
        desc: "ogit/description",
        email: "ogit/email",
        ident: "ogit/id",
        name: "ogit/name"
    },
    relations: {
        owner: "ogit/connects -> ogit/Person"
    }
};
