import * as vscode from 'vscode';

import * as child_process from 'child_process';
import * as path from 'path';

import * as utils from './utils';
import * as fs from 'fs';

import sax = require('sax');

const EXECUTABLE_CONFIG_KEY = 'executable';


function getDefaultStyleFilepath(extensionPath: string) {
    return path.join(extensionPath, "resources", "default-style", ".clang-format");
}


/**
 * @returns The path to the clang-format executable
 */
function getClangStyle(extensionPath: string) {
    let styleFilepath = utils.getConfigPath("style");
    if (!styleFilepath || !fs.existsSync(styleFilepath)) {
        styleFilepath = getDefaultStyleFilepath(extensionPath);
    }

    return `file:${styleFilepath}`;
}


function getClangExecutable() {
    let clangExecutable = utils.getConfigPath(EXECUTABLE_CONFIG_KEY);
    if (!clangExecutable) {
        // Assume clang-format is in the PATH
        return "clang-format";
    }

    if (fs.existsSync(clangExecutable)) {
        return clangExecutable;
    }

    vscode.window.showErrorMessage(
        `File ${clangExecutable} does not exist. Please update the \`${utils.EXTENSION_ID}.${EXECUTABLE_CONFIG_KEY}\` configuration`,
        "Open settings"
    ).then((pressedBtn) => {
        if (pressedBtn === "Open settings") {
            utils.openExtensionSetting(EXECUTABLE_CONFIG_KEY);
        }
    });

    return null;
}



export class AngelscriptClangDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {

    readonly memberKeywords = ["private", "protected", "delegate"];

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {}

    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return this.formatDocument(document, null, options, token);
    }

    public provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return this.formatDocument(document, range, options, token);
    }

    /**
     * Check if an edit should be applied, Angelscript has some cases that differ from C++, so we need to filter out some edits
     * @param document 
     * @param edit 
     * @param editRange 
     * @returns 
     */
    private allowEdit(document: vscode.TextDocument, edit: { length: number, offset: number, text: string }, editRange: vscode.Range) {
        
        if (editRange.isSingleLine) {
            const line = document.lineAt(editRange.start.line);
            const lineTrimmedText = line.text.trim();

            if (edit.length === 0 && edit.text === " ") {
                const testRange = new vscode.Range(
                    new vscode.Position(editRange.start.line, editRange.start.character - 1),
                    new vscode.Position(editRange.end.line, line.range.end.character)
                    );
                    const text = document.getText(testRange);
                    
                // Prevent spaces from being added between string prefixes and the string
                if (text.match(/^[A-z][\'\"]/)) {
                    return false;
                }
                
                // Prevent spaces from being added between & and "in" or "out"
                if (text.match(/^&(in|out)/)) {
                    return false;
                }

            }

            // Prevent new lines after these keywords
            for (const keyword of this.memberKeywords) {
                if (editRange.isSingleLine && lineTrimmedText.startsWith(`${keyword} `) && edit.text.includes("\n")) {
                    return false;
                }
            }

            // Don't format access: lines, these are a bit special
            if (lineTrimmedText.match(/^access\s*:/)) {
                return false;
            }
        }

        return true;
    }


    private getEdits(document: vscode.TextDocument, xml: string, codeContent: string): Thenable<vscode.TextEdit[]> {
        return new Promise((resolve, reject) => {
            const parser = sax.parser(true, {
                trim: false,
                normalize: false
            });

            const edits: vscode.TextEdit[] = [];
            let currentEdit: { length: number, offset: number, text: string } | null;

            const codeBuffer = Buffer.from(codeContent);

            // encoding position cache
            let codeByteOffsetCache = {
                byte: 0,
                offset: 0
            };
            let byteToOffset = function (editInfo: { length: number, offset: number }) {
                const offset = editInfo.offset;
                const length = editInfo.length;

                if (offset >= codeByteOffsetCache.byte) {
                    editInfo.offset = codeByteOffsetCache.offset + codeBuffer.slice(codeByteOffsetCache.byte, offset).toString("utf8").length;
                    codeByteOffsetCache.byte = offset;
                    codeByteOffsetCache.offset = editInfo.offset;
                } else {
                    editInfo.offset = codeBuffer.slice(0, offset).toString("utf8").length;
                    codeByteOffsetCache.byte = offset;
                    codeByteOffsetCache.offset = editInfo.offset;
                }

                editInfo.length = codeBuffer.slice(offset, offset + length).toString("utf8").length;

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


    private formatDocument(document: vscode.TextDocument, range: vscode.Range | null, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return new Promise((resolve, reject) => {
            // Get the clang executable
            const clangExecutable = getClangExecutable();
            if (!clangExecutable) {
                return reject("No clang-format executable");
            }

            const code = document.getText();

            let clangFormatArguments = [
                "-output-replacements-xml",
                `-style=${getClangStyle(this.context.extensionPath)}`,
                `-assume-filename=${document.fileName}`
            ];

            if (range) {
                let offset = document.offsetAt(range.start);
                let length = document.offsetAt(range.end) - offset;

                length = Buffer.byteLength(code.slice(offset, offset + length), "utf8");
                offset = Buffer.byteLength(code.slice(0, offset), "utf8");

                clangFormatArguments.push(`-offset=${offset}`, `-length=${length}`);
            }

            let workingPath = document.isUntitled ? vscode.workspace.workspaceFolders![0].uri.fsPath : path.dirname(document.fileName);

            let stdout = "";
            let stderr = "";
            const clangProcess = child_process.spawn(clangExecutable, clangFormatArguments, { cwd: workingPath });
            clangProcess.stdin.end(code);
            clangProcess.stdout.on('data', chunk => stdout += chunk);
            clangProcess.stderr.on('data', chunk => stderr += chunk);

            // On error
            clangProcess.on('error', err => {
                if (err && (<any>err).code === 'ENOENT') {
                    vscode.window.showErrorMessage(
                        `Failed to run '${clangExecutable}'. Please update the \`${utils.EXTENSION_ID}.${EXECUTABLE_CONFIG_KEY}\` configuration`,
                        "Open settings"
                    ).then((pressedBtn) => {
                        if (pressedBtn === "Open settings") {
                            utils.openExtensionSetting(EXECUTABLE_CONFIG_KEY);
                        }
                    });

                    return reject("No clang-format executable");
                }

                return reject(err);
            });

            // On exit/done
            clangProcess.on("close", exitCode => {
                try {
                    if (stderr.length !== 0) {
                        return reject(stderr);
                    }

                    if (exitCode !== 0) {
                        return reject();
                    }

                    return resolve(this.getEdits(document, stdout, code));
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
