export default {
    name: "ApplicationReview",
    ogit: "ogit/Auth/ApplicationReview",
    required: {
        name: "ogit/name",
        status: "ogit/status"
    },
    optional: {
        comment: "ogit/comment"
    },
    relations: {
        reviewers: "ogit/creates <- ogit/Auth/Account",
        applications: "ogit/reviews -> ogit/Auth/Application"
    }
};
