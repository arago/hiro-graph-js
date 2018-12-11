import { mapping } from "../config.json";

export const mapRelationship = (value: string, fallback: string | number) => {
    const mapped = (mapping as IMapping)[value];

    if (!mapped) {
        return fallback;
    }

    return mapped;
};
