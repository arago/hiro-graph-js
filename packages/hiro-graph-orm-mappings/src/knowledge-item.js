/**
 *  A Knowledge Item
 */
export default {
    name: "KnowledgeItem",
    ogit: "ogit/Automation/KnowledgeItem",
    required: {
        body: "ogit/Automation/knowledgeItemFormalRepresentation",
        deployToEngine: {
            src: "ogit/Automation/deployToEngine",
            type: "bool"
        }
    },
    optional: {
        modified: "ogit/modificationTime",
        isValid: {
            src: "ogit/isValid",
            type: "bool"
        },
        tier: "ogit/Automation/knowledgeItemTier",
        creationTime: {
            src: "ogit/creationTime",
            type: "timestamp"
        },
        name: "ogit/name",
        description: "ogit/description",
        changelog: "ogit/changeLog",
        accessControl: "ogit/accessControl",
        isDeployed: {
            src: "ogit/Automation/isDeployed",
            type: "bool"
        },
        deployStatus: "ogit/Automation/deployStatus"
    },
    relations: {
        comments: "ogit/connects <- ogit/Comment",
        links: "ogit/connects -> ogit/Hyperlink"
    }
};
