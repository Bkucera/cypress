"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var fs = require("fs-extra");
var path = require("path");
var semver_1 = require("semver");
var types_1 = require("@babel/types");
var jest_message_util_1 = require("jest-message-util");
var traverse_1 = require("@babel/traverse");
var prettier = require("prettier");
var Debug = require("debug");
var debug = Debug('snapshot');
Debug.enable('snapshot');
console.log(debug, Debug);
exports.saveCypressInlineSnapshot = function (update, filepath, error) {
    debug('err:', error);
    console.log('test snapshot');
    debug('error.stack:', error.stack);
    var lines = jest_message_util_1.getStackTraceLines(error.stack || '');
    var frame = jest_message_util_1.getTopFrame(lines);
    if (!frame) {
        throw new Error('no frame found :(');
    }
    debug(lines, frame);
    try {
        saveSnapshotsForFile([{
                frame: frame,
                snapshot: update
            }], filepath, prettier, traverse_1["default"]);
    }
    catch (e) {
        console.log(e);
        debugger;
    }
    console.log('done!');
};
var escapeBacktickString = function (str) {
    return str.replace(/`|\\|\${/g, '\\$&');
};
exports.saveInlineSnapshots = function (snapshots, prettier, babelTraverse) {
    if (!prettier) {
        throw new Error("Jest: Inline Snapshots requires Prettier.\n" +
            "Please ensure \"prettier\" is installed in your project.");
    }
    // Custom parser API was added in 1.5.0
    if (semver_1["default"].lt(prettier.version, '1.5.0')) {
        throw new Error("Jest: Inline Snapshots require prettier>=1.5.0.\n" +
            "Please upgrade \"prettier\".");
    }
    var snapshotsByFile = groupSnapshotsByFile(snapshots);
    for (var _i = 0, _a = Object.keys(snapshotsByFile); _i < _a.length; _i++) {
        var sourceFilePath = _a[_i];
        saveSnapshotsForFile(snapshotsByFile[sourceFilePath], sourceFilePath, prettier, babelTraverse);
    }
};
var saveSnapshotsForFile = function (snapshots, sourceFilePath, prettier, babelTraverse) {
    debug({ sourceFilePath: sourceFilePath });
    var sourceFile = fs.readFileSync(sourceFilePath, 'utf8');
    // debug({sourceFile})
    // Resolve project configuration.
    // For older versions of Prettier, do not load configuration.
    var config = prettier.resolveConfig
        ? prettier.resolveConfig.sync(sourceFilePath, {
            editorconfig: true
        })
        : null;
    debug({ config: config });
    // Detect the parser for the test file.
    // For older versions of Prettier, fallback to a simple parser detection.
    var inferredParser = prettier.getFileInfo
        ? prettier.getFileInfo.sync(sourceFilePath).inferredParser
        : (config && config.parser) || simpleDetectParser(sourceFilePath);
    // Format the source code using the custom parser API.
    var newSourceFile = prettier.format(sourceFile, __assign({}, config, { filepath: sourceFilePath, parser: createParser(snapshots, inferredParser, babelTraverse) }));
    if (newSourceFile !== sourceFile) {
        fs.writeFileSync(sourceFilePath, newSourceFile);
    }
};
var groupSnapshotsBy = function (createKey) { return function (snapshots) {
    return snapshots.reduce(function (object, inlineSnapshot) {
        var _a;
        var key = createKey(inlineSnapshot);
        return __assign({}, object, (_a = {}, _a[key] = (object[key] || []).concat(inlineSnapshot), _a));
    }, {});
}; };
var groupSnapshotsByFrame = groupSnapshotsBy(function (_a) {
    var _b = _a.frame, line = _b.line, column = _b.column;
    return typeof line === 'number' && typeof column === 'number'
        ? line + ":" + column
        : '';
});
var groupSnapshotsByFile = groupSnapshotsBy(function (_a) {
    var file = _a.frame.file;
    return file;
});
var createParser = function (snapshots, inferredParser, babelTraverse) { return function (text, parsers, options) {
    // Workaround for https://github.com/prettier/prettier/issues/3150
    options.parser = inferredParser;
    var groupedSnapshots = groupSnapshotsByFrame(snapshots);
    debug({ groupedSnapshots: groupedSnapshots });
    var remainingSnapshots = new Set(snapshots.map(function (_a) {
        var snapshot = _a.snapshot;
        return snapshot;
    }));
    var ast = parsers[inferredParser](text);
    // Flow uses a 'Program' parent node, babel expects a 'File'.
    if (ast.type !== 'File') {
        ast = types_1.file(ast, ast.comments, ast.tokens);
        delete ast.program.comments;
    }
    babelTraverse(ast, {
        CallExpression: function (_a) {
            var _b = _a.node, args = _b.arguments, callee = _b.callee;
            if (callee.type !== 'MemberExpression' ||
                callee.property.type !== 'Identifier') {
                return;
            }
            var _c = callee.property.loc.start, line = _c.line, column = _c.column;
            debug({ line: line, column: column }, '\n\n');
            var snapshotsForFrame = groupedSnapshots[line + ":" + column];
            debug({ snapshotsForFrame: snapshotsForFrame });
            if (!snapshotsForFrame) {
                return;
            }
            if (snapshotsForFrame.length > 1) {
                throw new Error('Jest: Multiple inline snapshots for the same call are not supported.');
            }
            var snapshotIndex = args.findIndex(function (_a) {
                var type = _a.type;
                return type === 'TemplateLiteral';
            });
            var values = snapshotsForFrame.map(function (_a) {
                var snapshot = _a.snapshot;
                remainingSnapshots["delete"](snapshot);
                return types_1.templateLiteral([types_1.templateElement({ raw: escapeBacktickString(snapshot) })], []);
            });
            var replacementNode = values[0];
            if (snapshotIndex > -1) {
                args[snapshotIndex] = replacementNode;
            }
            else {
                args.push(replacementNode);
            }
        }
    });
    debug({ remainingSnapshots: remainingSnapshots });
    if (remainingSnapshots.size) {
        throw new Error("Jest: Couldn't locate all inline snapshots.");
    }
    return ast;
}; };
var simpleDetectParser = function (filePath) {
    var extname = path.extname(filePath);
    if (/tsx?$/.test(extname)) {
        return 'typescript';
    }
    return 'babylon';
};
