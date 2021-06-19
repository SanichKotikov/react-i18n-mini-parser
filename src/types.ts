export type Messages = Record<string, string>;

export interface ParserOptions {
  onMessageFound: (id: string, message: string) => void;
}
