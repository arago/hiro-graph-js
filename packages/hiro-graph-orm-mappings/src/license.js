/**
 *  A software license
 */
export default {
    name: "License",
    ogit: "ogit/License",
    required: {
        ident: "ogit/id"
    },
    optional: {
        created: {
            src: "ogit/createdAt",
            type: "iso8601"
        },
        expires: {
            src: "ogit/expirationDate",
            type: "iso8601"
        },
        validFrom: {
            src: "ogit/validFrom",
            type: "iso8601"
        },
        key: "ogit/licenseKey",
        type: "ogit/licenseType",
        subject: "ogit/subject"
    },
    relations: {
        users: "ogit/uses <- ogit/Person|ogit/Organization",
        people: "ogit/uses <- ogit/Person",
        orgs: "ogit/uses <- ogit/Organization",
        previous: "ogit/precedes -> ogit/License",
        next: "ogit/precedes <- ogit/License"
    }
};
