/**
 *  An organization/team/group
 */
export default {
    name: "Org",
    ogit: "ogit/Organization",
    required: {
        name: "ogit/name"
    },
    optional: {
        desc: "ogit/description",
        email: "ogit/email",
        purpose: "ogit/function",
        status: "ogit/status",
        url: "ogit/webPage"
    },
    relations: {
        leader: "ogit/leads <- ogit/Person|ogit/Organization",
        members: "ogit/belongs <- ogit/Person",
        supports: "ogit/supports -> ogit/Organization",
        supported: "ogit/supports <- ogit/Organization",
        governs: "ogit/governs -> ogit/Organization",
        governed: "ogit/governs <- ogit/Organization",
        related: "ogit/relates -> ogit/Organization",
        admin: "ogit/manages <- ogit/Person"
    }
};
