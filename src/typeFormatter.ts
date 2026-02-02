/**
 * Helper functions for on-type formatting.
 *
 * This formatter runs while the user is typing and must be treated with care.
 * It should apply only small, predictable edits local to the typed character,
 * leaving larger or structural changes to when formatting the entire document.
 */

import * as vscode from 'vscode';

export interface IFormattingEdit {
    range: vscode.Range;
    validator?: (document: vscode.TextDocument, edit: vscode.TextEdit) => boolean;
}


// --------------------------------------------------------------------------------
//                                  NEW LINE
// --------------------------------------------------------------------------------

/**
 * Apply formatting when inserting a new line between 2 brackets, to make sure the first bracket also is moved down.
 * ```
 * if (true) {|}
 * 
 * if (true)
 * {
 *     |
 * }
 * ```
 */
function newLineBetweenBrackets(document: vscode.TextDocument, position: vscode.Position): vscode.Range | null {
    const line = document.lineAt(Math.max(0, position.line - 1));

    const match = line.text.match(/([A-z0-9)])(\s*){\s*$/);
    if (!match) {
        return null;
    }

    const lastCharIndex = match.index! + match[1].length - 1;
    const openingBraceIndex = match.index! + match[1].length + match[2].length;

    return new vscode.Range(
        new vscode.Position(line.lineNumber, lastCharIndex + 1),
        new vscode.Position(line.lineNumber, openingBraceIndex)
    );
}


/**
 * Apply formatting when inserting a new line after a comma or opening parentheses within function arguments.
 * ```
 * func(a,|b)
 * 
 * func(a,
 *     |b)
 * ```
 */
function newLineArguments(document: vscode.TextDocument, position: vscode.Position): vscode.Range | null {
    const line = document.lineAt(Math.max(0, position.line - 1));

    const match = line.text.match(/([\(,|&])\s*$/);
    if (!match) {
        return null;
    }

    const firstCharIndex = document.lineAt(Math.max(0, position.line)).firstNonWhitespaceCharacterIndex;

    return new vscode.Range(
        new vscode.Position(line.lineNumber, match.index! + 1),
        new vscode.Position(position.line, firstCharIndex)
    );
}


/** 
 * Only allow the edit if it numbers of newlines is increased or unchanged.
 */
function newLineArgumentsValidator(document: vscode.TextDocument, edit: vscode.TextEdit): boolean {
    const oldText = document.getText(edit.range);
    return oldText.split('\n').length <= edit.newText.split('\n').length;
}


export function onTypeFormattingNewLine(document: vscode.TextDocument, position: vscode.Position): IFormattingEdit | null {
    let range = newLineBetweenBrackets(document, position);
    if (range !== null) {
        return { range };
    }

    range = newLineArguments(document, position);
    if (range !== null) {
        return { range, validator: newLineArgumentsValidator };
    }

    return null;
}


// --------------------------------------------------------------------------------
//                                  PARENTHESES
// --------------------------------------------------------------------------------


/**
 * Apply formatting when inserting a ( after certain keywords, to ensure a space is added.
 * ```
 * if(|)
 * 
 * if (|)
 * ```
 */
export function onTypeFormattingOpenParentheses(document: vscode.TextDocument, position: vscode.Position): IFormattingEdit | null {
    const line = document.lineAt(Math.max(0, position.line));

    const textUpToPosition = line.text.substring(0, position.character);

    const match = textUpToPosition.match(/^(\s*)(if|else\sif|for|switch|while)(\s*)\($/);
    if (!match) {
        return null;
    }

    const keywordEndIndex = match.index! + match[1].length + match[2].length;
    const openingParenthesesIndex = keywordEndIndex + match[3].length;

    const range = new vscode.Range(
        new vscode.Position(line.lineNumber, keywordEndIndex),
        new vscode.Position(line.lineNumber, openingParenthesesIndex)
    );

    return { range };
}
