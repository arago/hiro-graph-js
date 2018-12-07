interface IData {
  [index: string]: string;
}

interface IMapping {
  [index: string]: string;
}

interface IEntity {
  name: string;
  ogit: string;
  required?: IData;
  optional?: IData;
  relations?: IData;
}

interface IOutput {
  [index: string]: IEntity;
}
