import { extract } from './index';
import type { ParserResult } from './types';
import { ErrorType } from './types';

describe('extract', () => {
  it('should extract messages', function() {
    expect(
      extract([
        `t({ id: 'title', message: 'Title' })`,
        `t({ id: 'other', message: 'Other' })`,
      ]),
    ).toEqual<ParserResult>({
      messages: { title: 'Title', other: 'Other' },
      errors: [],
    });
  });

  it('should returns errors', function() {
    expect(
      extract([
        `t({ id: 'title', message: 'Title' })`,
        `t({ id: 'title', message: 'Other' })`,
      ]),
    ).toEqual<ParserResult>({
      messages: { title: 'Other' },
      errors: [
        { type: ErrorType.duplicateId, id: 'title', message: 'Other' },
      ],
    });

    expect(
      extract([
        `t({ id: 'title', message: 'Title' })`,
        `t({ id: 'other', message: 'Title' })`,
      ]),
    ).toEqual<ParserResult>({
      messages: { title: 'Title', other: 'Title' },
      errors: [
        { type: ErrorType.duplicateMessage, id: 'title', message: 'Title' },
        { type: ErrorType.duplicateMessage, id: 'other', message: 'Title' },
      ],
    });
  });
});
