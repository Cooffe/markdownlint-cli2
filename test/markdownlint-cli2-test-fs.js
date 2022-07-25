// @ts-check

"use strict";

const path = require("node:path");
const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
const testCases = require("./markdownlint-cli2-test-cases");
const FsMock = require("./fs-mock");
const mockDirectory = "/mock";

const linesEndingWithNewLine =
  (lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (directory, args, noRequire) => () => {
  const stdouts = [];
  const stderrs = [];
  return markdownlintCli2({
    "directory": mockDirectory,
    "argv": args,
    "logMessage": (msg) => stdouts.push(msg),
    "logError": (msg) => stderrs.push(msg),
    noRequire,
    "fs": new FsMock(directory)
  }).
    then(
      (exitCode) => exitCode,
      (error) => {
        stderrs.push(error.message);
        return 2;
      }
    ).
    then((exitCode) => ({
      exitCode,
      "stdout": linesEndingWithNewLine(stdouts),
      "stderr": linesEndingWithNewLine(stderrs)
    }));
};

const absolute = (rootDir, file) => path.join(mockDirectory, file);

testCases("fs", invoke, absolute, true, false, false, false);
