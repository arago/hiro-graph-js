export interface HistoryQueryOptions {
  offset?: number;
  limit?: number;
  from?: number;
  to?: number;
  version?: number;
  type?: string;
  listMeta?: boolean;
  includeDeleted?: boolean;
  vid?: string;
}
