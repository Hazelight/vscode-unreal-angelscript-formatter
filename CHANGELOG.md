# Change Log

## [0.1.3] - 2023-09-19

### Changed:
- Added git repository url to package.json
- Use esbuild to build the extension, resulting in a smaller extension size & faster activation time


## [0.1.2] - 2023-5-9

### Fixed:
- New lines being added after `private`, `protected` and `delegate` keywords
- Lines follwing an `access:` are now excluded from being formatted
- Whitespace are no longer added to `&out` and `&in` *(`&out` -> `& out`)*


## [0.1.1] - 2023-5-5

### Changed:
- Paths in the config can now be either absolute or relative to the workspace folder, and they cannot contain any variables

## [0.1.0] - 2023-5-4

- Initial release