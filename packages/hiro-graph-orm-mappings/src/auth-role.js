export default {
    name: "AuthRole",
    ogit: "ogit/Auth/Role",
    mandatory: {
        edgeRule: "ogit/Auth/edgeRule",
        vertexRule: "ogit/Auth/vertexRule",
        name: "ogit/name"
    },
    optional: {
        description: "ogit/description"
    },
    relations: {
        assignments: "ogit/Auth/assigns <- ogit/Auth/RoleAssignment",
        account: "ogit/Auth/assumes <- ogit/Auth/Account "
    }
};
