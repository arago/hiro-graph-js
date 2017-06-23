/**
 *  A notification event
 */
export default {
    name: "Notification",
    ogit: "ogit/Notification",
    required: {},
    optional: {
        title: "/title",
        action: "/action",
        appId: "/appId",
        message: "/message",
        rank: "/rank"
    },
    relations: {
        sends: "ogit/sends <- ogit/Software/Application"
    }
};
