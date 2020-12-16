export enum OFFSET_MSG {
  NEWEST = 'largest',
  oldest = 'smallest',
}

export type GraphEventType =
  | 'CREATE'
  | 'REPLACE'
  | 'UPDATE'
  | 'CONNECT'
  | 'DISCONNECT'
  | 'DELETE'
  | 'WRITE_TIMESERIES'
  | 'WRITE_BLOB'
  | 'DELETE_BLOB'
  | 'WRITE_LOG';

export interface EventStreamRequest {
  groupId?: string;
  scopeId?: string;
  offset?: OFFSET_MSG;
}

export interface EventStreamResponse<T> {
  body: T;
  id: string; // ogit/_id from body 
  metadata: {
    'ogit/_modified-by': string;
    'ogit/_modified-by-app': string;
    'ogit/_modified-on': number;
  };
  nanotime: number;
  timestamp: number;
  type: GraphEventType;
}
