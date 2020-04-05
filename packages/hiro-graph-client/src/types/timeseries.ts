export namespace TimeSeries {
  export interface Value<VariableNames extends string = string> {
    Entries: Entry[];
    Type: 'start' | 'execute' | 'move' | 'finish';

    Alternatives?: Alternatives;
    Changes?: Change<VariableNames>[];
    ContextHash?: string;
    Count?: number;
    Fingerprints?: Fingerprints;
    IssueVersion?: string;
    KIID?: string;
    KIVersion?: string;
    NodeID?: string;
    NodeVersion?: string;
    Stats?: Stats;

    [index: string]: any;
  }

  export interface Alternatives {
    [index: string]: string;
  }

  export interface ChangeValue {
    created: number;
    created_on: string;
    implicit: boolean;
    key: string;
    value: any;
  }

  export type ChangeVariables<VariableNames extends string = string> = {
    [key in VariableNames]: ChangeValue;
  };

  export interface ChangeMeta {
    Action: 'add' | 'delete';
    NodeID: string;
  }

  export type Change<VariableNames extends string = string> = ChangeMeta &
    ChangeVariables<VariableNames>;

  export interface Entry {
    LogLevel: string;
    Message: string;

    Command?: string;
    TimeStamp?: number;
  }

  export interface Fingerprints {
    [index: string]: string;
  }

  export interface Stats {
    backoffs?: number;
    bind_node?: number;
    commit_time?: number;
    ctxs?: number;
    exec_time?: number;
    kis?: number;
    match_time?: number;
    overall?: number;
    route_time?: number;
    routed?: number;
  }
}

export interface TimeseriesObject {
  timestamp: number;
  value: TimeSeries.Value;
}

export interface TimeseriesResponse {
  timestamp: number;
  value: string;
}
