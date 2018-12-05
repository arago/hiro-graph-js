export default {
    name: "AuthTeam",
    ogit: "ogit/Auth/Team",
    mandatory: {
        name: "ogit/name"
    },
    optional: {
        description: "ogit/description"
    },
    relations: {
        accounts: "ogit/Auth/isMemberOf <- ogit/Auth/Account",
        assignments: "ogit/Auth/assigns <= ogit/Auth/RoleAssignment",
        orgs: "ogit/Auth/isMemberOf -> ogit/Auth/Organization",
        parents: "ogit/Auth/isMemberOf -> ogit/Auth/Team",
        teams: "ogit/Auth/belongs <- ogit/Auth/Team"
    }
};
