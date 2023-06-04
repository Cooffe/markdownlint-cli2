// @ts-check

"use strict";

const fs = require("node:fs").promises;
const os = require("node:os");
const path = require("node:path");
const test = require("ava").default;

const noop = () => null;
const empty = () => "";
const sanitize = (str) => str.
  replace(/\r/gu, "").
  replace(/\bv\d+\.\d+\.\d+\b/gu, "vX.Y.Z").
  replace(/ :.+[/\\]sentinel/gu, " :[PATH]");
const sameFileSystem = (path.relative(os.homedir(), __dirname) !== __dirname);

const testCases =
// eslint-disable-next-line max-len
(host, invoke, absolute, includeNoRequire, includeEnv, includeScript, includeRequire) => {

  const testCase = (options) => {
    const { name, script, args, exitCode, cwd, env, stderrRe, pre, post,
      noRequire, usesEnv, usesRequire, usesScript } = options;
    if (
      (noRequire && !includeNoRequire) ||
      (usesEnv && !includeEnv) ||
      (usesRequire && !includeRequire) ||
      (usesScript && !includeScript)
    ) {
      return;
    }
    test(`${name} (${host})`, (t) => {
      t.plan(3);
      const directory = path.join(__dirname, cwd || name);
      return ((pre || noop)(name) || Promise.resolve()).
        then(invoke(directory, args, noRequire, env, script)).
        then((result) => Promise.all([
          result,
          fs.readFile(
            path.join(directory, "markdownlint-cli2-codequality.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name-codequality.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "markdownlint-cli2-results.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "markdownlint-cli2-junit.xml"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name.xml"),
            "utf8"
          ).catch(empty)
        ])).
        then((results) => Promise.all([
          (post || noop)(name),
          new Promise((resolve) => {
            const [
              child,
              formatterOutputCodeQuality,
              formatterOutputCodeQualityCustom,
              formatterOutputJson,
              formatterOutputJsonCustom,
              formatterOutputJunit,
              formatterOutputJunitCustom
            ] = results;
            t.is(child.exitCode, exitCode);
            const actual = {
              "exitCode": child.exitCode,
              "stdout": sanitize(child.stdout),
              "stderr": sanitize(child.stderr),
              "formatterCodeQuality":
                sanitize(
                  formatterOutputCodeQuality ||
                  formatterOutputCodeQualityCustom
                ),
              "formatterJson":
                sanitize(formatterOutputJson || formatterOutputJsonCustom),
              "formatterJunit":
                sanitize(formatterOutputJunit || formatterOutputJunitCustom)
            };
            if (stderrRe) {
              t.regex(child.stderr, stderrRe);
              delete actual.stderr;
            } else {
              t.true(true);
            }
            t.snapshot(actual);
            resolve(null);
          })
        ]));
    });
  };

  const directoryName = (dir) => `${dir}-copy-${host}`;

  const copyDirectory = (dir) => import("cpy").then((cpy) => (
    cpy.default(
      path.join(__dirname, dir, "**"),
      path.join(__dirname, directoryName(dir))
    )
  ));

  const deleteDirectory = (dir) => import("del").then((del) => (
    del.deleteAsync(path.join(__dirname, directoryName(dir)))
  ));

  testCase({
    "name": "no-arguments",
    "args": [],
    "exitCode": 2,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-arguments-fix",
    "script": "markdownlint-cli2-fix.js",
    "args": [],
    "exitCode": 2,
    "cwd": "no-config",
    "usesScript": true
  });

  testCase({
    "name": "no-arguments-config",
    "script": "markdownlint-cli2-config.js",
    "args": [],
    "exitCode": 2,
    "cwd": "no-config",
    "usesScript": true
  });

  testCase({
    "name": "one-argument-config",
    "script": "markdownlint-cli2-config.js",
    "args": [ "../config-files/cfg/.markdownlint-cli2.jsonc" ],
    "exitCode": 2,
    "cwd": "no-config",
    "usesScript": true
  });

  testCase({
    "name": "no-files",
    "args": [ "nothing-matches" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-files-exclamation",
    "args": [ "!" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-files-octothorpe",
    "args": [ "#" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "all-ok",
    "args": [ "**/*.md", "**/*.markdown" ],
    "exitCode": 0
  });

  testCase({
    "name": "no-config",
    "args": [ "**" ],
    "exitCode": 1
  });

  testCase({
    "name": "no-config-ignore",
    "args": [ "**", "!dir" ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-config-unignore",
    "args": [ "**", "!dir", "dir/subdir" ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-config-ignore-hash",
    "args": [ "**", "#dir" ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "file-paths-as-args",
    "args": [ "viewme.md", "./dir/subdir/info.md" ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "dot",
    "args": [ "." ],
    "exitCode": 1
  });

  testCase({
    "name": "dotfiles",
    "args": [ "**" ],
    "exitCode": 1
  });

  testCase({
    "name": "dotfiles-exclude",
    "args": [ "**", "!.dir", "!**/.info.md" ],
    "exitCode": 1,
    "cwd": "dotfiles"
  });

  testCase({
    "name": "globs",
    "args": [],
    "exitCode": 1
  });

  testCase({
    "name": "globs-and-args",
    "args": [ "**/*.markdown" ],
    "exitCode": 1
  });

  testCase({
    "name": "globs-and-ignores",
    "args": [],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-json",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-json-extends",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-jsonc",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-yaml",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-yml",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-cjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-mjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-json-yaml",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-json-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /(?:Unexpected end)|(?:Expected property name)/u
  });

  testCase({
    "name": "markdownlint-yaml-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Map keys must be unique/u
  });

  testCase({
    "name": "markdownlint-cjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module '/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-mjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module '/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-jsonc",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-cli2-jsonc-example",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("markdownlint-cli2-jsonc-example"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-jsonc-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /(?:Unexpected end)|(?:Expected property name)/u
  });

  testCase({
    "name": "markdownlint-cli2-yaml",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-cli2-yaml-example",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("markdownlint-cli2-yaml-example"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-yaml-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Map keys must be unique/u
  });

  testCase({
    "name": "markdownlint-cli2-cjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-mjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-cjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module '/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-mjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module '/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-extends",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "config-overrides-options",
    "args": [ "viewme.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "ignores",
    "args": [ "**/*.md", "**/*.markdown" ],
    "exitCode": 1
  });

  testCase({
    "name": "sibling-directory",
    "args": [ "../markdownlint-json/**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "sibling-directory-options",
    "args": [ "../no-config/**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "noInlineConfig",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "frontMatter",
    "args": [ "**/*.md" ],
    "exitCode": 0
  });

  testCase({
    "name": "literal-files",
    "args": [
      ":view(me).md",
      ":dir/view(me).md",
      ":dir(1)/viewme.md",
      ":dir(1)/(view)me.md"
    ],
    "exitCode": 1,
    "cwd": "literal-files/sentinel"
  });

  const literalFilesAbsoluteFile = absolute(
    path.join(__dirname, "literal-files"),
    "sentinel/dir(1)/(view)me.md"
  ).
    split(path.sep).
    join(path.posix.sep);
  testCase({
    "name": "literal-files-absolute",
    "args": [
      `:${literalFilesAbsoluteFile}`,
      "sentinel/dir"
    ],
    "exitCode": 1,
    "cwd": "literal-files"
  });

  testCase({
    "name": "fix",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("fix"),
    "pre": copyDirectory,
    "post": deleteDirectory
  });

  testCase({
    "name": "fix-scenarios",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("fix-scenarios"),
    "pre": copyDirectory,
    "post": deleteDirectory
  });

  testCase({
    "name": "fix-default-true",
    "script": "markdownlint-cli2-fix.js",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("fix-default-true"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesScript": true
  });

  testCase({
    "name": "fix-default-true-override",
    "script": "markdownlint-cli2-fix.js",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesScript": true
  });

  const configFiles = [
    ".markdownlint-cli2.jsonc",
    ".markdownlint-cli2.yaml",
    ".markdownlint-cli2.cjs",
    ".markdownlint-cli2.mjs",
    ".markdownlint.jsonc",
    ".markdownlint.json",
    ".markdownlint.yaml",
    ".markdownlint.yml",
    ".markdownlint.cjs",
    ".markdownlint.mjs"
  ];
  for (const configFile of configFiles) {
    testCase({
      "name": `config-files-${configFile}`,
      "script": "markdownlint-cli2-config.js",
      "args": [ `cfg/${configFile}`, "**/*.md" ],
      "exitCode": 1,
      "cwd": "config-files",
      "usesScript": true
    });
    testCase({
      "name": `config-files-${configFile}-alternate`,
      "script": "markdownlint-cli2-config.js",
      "args": [ `cfg/alternate${configFile}`, "**/*.md" ],
      "exitCode": 1,
      "cwd": "config-files",
      "usesScript": true
    });
    testCase({
      "name": `config-files-${configFile}-absolute`,
      "script": "markdownlint-cli2-config.js",
      "args": [
        path.join(__dirname, "config-files", `cfg/${configFile}`),
        "**/*.md"
      ],
      "exitCode": 1,
      "cwd": "config-files",
      "usesScript": true
    });
  }

  const invalidConfigFiles = [
    [
      "invalid.markdownlint-cli2.jsonc",
      /(?:Unexpected end)|(?:Expected property name)/u
    ],
    [ "invalid.markdownlint-cli2.cjs", /Unexpected end of input/u ],
    [ "invalid.markdownlint-cli2.mjs", /Unexpected end of input/u ],
    [
      "invalid.markdownlint.json",
      /(?:Unexpected end)|(?:Expected property name)/u
    ],
    [ "invalid.markdownlint.yaml", /Map keys must be unique/u ],
    [ "invalid.markdownlint.cjs", /Unexpected end of input/u ],
    [ "invalid.markdownlint.mjs", /Unexpected end of input/u ]
  ];
  for (const [ invalidConfigFile, stderrRe ] of invalidConfigFiles) {
    testCase({
      "name": `config-files-${invalidConfigFile}-invalid`,
      "script": "markdownlint-cli2-config.js",
      "args": [ `cfg/${invalidConfigFile}`, "**/*.md" ],
      "exitCode": 2,
      stderrRe,
      "cwd": "config-files",
      "usesRequire": true,
      "usesScript": true
    });
  }

  const redundantConfigFiles = [
    ".markdownlint-cli2.jsonc",
    ".markdownlint.json",
    ".markdownlint.cjs"
  ];
  for (const redundantConfigFile of redundantConfigFiles) {
    testCase({
      "name": `config-files-${redundantConfigFile}-redundant`,
      "script": "markdownlint-cli2-config.js",
      "args": [ redundantConfigFile, "*.md" ],
      "exitCode": 1,
      "cwd": redundantConfigFile.slice(1).replace(".", "-"),
      "usesScript": true
    });
  }

  testCase({
    "name": "config-file-unrecognized",
    "script": "markdownlint-cli2-config.js",
    "args": [ "cfg/unrecognized.jsonc", "**/*.md" ],
    "exitCode": 2,
    "stderrRe":
      // eslint-disable-next-line max-len
      /Configuration file "cfg\/unrecognized\.jsonc" is unrecognized; its name should be \(or end with\) one of the supported types \(e\.g\., "\.markdownlint\.json" or "example\.markdownlint-cli2\.jsonc"\)\./u,
    "cwd": "config-files",
    "usesScript": true
  });

  testCase({
    "name": "config-relative-commonjs",
    "script": "markdownlint-cli2-config.js",
    "args": [ "config/.markdownlint-cli2.jsonc", "viewme.md", "link.md" ],
    "exitCode": 1,
    "usesRequire": true,
    "usesScript": true
  });

  testCase({
    "name": "config-relative-module",
    "script": "markdownlint-cli2-config.js",
    "args": [ "config/.markdownlint-cli2.jsonc", "viewme.md", "link.md" ],
    "exitCode": 1,
    "usesScript": true
  });

  testCase({
    "name": "config-with-fix",
    "script": "markdownlint-cli2-config.js",
    "args": [ "config/.markdownlint-cli2.jsonc", "viewme.md", "info.md" ],
    "exitCode": 0,
    "cwd": directoryName("config-with-fix"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesScript": true
  });

  testCase({
    "name": "customRules",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-pre-imported",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module 'missing-package'\./u,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Property 'names' of custom rule at index 0 is incorrect\./u,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-throws",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownItPlugins",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownItPlugins-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module 'missing-package'\./u,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-npm",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-npm"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "env": {
      "FORCE_COLOR": 1,
      "FORCE_HYPERLINK": 1
    },
    "usesEnv": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-params",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-params"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-params-absolute",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-params-absolute"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-pre-imported",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-pre-imported"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-clean",
    "args": [ "**/*.md" ],
    "exitCode": 0,
    "cwd": directoryName("outputFormatters-clean"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-file",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to require or import module 'missing-package'\./u,
    "usesRequire": true
  });

  testCase({
    "name": "formatter-summarize",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "formatter-pretty",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "env": {
      "FORCE_COLOR": 1,
      "FORCE_HYPERLINK": 1
    },
    "usesEnv": true
  });

  testCase({
    "name": "formatter-pretty-appendLink",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "env": {
      "FORCE_COLOR": 1
    },
    "usesEnv": true
  });

  testCase({
    "name": "nested-files",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "nested-directories",
    "args": [ "**", "!a", "a/b", "#a/b/c", "a/b/c/d" ],
    "exitCode": 1,
    "cwd": "nested-directories"
  });

  testCase({
    "name": "nested-options-config",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cjs",
    "noRequire": true
  });

  testCase({
    "name": "markdownlint-mjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-mjs",
    "noRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-cjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cli2-cjs",
    "noRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-mjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cli2-mjs",
    "noRequire": true
  });

  testCase({
    "name": "customRules-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "customRules",
    "noRequire": true
  });

  testCase({
    "name": "markdownItPlugins-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownItPlugins",
    "noRequire": true
  });

  if (sameFileSystem) {

    testCase({
      "name": "tilde-paths-commonjs",
      "args": [ "*.md" ],
      "exitCode": 1,
      "usesRequire": true
    });

    testCase({
      "name": "tilde-paths-module",
      "args": [ "*.md" ],
      "exitCode": 1,
      "usesRequire": true
    });

  }

};

module.exports = testCases;
