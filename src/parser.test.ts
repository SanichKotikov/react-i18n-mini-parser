import { parse } from './parser';

describe('parser', () => {
  const RESULT = { 'title': 'Title' };

  it('should extract messages from function calls', function() {
    expect(parse(`t({ id: 'title', message: 'Title' })`)).toEqual(RESULT);
    expect(parse('i18n.t({ id: "title", message: "Title" })')).toEqual(RESULT);
    expect(parse('i18n.t({ id: `title`, message: `Title` })')).toEqual(RESULT);
  });

  it('should extract messages from react components', function() {
    expect(parse(`<Text id="title" message="Title" />`)).toEqual(RESULT);
    expect(parse('<Text id="title" message="Title" />')).toEqual(RESULT);
    expect(parse(`<Text id={'title'} message={'Title'} />`)).toEqual(RESULT);
    expect(parse('<Text id={`title`} message={`Title`} />')).toEqual(RESULT);
  });

  it('should extract messages from define function', function() {
    expect(parse(`defineMessages({title: {id: 'title', message: 'Title'}});`)).toEqual(RESULT);
    expect(parse(`defineMessages({title: {id: "title", message: "Title"}});`)).toEqual(RESULT);
    expect(parse('defineMessages({title: {id: `title`, message: `Title`}});')).toEqual(RESULT);
  });

  it('should use custom options', function() {
    expect(parse(`t({ name: 'title', msg: 'Title' })`, { idPropName: 'name', messagePropName: 'msg' })).toEqual(RESULT);
    expect(parse(`text({ id: 'title', message: 'Title' })`, { translateNames: ['text'] })).toEqual(RESULT);
    expect(parse('i18n.text({ id: "title", message: "Title" })', { translateNames: ['text'] })).toEqual(RESULT);
    expect(parse(`create({title: {id: 'title', message: 'Title'}});`, { defineFunctionNames: ['create'] }))
      .toEqual(RESULT);
  });
});
