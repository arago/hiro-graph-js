/**
 *  An organization/team/group
 */
export default {
    name: "Email",
    ogit: "ogit/Email",
    required: {},
    optional: {
        status: "ogit/status"
    },
    relations: {
        owner: "ogit/connects <- ogit/Person"
    }
};
