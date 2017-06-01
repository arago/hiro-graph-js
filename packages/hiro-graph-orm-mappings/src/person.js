/**
 *  A person vertex
 */
export default {
    name: "Person",
    ogit: "ogit/Person",
    required: {},
    optional: {
        profileSet: {
            src: "/profileSet",
            type: "bool"
        },
        email: "ogit/email",
        firstName: "ogit/firstName",
        lastName: "ogit/lastName",
        username: "ogit/alternativeName",
        status: "ogit/status"
    },
    relations: {
        leads: "ogit/leads -> ogit/Organization",
        managers: "ogit/reports -> ogit/Person",
        orgs: "ogit/belongs -> ogit/Organization",
        subordinates: "ogit/reports <- ogit/Person",
        manages: "ogit/manages -> ogit/Organization",
        licenses: "ogit/uses -> ogit/License",
        licenseRequests: "ogit/requests -> ogit/LicenseRequest",
        accounts: "ogit/connects <- ogit/Account",
        roles: "ogit/complies -> ogit/Role",
        socialAccounts: "ogit/connects <- ogit/Account",
        emails: "ogit/connects <- ogit/Email"
    }
};
