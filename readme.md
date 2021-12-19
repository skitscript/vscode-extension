# Skitscript Extension (VS Code) [![Continuous Integration](https://github.com/skitscript/extension-vscode/workflows/Continuous%20Integration/badge.svg)](https://github.com/skitscript/extension-vscode/actions) [![License](https://img.shields.io/github/license/skitscript/extension-vscode.svg)](https://github.com/skitscript/extension-vscode/blob/master/license) [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/) [![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/skitscript.skitscript?label=vsix)](https://marketplace.visualstudio.com/items?itemName=skitscript.skitscript)

Adds support for Skitscript documents to Visual Studio Code.

## Features

- Syntax highlighting.
- "Find References" (shift+F12).
- Find declaration (F12).
- Rename (F2).
- Runs the [Skitscript parser](https://github.com/skitscript/parser-nodejs)
  and shows warnings and errors in the document and problems pane.

## Installation

You may be prompted to install this extension on opening a file with an
extension of `.skitscript`.

Alternatively, click [here](vscode:extension/skitscript.skitscript) to install
it in your local copy of Visual Studio Code.

## Test notes

Although this project has test coverage, that test coverage does not truly use
TypeScript.

To explain, a `vscode` module is able to be imported by all extensions running
within Visual Studio Code.  There is also a
[`@types/vscode`](https://www.npmjs.com/package/@types/vscode) package available
from NPM describing what that module provides.

It is not, however, possible to install, `require` or `import` the `vscode`
module outside of the Visual Studio Code hosting environment, so references to
concrete types within (`Diagnostic`, `Range`, etc.) are unresolvable during a
test.

The only workaround for this has been to use
[`rewire`](https://www.npmjs.com/package/rewire) to inject a fake `vscode`
module and use that, while using types from `@types/vscode`.  This then requires
a large amount of unsafe type casts to compile at all, to the point at which
TypeScript isn't doing much for the test code, only that of the extension
itself.

This has led to tests which are very unrealistic and likely fragile, but I do
not see a viable alternative given the `vscode` module situation.
