/**
 * Helper functions for on-type formatting.
 *
 * This formatter runs while the user is typing and must be treated with care.
 * It should apply only small, predictable edits local to the typed character,
 * leaving larger or structural changes to when formatting the entire document.
 */

import * as vscode from 'vscode';


export function onTypeFormattingNewLine(document: vscode.TextDocument, position: vscode.Position) {
    const prevLine = document.lineAt(Math.max(0, position.line - 1));

    const match = prevLine.text.match(/([A-z0-9)])(\s*){\s*$/);
    if (!match) {
        return null;
    }

    const lastCharIndex = match.index! + match[1].length - 1;
    const openingBraceIndex = match.index! + match[1].length + match[2].length;

    const range = new vscode.Range(
        new vscode.Position(prevLine.lineNumber, lastCharIndex + 1),
        new vscode.Position(prevLine.lineNumber, openingBraceIndex)
    );

    return range;
}
