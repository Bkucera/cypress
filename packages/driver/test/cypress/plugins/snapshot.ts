/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import semver from 'semver';
import {
  templateElement,
  templateLiteral,
  file,
  CallExpression,
} from '@babel/types';
import {Frame, getTopFrame, getStackTraceLines} from 'jest-message-util';

import {Config} from '@jest/types';

import babelTraverse from "@babel/traverse";
import * as prettier from 'prettier'

import Debug = require('debug')

const debug = Debug('snapshot')

Debug.enable('snapshot')

console.log(debug, Debug)

export const saveCypressInlineSnapshot = (update, filepath, error:Error) => {

  debug('err:', error)

  console.log('test snapshot')
  debug('error.stack:',error.stack)
  const lines = getStackTraceLines(error.stack || '')
  const frame = getTopFrame(lines)

  if (!frame) {
    throw new Error('no frame found :(')
  }

  debug(lines, frame)


try {

  saveSnapshotsForFile(
    [{
      frame,
      snapshot: update,
    }],
    filepath,
    prettier,
    babelTraverse
  )

}
catch(e) {
  console.log(e)
  debugger
}

  console.log('done!')
}


const escapeBacktickString = (str: string): string =>
  str.replace(/`|\\|\${/g, '\\$&');

export type InlineSnapshot = {
  snapshot: string;
  frame: Frame;
};

export const saveInlineSnapshots = (
  snapshots: Array<InlineSnapshot>,
  prettier: any,
  babelTraverse: Function,
) => {
  if (!prettier) {
    throw new Error(
      `Jest: Inline Snapshots requires Prettier.\n` +
        `Please ensure "prettier" is installed in your project.`,
    );
  }

  // Custom parser API was added in 1.5.0
  if (semver.lt(prettier.version, '1.5.0')) {
    throw new Error(
      `Jest: Inline Snapshots require prettier>=1.5.0.\n` +
        `Please upgrade "prettier".`,
    );
  }

  const snapshotsByFile = groupSnapshotsByFile(snapshots);

  for (const sourceFilePath of Object.keys(snapshotsByFile)) {
    saveSnapshotsForFile(
      snapshotsByFile[sourceFilePath],
      sourceFilePath,
      prettier,
      babelTraverse,
    );
  }
};

const saveSnapshotsForFile = (
  snapshots: Array<InlineSnapshot>,
  sourceFilePath: Config.Path,
  prettier: any,
  babelTraverse: Function,
) => {
  debug({sourceFilePath})
  const sourceFile = fs.readFileSync(sourceFilePath, 'utf8');
// debug({sourceFile})
  // Resolve project configuration.
  // For older versions of Prettier, do not load configuration.
  const config = prettier.resolveConfig
    ? prettier.resolveConfig.sync(sourceFilePath, {
        editorconfig: true,
      })
    : null;


  debug({config})

  // Detect the parser for the test file.
  // For older versions of Prettier, fallback to a simple parser detection.
  const inferredParser = prettier.getFileInfo
    ? prettier.getFileInfo.sync(sourceFilePath).inferredParser
    : (config && config.parser) || simpleDetectParser(sourceFilePath);

  // Format the source code using the custom parser API.
  const newSourceFile = prettier.format(sourceFile, {
    ...config,
    filepath: sourceFilePath,
    parser: createParser(snapshots, inferredParser, babelTraverse),
  });

  if (newSourceFile !== sourceFile) {
    fs.writeFileSync(sourceFilePath, newSourceFile);
  }
};

const groupSnapshotsBy = (
  createKey: (inlineSnapshot: InlineSnapshot) => string,
) => (snapshots: Array<InlineSnapshot>) =>
  snapshots.reduce<{[key: string]: Array<InlineSnapshot>}>(
    (object, inlineSnapshot) => {
      const key = createKey(inlineSnapshot);
      return {...object, [key]: (object[key] || []).concat(inlineSnapshot)};
    },
    {},
  );

const groupSnapshotsByFrame = groupSnapshotsBy(({frame: {line, column}}) =>
  typeof line === 'number' && typeof column === 'number'
    ? `${line}:${column}`
    : '',
);
const groupSnapshotsByFile = groupSnapshotsBy(({frame: {file}}) => file);

const createParser = (
  snapshots: Array<InlineSnapshot>,
  inferredParser: string,
  babelTraverse: Function,
) => (
  text: string,
  parsers: {[key: string]: (text: string) => any},
  options: any,
) => {
  // Workaround for https://github.com/prettier/prettier/issues/3150
  options.parser = inferredParser;

  const groupedSnapshots = groupSnapshotsByFrame(snapshots);
  debug({groupedSnapshots})
  const remainingSnapshots = new Set(snapshots.map(({snapshot}) => snapshot));
  let ast = parsers[inferredParser](text);

  // Flow uses a 'Program' parent node, babel expects a 'File'.
  if (ast.type !== 'File') {
    ast = file(ast, ast.comments, ast.tokens);
    delete ast.program.comments;
  }

  babelTraverse(ast, {
    CallExpression({node: {arguments: args, callee}}: {node: CallExpression}) {
      if (
        callee.type !== 'MemberExpression' ||
        callee.property.type !== 'Identifier'
      ) {
        return;
      }
      const {line, column} = callee.property.loc.start;
      debug({line, column}, '\n\n')
      const snapshotsForFrame = groupedSnapshots[`${line}:${column}`];
      debug({snapshotsForFrame})
      if (!snapshotsForFrame) {
        return;
      }
      if (snapshotsForFrame.length > 1) {
        throw new Error(
          'Jest: Multiple inline snapshots for the same call are not supported.',
        );
      }
      const snapshotIndex = args.findIndex(
        ({type}) => type === 'TemplateLiteral',
      );
      const values = snapshotsForFrame.map(({snapshot}) => {
        remainingSnapshots.delete(snapshot);

        return templateLiteral(
          [templateElement({raw: escapeBacktickString(snapshot)})],
          [],
        );
      });
      const replacementNode = values[0];

      if (snapshotIndex > -1) {
        args[snapshotIndex] = replacementNode;
      } else {
        args.push(replacementNode);
      }
    },
  });

  debug({remainingSnapshots})

  if (remainingSnapshots.size) {
    throw new Error(`Jest: Couldn't locate all inline snapshots.`);
  }

  return ast;
};

const simpleDetectParser = (filePath: Config.Path) => {
  const extname = path.extname(filePath);
  if (/tsx?$/.test(extname)) {
    return 'typescript';
  }
  return 'babylon';
};