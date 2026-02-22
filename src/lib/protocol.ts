export type MessageType = 'data' | 'resize' | 'input' | 'register' | 'status' | 'session';
export interface TerminalMessage {
  type: MessageType;
  payload?: any;
}
export interface SessionPayload {
  cols: number;
  rows: number;
  buf: string;
}
export interface ResizePayload {
  cols: number;
  rows: number;
}