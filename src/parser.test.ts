import { parse } from './parser';
import type { Message } from './types';

describe('parser', () => {
  const RESULT: readonly Message[] = [{ id: 'title', message: 'Title' }];

  it('should extract messages from function calls', function() {
    expect(parse(`t({ id: 'title', message: 'Title' })`)).toEqual(RESULT);
    expect(parse('i18n.t({ id: "title", message: "Title" })')).toEqual(RESULT);
    expect(parse('i18n.t({ id: `title`, message: `Title` })')).toEqual(RESULT);
    expect(parse(`i18n.t({ id: 'title', message: 'Ti' + 'tle' })`)).toEqual(RESULT);
    expect(parse(`i18n.t({ id: 'title', message: 'Ti' + 't' + 'le' })`)).toEqual(RESULT);
  });

  it('should extract messages from react components', function() {
    expect(parse(`<Text id="title" message="Title" />`)).toEqual(RESULT);
    expect(parse('<Text id="title" message="Title" />')).toEqual(RESULT);
    expect(parse(`<Text id={'title'} message={'Title'} />`)).toEqual(RESULT);
    expect(parse('<Text id={`title`} message={`Title`} />')).toEqual(RESULT);
    expect(parse(`<Text id={'title'} message={'Ti' + 'tle'} />`)).toEqual(RESULT);
  });

  it('should extract messages from define function', function() {
    expect(parse(`defineMessages({title: {id: 'title', message: 'Title'}});`)).toEqual(RESULT);
    expect(parse(`defineMessages({title: {id: "title", message: "Title"}});`)).toEqual(RESULT);
    expect(parse('defineMessages({title: {id: `title`, message: `Title`}});')).toEqual(RESULT);
    expect(parse(`defineMessages({title: {id: 'title', message: 'Ti' + 'tle'}});`)).toEqual(RESULT);
    expect(parse(
      'defineMessages({title: {id: `title`, message: `Title`}, desc: {id: `desc`, message: `Description`}});',
    )).toEqual([...RESULT, { id: 'desc', message: 'Description' }]);
    expect(parse(`defineMessages({'title': {id: 'title', message: 'Title'}});`)).toEqual(RESULT);
    expect(parse('defineMessages({[`title`]: {id: "title", message: "Title"}});')).toEqual(RESULT);
    expect(parse('defineMessages({[Enum.key]: {id: "title", message: "Title"}});')).toEqual(RESULT);
  });

  it('should use custom options', function() {
    expect(parse(`t({ name: 'title', msg: 'Title' })`, { idPropName: 'name', messagePropName: 'msg' })).toEqual(RESULT);
    expect(parse(`text({ id: 'title', message: 'Title' })`, { translateNames: ['text'] })).toEqual(RESULT);
    expect(parse('i18n.text({ id: "title", message: "Title" })', { translateNames: ['text'] })).toEqual(RESULT);
    expect(parse(`create({title: {id: 'title', message: 'Title'}});`, { defineFunctionNames: ['create'] }))
      .toEqual(RESULT);
  });
});
