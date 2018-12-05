export default {
    name: "AuthAccount",
    ogit: "ogit/Auth/Account",
    required: {
        name: "ogit/name",
        status: "ogit/status"
    },
    optional: {
        acceptedPrivacy: "ogit/Auth/Account/acceptedPrivacy",
        acceptedTerms: "ogit/Auth/Account/acceptedTerms",
        allowCookies: "ogit/Auth/Account/allowCookies",
        statusReason: "ogit/Auth/Account/statusReason",
        email: "ogit/email"
    },
    relations: {
        profiles: "ogit/Auth/belongs <- ogit/Auth/AccountProfile",
        events: "ogit/alerts <- ogit/Event",
        roles: "ogit/Auth/assumes -> ogit/Auth/Role",
        acceptedApplications: "ogit/Auth/consents -> ogit/Auth/Application",
        orgs: "ogit/Auth/isMemberOf -> ogit/Auth/Organization",
        teams: "ogit/Auth/isMemberOf -> ogit/Auth/Team",
        usedApplications: "ogit/Auth/uses -> ogit/Auth/Application",
        termsAndConditions: "ogit/accepts -> ogit/TermsAndConditions",
        person: "ogit/belongs -> ogit/Person",
        reviews: "ogit/creates -> ogit/Auth/ApplicationReview",
        subscribes: "ogit/manages -> ogit/Subscription",
        rates: "ogit/provides -> ogit/Rating"
    }
};
