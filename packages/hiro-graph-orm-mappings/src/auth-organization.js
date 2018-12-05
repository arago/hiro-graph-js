export default {
    name: "AuthOrganization",
    ogit: "ogit/Auth/Organization",
    mandatory: {
        name: "ogit/name"
    },
    optional: {
        description: "ogit/description"
    },
    relations: {
        teams: "ogit/Auth/belongs <- ogit/Auth/Team",
        scopes: "ogit/Auth/belongs <- ogit/Auth/DataScope",
        domains: "ogit/Auth/belongs <- ogit/Auth/OrgDomain",
        accounts: "ogit/Auth/isMemberOf <- ogit/Auth/Account",
        contract: "ogit/concludes -> ogit/Contract"
    }
};
