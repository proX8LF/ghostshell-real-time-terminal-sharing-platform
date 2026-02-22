export type MessageType = 'data' | 'resize' | 'input' | 'register' | 'status';
export interface TerminalMessage {
  type: MessageType;
  payload?: any;
}
export interface StatusPayload {
  hostConnected: boolean;
  viewers: number;
}
export interface ResizePayload {
  cols: number;
  rows: number;
}