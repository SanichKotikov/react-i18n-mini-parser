export type Messages = Record<string, string>;

export interface Options {
  idPropName: string;
  messagePropName: string;
  translateNames: readonly string[];
  defineFunctionNames: readonly string[];
}

export interface ExtOptions extends Options {
  onMessageFound: (id: string, message: string) => void;
}
