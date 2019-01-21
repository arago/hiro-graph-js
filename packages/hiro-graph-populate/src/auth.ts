import chalk from "chalk";
import fetch from "node-fetch";
import Ora from "ora";

import { IPerson, Orm } from "../typings";

import { configsSingleton } from "./config";

interface IResponse {
    error?: { message: string };
}

export interface ICreateAccountResponse {
    account: IAccount;
    profile: IProfile;
    error?: { message: string };
}

export interface IProfile {
    "ogit/_created-on": number;
    "ogit/_organization": string;
    "ogit/_modified-on": number;
    "ogit/_id": string;
    "ogit/_creator": string;
    "ogit/_graphtype": string;
    "ogit/_owner": string;
    "ogit/_v-id": string;
    "ogit/_v": number;
    "ogit/Auth/Account/displayName": string;
    "ogit/_modified-by-app": string;
    "ogit/_is-deleted": boolean;
    "ogit/_creator-app": string;
    "ogit/_modified-by": string;
    "ogit/_scope": string;
    "ogit/_type": string;
}

export interface IAccount {
    "ogit/_created-on": number;
    "ogit/_xid"?: string;
    "ogit/_organization": string;
    "ogit/name"?: string;
    "ogit/status"?: string;
    "ogit/_modified-on": number;
    "ogit/_id": string;
    "ogit/_creator": string;
    "ogit/_graphtype": string;
    "ogit/_owner": string;
    "ogit/_v-id": string;
    "ogit/_v": number;
    "ogit/Auth/Account/type"?: string;
    "ogit/_modified-by-app": string;
    "ogit/_is-deleted": boolean;
    "ogit/_creator-app": string;
    "ogit/_modified-by": string;
    "ogit/_scope": string;
    "ogit/_type": string;
    "ogit/Auth/Account/displayName"?: string;
}

export interface IOrganization extends IResponse {
    "ogit/_xid": string;
    "ogit/_organization": string;
    "ogit/_created-on": number;
    "ogit/name": string;
    "ogit/_modified-on": number;
    "ogit/_id": string;
    "ogit/_creator": string;
    "ogit/_graphtype": string;
    "ogit/_owner": string;
    "ogit/_is-deleted": boolean;
    "ogit/_scope": string;
    "ogit/_type": string;
}

export interface ITeam {
    "ogit/_created-on": number;
    "ogit/_xid": string;
    "ogit/_organization": string;
    "ogit/name": string;
    "ogit/_modified-on": number;
    "ogit/_id": string;
    "ogit/_creator": string;
    "ogit/description": string;
    "ogit/_graphtype": string;
    "ogit/_owner": string;
    "ogit/_v-id": string;
    "ogit/_v": number;
    "ogit/_is-deleted": boolean;
    "ogit/_scope": string;
    "ogit/_type": string;
}

export const createOrg = async (orm: Orm, name: string) => {
    const configs = await configsSingleton;

    if (!configs) {
        return;
    }

    let o = new Ora(`Creating organization ${chalk.blue(name)}`).start();
    try {
        const resCreate = (await orm
            .getClient()
            .auth.createOrganization({ "ogit/name": name })) as IOrganization;

        o.succeed(
            `Created organization ${chalk.blue(name)}: ${resCreate["ogit/_id"]}`
        );

        o = new Ora(`Getting teams for '${resCreate["ogit/_id"]}'`);
        const resTeams = (await orm
            .getClient()
            .auth.organizationTeams(resCreate["ogit/_id"])) as ITeam[];

        o.succeed(
            `Teams [${resTeams.length}]: [${resTeams
                .map(m => `${chalk.blue(m["ogit/name"])}: ${m["ogit/_id"]}`)
                .join(", ")}]`
        );

        const addAdmins = async (admins: string[]) => {
            if (admins && admins.length > 0) {
                o = new Ora(`Adding admins`);
                const adminTeam = resTeams
                    .filter(t => t["ogit/name"] === "admin")
                    .pop();

                if (!adminTeam) {
                    throw new Error(
                        `Team named 'admin' not found for org '${name}'`
                    );
                }

                const resAddMem = await orm
                    .getClient()
                    .auth.addMembers(adminTeam["ogit/_id"], ...admins);
                const error = (resAddMem as IResponse).error;

                if (error) {
                    throw new Error(error.message);
                }

                o.succeed(`Added admins`);
            }
        };

        return {
            addAdmins,
            org: resCreate,
            teams: resTeams
        };
    } catch (err) {
        o.fail(err);
    }
};

export const createUser = async (orm: Orm, user: IPerson, org: string) => {
    const configs = await configsSingleton;

    if (!configs) {
        return;
    }

    let o = new Ora(`Creating account '${user.email}'`).start();
    try {
        const resCreate = (await orm.getClient().auth.createAccount({
            "ogit/Auth/Account/type": user.email ? "person" : "application",
            "ogit/_organization": org,
            "ogit/email": user.email,
            "ogit/name": user.email
        })) as { account: IAccount; profile: IProfile };

        o.succeed(
            `Created account [${chalk.blue("account")}: ${
                resCreate.account["ogit/_id"]
            }, ${chalk.blue("profile")}: ${resCreate.profile["ogit/_id"]}]`
        );

        o = new Ora(`Activating account '${resCreate.account["ogit/_id"]}'`);

        const resActivate = (await orm
            .getClient()
            .auth.activateAccount(resCreate.account["ogit/_id"])) as IAccount;

        o.succeed(`Activated account: ${resActivate["ogit/_id"]}`);

        o = new Ora(
            `Updating account profile '${resCreate.profile["ogit/_id"]}'`
        );
        const resProfile = await orm
            .getClient()
            .auth.updateAccountProfile(resCreate.profile["ogit/_id"], {
                "ogit/Auth/Account/displayName": user.name
            });

        o.succeed(`Updated account profile: ${resCreate.profile["ogit/_id"]}`);

        o = new Ora(
            `Setting password for account '${resActivate["ogit/_id"]}'`
        );
        await orm
            .getClient()
            .auth.updatePassword(resActivate["ogit/_id"], user.password);
        o.succeed("Password set");

        return {
            account: resActivate,
            profile: resCreate.profile
        };
    } catch (err) {
        o.fail(err);
    }
};
