interface IDefinitionData {
    [index: string]: string;
}

interface IMapping {
    [index: string]: string;
}

interface IDefinition {
    name: string;
    ogit: string;
    required?: IDefinitionData;
    optional?: IDefinitionData;
    relations?: IDefinitionData;
}

interface IOutput {
    [index: string]: IDefinition;
}

interface IToBeDone {
    [index: string]: { ns: string; name: string };
}
