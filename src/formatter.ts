import * as vscode from 'vscode';

import * as child_process from 'child_process';
import * as path from 'path';

import * as utils from './utils';
import { Logger } from './logger';

import sax = require('sax');

const POPUP_ERROR_MESSAGE = "Failed to format document";

interface IEditInfo {
    length: number;
    offset: number;
    text: string;
}


export class AngelscriptClangDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {

    private readonly memberKeywords = ["private", "protected", "delegate", "event"];

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return this.formatDocument(document, null, options, token);
    }

    public provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return this.formatDocument(document, range, options, token);
    }

    /**
     * Check if an edit should be applied. AngelScript has some cases that differ from C++, so we need to filter out some edits
     * @param document The document being formatted
     * @param edit The edit to check
     * @param editRange The range of the edit
     * @returns True if the edit should be applied, false otherwise
     */
    private allowEdit(document: vscode.TextDocument, edit: IEditInfo, editRange: vscode.Range) {
        const startLine = document.lineAt(editRange.start.line);

        const startLineText = startLine.text;
        const startLineTextEdited = startLineText.slice(0, editRange.start.character) + edit.text + startLineText.slice(editRange.end.character);

        if (editRange.isSingleLine) {
            // Prevent certain spaces from being added
            if (edit.length === 0 && edit.text === " ") {
                const testRange = new vscode.Range(
                    new vscode.Position(editRange.start.line, editRange.start.character - 1),
                    new vscode.Position(editRange.end.line, startLine.range.end.character)
                );
                const text = document.getText(testRange);

                // Prevent spaces from being added between string prefixes and the string (e.g. f-strings)
                if (text.match(/^[A-z][\'\"]/))
                    return false;

                // Prevent spaces from being added between & and "in" or "out"
                if (text.match(/^&(in|out)/))
                    return false;
            }

            // Prevent new lines after function return types
            // This can happen if you have e.g. a struct that you don't close with a semicolon, followed by a function
            if (startLineText.match(/^\s*([A-z_])+\s+([A-z0-9_])+\s*\(/) &&
                startLineTextEdited.match(/^\s*([A-z_])+\r?\n\s*([A-z0-9_])+\s*\(/) &&
                edit.text.includes("\n")) {
                return false;
            }

            // Prevent new lines after these keywords
            for (const keyword of this.memberKeywords) {
                if (startLineText.match(new RegExp(`^\\s*${keyword}\\s`)) &&
                    startLineTextEdited.match(new RegExp(`^\\s*${keyword}\r?\n`))) {
                    return false;
                }
            }
        }

        // Don't format access: lines, these are a bit special
        if (startLineText.trim().match(/^\s*access\s*:/))
            return false;

        return true;
    }

    /**
     * Construct vscode.TextEdit objects from the clang-format xml output
     * @param document The document being formatted
     * @param xml The xml output from clang-format
     * @param documentText The text of the document
     * @returns An array of vscode.TextEdit objects that should be applied to the document
     */
    private getEdits(document: vscode.TextDocument, xml: string, documentText: string): Thenable<vscode.TextEdit[]> {
        return new Promise((resolve, reject) => {
            const parser = sax.parser(true, {
                trim: false,
                normalize: false
            });

            const edits: vscode.TextEdit[] = [];
            let currentEdit: IEditInfo | null;

            const documentTextBuffer = Buffer.from(documentText);

            // encoding position cache
            let codeByteOffsetCache = {
                byte: 0,
                offset: 0
            };
            let byteToOffset = function (editInfo: { length: number, offset: number }) {
                const offset = editInfo.offset;
                const length = editInfo.length;

                if (offset >= codeByteOffsetCache.byte) {
                    editInfo.offset = codeByteOffsetCache.offset + documentTextBuffer.slice(codeByteOffsetCache.byte, offset).toString("utf8").length;
                    codeByteOffsetCache.byte = offset;
                    codeByteOffsetCache.offset = editInfo.offset;
                }
                else {
                    editInfo.offset = documentTextBuffer.slice(0, offset).toString("utf8").length;
                    codeByteOffsetCache.byte = offset;
                    codeByteOffsetCache.offset = editInfo.offset;
                }

                editInfo.length = documentTextBuffer.slice(offset, offset + length).toString("utf8").length;

                return editInfo;
            };

            parser.onerror = (err) => {
                reject(err.message);
            };

            parser.onopentag = (tag) => {
                if (currentEdit) {
                    reject("Malformed output");
                }

                switch (tag.name) {
                    case "replacements":
                        return;

                    case "replacement":
                        currentEdit = {
                            length: parseInt(tag.attributes["length"].toString()),
                            offset: parseInt(tag.attributes["offset"].toString()),
                            text: ""
                        };
                        byteToOffset(currentEdit);
                        break;

                    default:
                        reject(`Unexpected tag ${tag.name}`);
                }
            };

            parser.ontext = (text) => {
                if (!currentEdit) {
                    return;
                }

                currentEdit.text = text;
            };

            parser.onclosetag = (tagName) => {
                if (!currentEdit) {
                    return;
                }

                let start = document.positionAt(currentEdit.offset);
                let end = document.positionAt(currentEdit.offset + currentEdit.length);

                let editRange = new vscode.Range(start, end);

                if (!this.allowEdit(document, currentEdit, editRange)) {
                    currentEdit = null;
                    return;
                }

                edits.push(new vscode.TextEdit(editRange, currentEdit.text));
                currentEdit = null;
            };

            parser.onend = () => {
                resolve(edits);
            };

            parser.write(xml);
            parser.end();
        });
    }

    /**
     * Get formatting edits for a document
     * @param document The document to format
     * @param range The range to format, or null to format the whole document
     * @param options Formatting options
     * @param token Cancellation token
     * @returns A promise that resolves to the edits
     */
    private formatDocument(document: vscode.TextDocument, range: vscode.Range | null, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return new Promise((resolve, reject) => {
            // Get the clang executable
            const clangExecutable = utils.getClangExecutable();
            if (!clangExecutable) {
                Logger.showErrorMessage("No clang-format executable found", Error(`Could not locate a clang executable at "${clangExecutable}". Please update the \`${utils.EXTENSION_ID}.${utils.EXECUTABLE_CONFIG_KEY}\` configuration`));
                return reject("No clang-format executable");
            }

            const documentText = document.getText();

            const style = utils.getClangStyle(this.context.extensionUri);
            let clangFormatArguments = [
                "-output-replacements-xml",
                `-style=${style}`,
                `-assume-filename=${document.fileName}`
            ];

            if (range) {
                let offset = document.offsetAt(range.start);
                let length = document.offsetAt(range.end) - offset;

                length = Buffer.byteLength(documentText.slice(offset, offset + length), "utf8");
                offset = Buffer.byteLength(documentText.slice(0, offset), "utf8");

                clangFormatArguments.push(`-offset=${offset}`, `-length=${length}`);
            }

            let workingPath = undefined;
            if (document.isUntitled) {
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
                    workingPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }
            else {
                workingPath = path.dirname(document.fileName);
            }

            Logger.log(`Running "${clangExecutable}" with arguments:\n${clangFormatArguments.join("\n")}`);

            let stdout = "";
            let stderr = "";
            const clangProcess = child_process.spawn(clangExecutable, clangFormatArguments, { cwd: workingPath });
            clangProcess.stdin.end(documentText);
            clangProcess.stdout.on('data', chunk => stdout += chunk);
            clangProcess.stderr.on('data', chunk => stderr += chunk);

            let bHasShownError = false; // Prevent showing multiple error popups

            // On error
            clangProcess.on('error', err => {
                bHasShownError = true;

                if (err && (<any>err).code === 'ENOENT') {
                    vscode.window.showErrorMessage(
                        `Could not find '${clangExecutable}'. Please update the \`${utils.EXTENSION_ID}.${utils.EXECUTABLE_CONFIG_KEY}\` configuration`,
                        "Open settings"
                    ).then((pressedBtn) => {
                        if (pressedBtn === "Open settings") {
                            utils.openExtensionConfig(utils.EXECUTABLE_CONFIG_KEY);
                        }
                    });

                    Logger.log(err.message);
                    return reject("No clang-format executable");
                }

                Logger.showErrorMessage(POPUP_ERROR_MESSAGE, err);

                return reject(err);
            });

            // On exit/done
            clangProcess.on("close", exitCode => {
                try {
                    if (stderr.length !== 0) {
                        Logger.showErrorMessage(POPUP_ERROR_MESSAGE, Error(stderr));
                        return reject(stderr);
                    }

                    if (exitCode !== 0) {
                        if (bHasShownError)
                            Logger.log(`clang-format exited with code ${exitCode}`);
                        else
                            Logger.showErrorMessage(POPUP_ERROR_MESSAGE, Error(`clang-format exited with code ${exitCode}`));

                        return reject();
                    }

                    return resolve(this.getEdits(document, stdout, documentText));
                } catch (e) {
                    reject(e);
                }
            });

            if (token) {
                token.onCancellationRequested(() => {
                    clangProcess.kill();
                    reject("Cancelation requested");
                });
            }
        });
    }
}
