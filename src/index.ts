import { parse } from './parser';
import { sort } from './utils';
import type { Messages, Options } from './types';

export function extract(sources: readonly string[], options?: Partial<Readonly<Options>>): Readonly<Messages> {
  return sort(
    sources
      .map(source => parse(source, options))
      .reduce<Messages>((acc, messages) => ({ ...acc, ...messages }), {}),
  );
}
