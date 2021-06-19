import ts from 'typescript';
import type { Messages, ParserOptions } from './types';

const DEFINE_NAMES: readonly string[] = ['defineMessages'];
const TRANSLATE_NAMES: readonly string[] = ['t', 'Text'];

const TS_OPTIONS: ts.CompilerOptions = {
  allowJs: true,
  target: ts.ScriptTarget.ESNext,
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
};

function getNodeName(node: ts.CallExpression | ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression))
    return node.expression.name.text;
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression))
    return node.expression.text;
  if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName))
    return node.tagName.text;
  return '';
}

function extractMessageFromProps(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike | ts.JsxAttributeLike>,
  options: Readonly<ParserOptions>,
) {
  let id = '';
  let message = '';

  for (const prop of properties) {
    if ((ts.isPropertyAssignment(prop) || ts.isJsxAttribute(prop)) && ts.isIdentifier(prop.name) && prop.initializer) {
      if (
        ts.isJsxExpression(prop.initializer) &&
        prop.initializer.expression &&
        (
          ts.isStringLiteral(prop.initializer.expression) ||
          ts.isNoSubstitutionTemplateLiteral(prop.initializer.expression)
        )
      ) {
        if (prop.name.text === 'id') id = prop.initializer.expression.text;
        else if (prop.name.text === 'message') message = prop.initializer.expression.text;
      }
      else if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
        if (prop.name.text === 'id') id = prop.initializer.text;
        else if (prop.name.text === 'message') message = prop.initializer.text;
      }
    }

    if (id && message) break;
  }

  if (id && message) options.onMessageFound(id, message);
}

function extractMessageFromDefine(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike>,
  options: Readonly<ParserOptions>,
) {
  properties.forEach(prop => {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      if (ts.isObjectLiteralExpression(prop.initializer)) {
        extractMessageFromProps(prop.initializer.properties, options);
      }
    }
  });
}

function extractFromCall(node: ts.CallExpression, options: Readonly<ParserOptions>) {
  const funcName = getNodeName(node);
  if (TRANSLATE_NAMES.includes(funcName) || DEFINE_NAMES.includes(funcName)) {
    const argument = node.arguments[0];

    if (argument && ts.isObjectLiteralExpression(argument)) {
      if (DEFINE_NAMES.includes(funcName)) extractMessageFromDefine(argument.properties, options);
      else extractMessageFromProps(argument.properties, options);
    }
  }
}

function extractFromJSX(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  options: Readonly<ParserOptions>,
) {
  if (TRANSLATE_NAMES.includes(getNodeName(node))) {
    extractMessageFromProps(node.attributes.properties, options);
  }
}

function getVisitor(context: ts.TransformationContext, options: Readonly<ParserOptions>) {
  function visitor(node: ts.Node): ts.Node {
    if (ts.isCallExpression(node)) extractFromCall(node, options);
    else if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) extractFromJSX(node, options);
    return ts.visitEachChild(node, visitor, context);
  }

  return visitor;
}

export function parse(source: string): Readonly<Messages> {
  const messages: Messages = {};

  function onMessageFound(id: string, message: string): void {
    messages[id] = message;
  }

  ts.transpileModule(source, {
    compilerOptions: TS_OPTIONS,
    reportDiagnostics: true,
    transformers: {
      before: [
        (context: ts.TransformationContext) => (
          (sf: ts.SourceFile): ts.SourceFile => (
            ts.visitNode(sf, getVisitor(context, { onMessageFound }))
          )
        ),
      ],
    },
  });

  return messages;
}
