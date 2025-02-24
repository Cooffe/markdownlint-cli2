# Changelog

## 0.9.2

- Remove `npm-shrinkwrap.json` entirely to avoid `npm` failures

## 0.9.1

- Remove `devDependencies` from `npm-shrinkwrap.json` to avoid `npm` failures

## 0.9.0

- Add support for Node.js's `package.json` as a configuration file source
- Add output formatter for Static Analysis Results Interchange Format/SARIF
- Bundle `npm-shrinkwrap.json` for reproducible/faster installs
- Update dependencies (including `markdownlint`)

## 0.8.1

- Handle `--config` edge case

## 0.8.0

- Add support for `--config` and `--fix` parameters
- Update dependencies (including `markdownlint`)
- Remove support for end-of-life Node 14

## 0.7.1

- Update dependencies (including `markdownlint`)

## 0.7.0

- Add support for `extends` in `config` property of `.markdownlint-cli2.*` files
- Build and publish `davidanson/markdownlint-cli2-rules` Docker container image
- Update dependencies (including `markdownlint`)

## 0.6.0

- Update dependencies (including `markdownlint`)

## 0.5.1

- Update dependencies

## 0.5.0

- New rules
- Support modules (MJS) everywhere
- Include dotfiles

## 0.4.0

- New rules
- Async custom rules
- Explicit config
- CJS (breaking)

## 0.3.2

- Extensibility/Windows/consistency improvements

## 0.3.1

- Extensibility tweaks

## 0.3.0

- Add Docker container
- Update dependencies

## 0.2.0

- Improve handling of Windows paths using backslash

## 0.1.3

- Support rule collections

## 0.1.2

- Update use of `require` to be more flexible

## 0.1.1

- Restore previous use of `require`

## 0.1.0

- Simplify use of `require`
- Increment minor version

## 0.0.15

- Improve extensibility

## 0.0.14

- Update dependencies (including `markdownlint`)

## 0.0.13

- Add `markdownlint-cli2-fix` command

## 0.0.12

- Update dependencies (including `markdownlint`)

## 0.0.11

- Improve performance of `fix`
- Update banner

## 0.0.10

- Improve performance and configuration

## 0.0.9

- Improve configuration file handling

## 0.0.8

- Support `.markdownlint-cli2.yaml`
- Add progress

## 0.0.7

- Support `.markdownlint-cli2.js` and `.markdownlint.js`

## 0.0.6

- Improve handling of very large directory trees

## 0.0.5

- Improve support for ignoring files

## 0.0.4

- Support output formatters and `markdown-it` plugins

## 0.0.3

- Feature parity with `markdownlint-cli`

## 0.0.2

- Initial release
