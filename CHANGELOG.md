# Change Log

## [0.1.4] - 2023-12-22

### Added:
- Added command `unreal-angelscript-clang-format.generate-config-file` to generate a .clang-format file based on the default style

### Fixed:
- Fixed unwanted new line formatting after `event` keyword
- Fixed potential unwanted new line formatting if unconventional space characters are used

## [0.1.3] - 2023-09-19

### Changed:
- Added git repository url to package.json
- Use esbuild to build the extension, resulting in a smaller extension size & faster activation time

## [0.1.2] - 2023-05-09

### Fixed:
- New lines being added after `private`, `protected` and `delegate` keywords
- Lines follwing an `access:` are now excluded from being formatted
- Whitespace are no longer added to `&out` and `&in` *(`&out` -> `& out`)*

## [0.1.1] - 2023-05-05

### Changed:
- Paths in the config can now be either absolute or relative to the workspace folder, and they cannot contain any variables

## [0.1.0] - 2023-05-04

- Initial release