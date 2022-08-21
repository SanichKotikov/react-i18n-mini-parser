export enum ErrorType {
  duplicateId = 'dup_id',
  duplicateMessage = 'dup_msg',
}

export interface Message {
  id: string;
  message: string;
}

export interface MessageError extends Message {
  type: ErrorType;
}

export type Messages = Record<string, string>;

export interface Options {
  idPropName: string;
  messagePropName: string;
  translateNames: readonly string[];
  defineFunctionNames: readonly string[];
  withDuplicateMessage: boolean;
}

export interface ExtOptions extends Options {
  onMessageFound: (message: Message) => void;
}

export interface ParserResult {
  messages: Readonly<Messages>;
  errors: readonly MessageError[];
}
