// this is just a tiny subset of the ontology
const person = {
    name: 'Person',
    ogit: 'ogit/Person',
    required: {},
    optional: {
        profileSet: {
            src: '/profileSet',
            type: 'bool',
        },
        email: 'ogit/email',
        firstName: 'ogit/firstName',
        lastName: 'ogit/lastName',
        username: 'ogit/alternativeName',
        status: 'ogit/status',
    },
    relations: {
        orgs: 'ogit/belongs -> ogit/Organization',
        subordinates: 'ogit/reports <- ogit/Person',
        emails: 'ogit/connects <- ogit/Email',
    },
};
export function createPerson(id) {
    return {
        'ogit/_id': id,
        'ogit/_type': 'ogit/Person',
        '/profileSet': 'true',
        'ogit/firstName': `Jane (${id})`,
        'ogit/lastName': `Doe (${id})`,
        'ogit/alternativeName': `jane-doe-${id}`,
        'ogit/status': 'active',
    };
}

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
export default [person, org, email];
