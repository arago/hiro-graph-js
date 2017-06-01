/**
 *  A game
 */
export default {
    name: "Game",
    ogit: "ogit/UserMeta/Game",
    required: { },
    optional: {
        question: "/question",
        relevance: "/relevance"
    },
    relations: {
        plays: "ogit/UserMeta/plays <- ogit/Person",
        wins: "ogit/UserMeta/wins <- ogit/Person",
        loses: "ogit/UserMeta/loses <- ogit/Person"
    }
};
