import { parse } from './parser';
import { sort } from './utils';
import type { MessageError, Messages, Options, ParserResult } from './types';
import { ErrorType } from './types';

export function extract(
  sources: readonly string[],
  options?: Partial<Readonly<Options>>,
): Readonly<ParserResult> {
  const messages: Messages = {};
  const errors: MessageError[] = [];

  sources
    .map(source => parse(source, options))
    .forEach((arr) => {
      arr.forEach((item) => {
        if (item.id in messages) {
          errors.push({ type: ErrorType.duplicateId, ...item });
        }
        messages[item.id] = item.message;
      });
    });

  const ids = Object.keys(messages);

  ids.forEach((id) => {
    if (ids.some(key => key !== id && messages[id] === messages[key])) {
      errors.push({ type: ErrorType.duplicateMessage, id, message: messages[id]! });
    }
  });

  return { messages: sort(messages), errors };
}
