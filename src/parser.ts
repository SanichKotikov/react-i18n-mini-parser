import ts from 'typescript';
import { concatString, getName, isJsx, isString } from './utils';
import type { ExtOptions, Message, Options } from './types';

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
  withDuplicateMessage: false,
};

function extractMessageFromProps(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike | ts.JsxAttributeLike>,
  options: Readonly<ExtOptions>,
) {
  let id = '';
  let message = '';

  function extract(name: string, text: string): void {
    if (name === options.idPropName) id = text;
    else if (name === options.messagePropName) message = text;
  }

  for (const prop of properties) {
    if (!ts.isPropertyAssignment(prop) && !ts.isJsxAttribute(prop)) continue;
    const { name, initializer } = prop;

    if (ts.isIdentifier(name) && initializer) {
      const node: ts.Expression =
        ts.isJsxExpression(initializer) && initializer.expression
          ? initializer.expression
          : initializer;

      if (isString(node)) {
        extract(name.text, node.text);
        continue;
      }

      if (ts.isBinaryExpression(node)) {
        const [result, isStatic] = concatString(node);
        if (isStatic) extract(name.text, result);
      }
    }
  }

  if (message) options.onMessageFound({ id: id || message, message });
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
    if (!argument) return;

    if (isString(argument))
      options.onMessageFound({ id: argument.text, message: argument.text });
    else if (ts.isObjectLiteralExpression(argument)) {
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

export function parse(source: string, options?: Partial<Readonly<Options>>): readonly Message[] {
  const messages: Message[] = [];

  const opts: Readonly<ExtOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    onMessageFound: (message: Message): void => {
      messages.push(message);
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
