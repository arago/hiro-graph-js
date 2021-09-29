export enum OFFSET_MSG {
  NEWEST = 'largest',
  OLDEST = 'smallest',
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

export interface EventStreamMessageToken {
  type: 'token';
  args: {
    _TOKEN: string;
  };
}

export interface EventStreamMessageSubscribe {
  type: 'subscribe';
  id: string;
}

export interface EventStreamMessageRegister {
  type: 'register';
  args: {
    'filter-id': string;
    'filter-type': string;
    'filter-content': string;
  };
}

export interface EventStreamMessageUnregister {
  type: 'unregister';
  args: {
    'filter-id': string;
  };
}

export interface EventStreamMessageClear {
  type: 'clear';
}

export interface EventStreamRequest {
  groupId?: string;
  offset?: OFFSET_MSG;
  delta?: boolean;
}

export type EventStreamMessage =
  | EventStreamMessageToken
  | EventStreamMessageSubscribe
  | EventStreamMessageRegister
  | EventStreamMessageUnregister
  | EventStreamMessageToken;

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

export interface GraphSubscription<T> {
  body: T;
  id: string;
  type?: GraphEventType;
  isLast?: boolean;
  isNew?: boolean;
  isUpdated?: boolean;
}
