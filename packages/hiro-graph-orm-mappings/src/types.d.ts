import { IDefinition } from "@hiro-graph/orm";

interface IDefinitionData {
    [index: string]: string;
}

interface IMapping {
    [index: string]: string;
}

interface IOutput {
    [index: string]: IDefinition;
}

interface IToBeDone {
    [index: string]: { ns: string; name: string; parentDir: string };
}
