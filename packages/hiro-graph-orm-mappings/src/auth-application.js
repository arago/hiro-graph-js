export default {
    name: "AuthApplication",
    ogit: "ogit/Auth/Application",
    mandatory: {
        edgeRule: "ogit/Auth/edgeRule",
        vertexRule: "ogit/Auth/vertexRule",
        description: "ogit/description",
        name: "ogit/name"
    },
    optional: {
        parent: "ogit/Auth/Application/parent",
        status: "ogit/Auth/Application/status",
        type: "ogit/Auth/Application/type",
        urls: "ogit/Auth/Application/urls",
        allowedTypes: "ogit/Auth/allowedTypes"
    },
    relations: {
        consentedUsers: "ogit/Auth/consents <- ogit/Auth/Account",
        notifcations: "ogit/includes -> ogit/Notification",
        ratings: "ogit/rates <- ogit/Rating",
        reviews: "ogit/reviews <- ogit/Auth/ApplicationReview",
        users: "ogit/Auth/uses <- ogit/Auth/Account",
        versionsOut: "ogit/versions -> ogit/Auth/Application",
        versionsIn: "ogit/versions <- ogit/Auth/Application"
    }
};
