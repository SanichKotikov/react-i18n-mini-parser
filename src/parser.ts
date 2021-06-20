import ts from 'typescript';
import { getName, isJsx, isString } from './utils';
import type { ExtOptions, Messages, Options } from './types';

const TS_OPTIONS: ts.CompilerOptions = {
  allowJs: true,
  target: ts.ScriptTarget.ESNext,
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
};

const DEFAULT_OPTIONS: Readonly<Options> = {
  idPropName: 'id',
  messagePropName: 'message',
  translateNames: ['t', 'Text'],
  defineFunctionNames: ['defineMessages'],
};

function extractMessageFromProps(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike | ts.JsxAttributeLike>,
  options: Readonly<ExtOptions>,
) {
  let id = '';
  let message = '';

  function extract(name: string, node: { text: string }): void {
    if (name === options.idPropName) id = node.text;
    else if (name === options.messagePropName) message = node.text;
  }

  for (const prop of properties) {
    if (!ts.isPropertyAssignment(prop) && !ts.isJsxAttribute(prop)) continue;
    const { name, initializer } = prop;

    if (ts.isIdentifier(name) && initializer) {
      if (ts.isJsxExpression(initializer) && initializer.expression && isString(initializer.expression))
        extract(name.text, initializer.expression);
      else if (isString(initializer)) extract(name.text, initializer);
    }
  }

  if (id && message) options.onMessageFound(id, message);
}

function extractMessagesFromDefine(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike>,
  options: Readonly<ExtOptions>,
) {
  properties.forEach(prop => {
    if (ts.isPropertyAssignment(prop) && ts.isObjectLiteralExpression(prop.initializer))
      extractMessageFromProps(prop.initializer.properties, options);
  });
}

function extractFromCall(node: ts.CallExpression, options: Readonly<ExtOptions>) {
  const funcName = getName(node);
  const { translateNames, defineFunctionNames } = options;

  if (translateNames.includes(funcName) || defineFunctionNames.includes(funcName)) {
    const argument = node.arguments[0];

    if (argument && ts.isObjectLiteralExpression(argument)) {
      if (defineFunctionNames.includes(funcName)) extractMessagesFromDefine(argument.properties, options);
      else extractMessageFromProps(argument.properties, options);
    }
  }
}

function extractFromJSX(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  options: Readonly<ExtOptions>,
) {
  if (options.translateNames.includes(getName(node))) {
    extractMessageFromProps(node.attributes.properties, options);
  }
}

function getVisitor(context: ts.TransformationContext, options: Readonly<ExtOptions>) {
  function visitor(node: ts.Node): ts.Node {
    if (ts.isCallExpression(node)) extractFromCall(node, options);
    else if (isJsx(node)) extractFromJSX(node, options);
    return ts.visitEachChild(node, visitor, context);
  }

  return visitor;
}

export function parse(source: string, options?: Partial<Readonly<Options>>): Readonly<Messages> {
  const messages: Messages = {};

  const opts: Readonly<ExtOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    onMessageFound: (id: string, message: string): void => {
      messages[id] = message;
    },
  };

  ts.transpileModule(source, {
    compilerOptions: TS_OPTIONS,
    reportDiagnostics: true,
    transformers: {
      before: [
        (context: ts.TransformationContext) => (
          (sf: ts.SourceFile): ts.SourceFile => (
            ts.visitNode(sf, getVisitor(context, opts))
          )
        ),
      ],
    },
  });

  return messages;
}
