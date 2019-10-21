// this is just a tiny subset of the ontology
const profile = {
    name: 'AuthAccountProfile',
    ogit: 'ogit/Auth/AccountProfile',
    required: {},
    optional: {
        displayName: 'ogit/Auth/Account/displayName',
        acceptedEmails: 'ogit/Auth/Account/acceptedEmails',
        firstName: 'ogit/firstName',
        lastName: 'ogit/lastName',
        defaultOrg: '/defaultOrg',
        jobRole: '/jobRole',
        profilePicture: '/profilePicture',
        profileSet: '/profileSet',
    },
    relations: {
        account: 'ogit/Auth/belongs -> ogit/Auth/Account',
        ownsAttachment: 'ogit/belongs <- ogit/Attachment',
    },
};

const account = {
    name: 'AuthAccount',
    ogit: 'ogit/Auth/Account',
    required: {
        name: 'ogit/name',
        status: 'ogit/status',
        type: 'ogit/Auth/Account/type',
    },
    optional: {
        email: 'ogit/email',
        acceptedPrivacy: 'ogit/Auth/Account/acceptedPrivacy',
        acceptedTerms: 'ogit/Auth/Account/acceptedTerms',
        acceptedProjectTerms: 'ogit/Auth/Account/acceptedProjectTerms',
        allowCookies: 'ogit/Auth/Account/allowCookies',
        statusReason: 'ogit/Auth/Account/statusReason',
    },
    relations: {
        managesSubscription: 'ogit/manages -> ogit/Subscription',
        createsApplicationReview: 'ogit/creates -> ogit/Auth/ApplicationReview',
        acceptsTermsAndConditions: 'ogit/accepts -> ogit/TermsAndConditions',
        person: 'ogit/belongs -> ogit/Person',
        providesRating: 'ogit/provides -> ogit/Rating',
        assumesRole: 'ogit/Auth/assumes -> ogit/Auth/Role',
        usesApplication: 'ogit/Auth/uses -> ogit/Auth/Application',
        consentsApplication: 'ogit/Auth/consents -> ogit/Auth/Application',
        orgs: 'ogit/Auth/isMemberOf -> ogit/Auth/Organization',
        teams: 'ogit/Auth/isMemberOf -> ogit/Auth/Team',
        consumesMilestone: 'ogit/consumes -> ogit/Project/Milestone',
        consumesProject: 'ogit/consumes -> ogit/Project/Project',
        supervisesProject: 'ogit/supervises -> ogit/Project/Project',
        supervisesContract: 'ogit/supervises -> ogit/Contract',
        producesMilestone: 'ogit/produces -> ogit/Project/Milestone',
        producesProject: 'ogit/produces -> ogit/Project/Project',
        supportsMilestone: 'ogit/supports -> ogit/Project/Milestone',
        supportsProject: 'ogit/supports -> ogit/Project/Project',
        definesFilter: 'ogit/defines -> ogit/UserMeta/Filter',
        repliedWithReply: 'ogit/repliedWith -> ogit/Survey/Reply',
        profile: 'ogit/Auth/belongs <- ogit/Auth/AccountProfile',
        alertedByEvent: 'ogit/alerts <- ogit/Event',
    },
};

export function createProfile(id) {
    return {
        'ogit/_id': `${id}-profile`,
        'ogit/_type': 'ogit/Auth/AccountProfile',
        'ogit/firstName': `Jane (${id})`,
        'ogit/lastName': `Doe (${id})`,
        'ogit/displayName': `jane-doe-${id}`,
    };
}

export function createAccount(id) {
    return {
        'ogit/_id': `${id}-account`,
        'ogit/_type': 'ogit/Auth/Account',
        'ogit/email': `jane.${id}@doe`,
    };
}

export function createTeam(id) {
    return {
        'ogit/_id': id,
        'ogit/_type': 'ogit/Auth/Team',
        'ogit/name': id,
    };
}

const team = {
    name: 'AuthTeam',
    ogit: 'ogit/Auth/Team',
    required: { name: 'ogit/name' },
    optional: { description: 'ogit/description' },
    relations: {
        members: 'ogit/Auth/isMemberOf <- ogit/Auth/Account',
        assignedByRoleAssignment:
            'ogit/Auth/assigns <- ogit/Auth/RoleAssignment',
        ownsTeam: 'ogit/Auth/belongs <- ogit/Auth/Team',
        belongsTeam: 'ogit/Auth/belongs -> ogit/Auth/Team',
        parentOrg: 'ogit/Auth/belongs -> ogit/Auth/Organization',
    },
};

const org = {
    name: 'Org',
    ogit: 'ogit/Organization',
    required: {
        name: 'ogit/name',
    },
    optional: {
        desc: 'ogit/description',
        email: 'ogit/email',
        purpose: 'ogit/function',
        status: 'ogit/status',
        url: 'ogit/webPage',
    },
    relations: {
        members: 'ogit/belongs <- ogit/Person',
        related: 'ogit/relates -> ogit/Organization',
        admin: 'ogit/manages <- ogit/Person',
    },
};
export function createOrg(id, purpose = 'Parent Organization') {
    return {
        'ogit/_id': id,
        'ogit/_type': 'ogit/Organization',
        'ogit/name': `orgName (${id})`,
        'ogit/function': purpose,
        'ogit/status': 'active',
    };
}

const email = {
    name: 'Email',
    ogit: 'ogit/Email',
    required: {},
    optional: {
        status: 'ogit/status',
    },
    relations: {
        owner: 'ogit/connects <- ogit/Person',
    },
};
export function createEmail(id) {
    return {
        'ogit/_id': id,
        'ogit/_type': 'ogit/Email',
        'ogit/status': 'verified',
    };
}
export default [account, profile, team, org, email];
