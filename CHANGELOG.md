# Change Log

## [1.0.0] - 2025-04-24

- Added support for multi-root workspaces
- Output log is now of type `LogOutputChannel`, leading to improved readability
- Fixed BraceWrapping: AfterFunction rule not working [#5](https://github.com/Hazelight/vscode-unreal-angelscript-formatter/issues/5)
- If `unreal-angelscript-clang-format.style` is set to an invalid filepath the extension will now show an error message instead of falling back to the default style
- Fixed some incorrect formatting being applied when using `access:`

## [0.1.5] - 2024-04-23

- Added logging & better error messages to help debug issues _(Logs can be found in the "Unreal Angelscript Formatter" output channel)_
- Removed duplicate mapping key `AlignTrailingComments` in the default style [#1](https://github.com/Hazelight/vscode-unreal-angelscript-formatter/issues/1)
- Fixed potential unwanted new line inserted between a function's return type and name

## [0.1.4] - 2023-12-22

- Added command `unreal-angelscript-clang-format.generate-config-file` to generate a .clang-format file based on the default style
- Fixed unwanted new line formatting after `event` keyword
- Fixed potential unwanted new line formatting if unconventional space characters are used

## [0.1.3] - 2023-09-19

- Added git repository url to package.json
- Use esbuild to build the extension, resulting in a smaller extension size & faster activation time

## [0.1.2] - 2023-05-09

- Fixed new lines being added after `private`, `protected` and `delegate` keywords
- Lines follwing an `access:` are now excluded from being formatted
- Whitespace are no longer added to `&out` and `&in` *(`&out` -> `& out`)*

## [0.1.1] - 2023-05-05

- Paths in the config can now be either absolute or relative to the workspace folder, and they cannot contain any variables

## [0.1.0] - 2023-05-04

- Initial release
