import faker from "faker";
const alpha = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z"
];

const createUser = (org: string, password: string) => {
    const name = faker.fake("{{name.firstName}} {{name.lastName}}");

    return {
        email: name.toLowerCase().replace(" ", ".") + "@" + org,
        name,
        password
    };
};

export const generate = (config: IGenerate): IPopulateValue[] => {
    const output = [];

    for (let i = 0; i < config.orgs.count && i < alpha.length; i++) {
        const orgName = alpha[i] + "." + config.orgs.name;
        const org = {
            admins: new Array(config.admins.perOrg).fill(
                createUser(orgName, config.admins.password)
            ),
            name: orgName,
            users: new Array(config.users.perOrg).fill(
                createUser(orgName, config.users.password)
            )
        };

        output.push(org);
    }

    return output;
};
