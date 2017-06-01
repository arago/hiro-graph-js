/**
 *  A non-arago-id account, e.g. OAuth like facebook, google, etc...
 */
export default {
    name: "Role",
    ogit: "ogit/Role",
    required: {
        name: "ogit/name"
    },
    optional: {
        desc: "ogit/description",
        boss: "/boss",
        status: "ogit/status"
    },
    relations: {
        owner: "ogit/complies -> ogit/Person",
        org: "ogit/defines <- ogit/Organization"
    }
};
