export default {
    name: "AuthAccountProfile",
    ogit: "ogit/Auth/AccountProfile",
    optional: {
        emails: "ogit/Auth/Account/acceptedEmails",
        status: "ogit/Auth/Account/displayName"
    },
    relations: {
        attachments: "ogit/belongs <- ogit/Attachment",
        account: "ogit/Auth/belongs -> ogit/Auth/Account"
    }
};
