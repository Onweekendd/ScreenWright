export interface BaseEntity<T> {
  code: number;
  message: string;
  onlTable: unknown;
  requestId: string;
  success: boolean;
  timestamp: number;
  result: T;
}
