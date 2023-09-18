# Unreal Angelscript Clang-Format

Format Unreal Engine Angelscript code using Clang-Format

<br>

## Usage

Use `Format Document` _(Default Shortcut: <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>F</kbd>)_ to format the current document.  
Or `Format Selection` _(Default Shortcut: <kbd>Ctrl</kbd> + <kbd>K</kbd> <kbd>Ctrl</kbd> + <kbd>F</kbd>)_ to format the currently selected code.

<br>

## Setup

Set the configuration `unreal-angelscript-clang-format.executable` to point to a __clang-format.exe__ executable.  
Optionally create a [.clang-format](https://clang.llvm.org/docs/ClangFormatStyleOptions.html) file containing your preferences and set the configuration `unreal-angelscript-clang-format.style` to point to that file.

Paths can be either absolute or relative to the workspace.