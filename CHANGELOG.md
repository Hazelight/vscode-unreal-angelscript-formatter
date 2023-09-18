# Change Log

## [0.1.3] - UNRELEASED

### Changed:
- Added git repository url to package.json
- Use esbuild to build the extension, resulting in a smaller extension size & faster activation time


## [0.1.2]

### Fixed:
- New lines being added after `private`, `protected` and `delegate` keywords.
- Lines follwing an `access:` line not being formatted
- A single whitespace beeing added to `&out` and `&in` *(`&out` -> `& out`)*


## [0.1.1]

### Changed:
- Paths in the config can now be either absolute or relative to the workspace folder, and they cannot contain any variables.

## [0.1.0]

- Initial release