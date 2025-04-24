import * as assert from 'assert';

import * as vscode from 'vscode';


import { AngelscriptClangDocumentFormattingEditProvider } from '../formatter';

suite('Apply Formatting', () => {
    const currentDir = vscode.Uri.file(__dirname);
    const formattedFilepath = vscode.Uri.joinPath(currentDir, "..", "..", "test", "fixture", "fixture-formatted.as");
    const unformattedFilepath = vscode.Uri.joinPath(currentDir, "..", "..", "test", "fixture", "fixture-unformatted.as");

    let extensionContext: any
    let document: vscode.TextDocument
    let expectedFormattedText: string

    setup(async () => {
        const extension = vscode.extensions.getExtension("Hazelight.unreal-angelscript-clang-format");
        if (!extension)
            throw new Error("Extension not found");
        extensionContext = {
            extensionUri: extension.extensionUri,
        }

        document = await vscode.workspace.openTextDocument(unformattedFilepath);

        const formattedDocument = await vscode.workspace.openTextDocument(formattedFilepath);
        expectedFormattedText = formattedDocument.getText();
    });

    teardown(() => {
    });

    test('Format Fixtures', async function () {
        const formattingProvider = new AngelscriptClangDocumentFormattingEditProvider(extensionContext);

        const edits = await formattingProvider.provideDocumentFormattingEdits(document, {
            "insertSpaces": true,
            "tabSize": 4,
        }, null as any);

        // Apply the edits
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, edits);
        await vscode.workspace.applyEdit(workspaceEdit);

        const formattedText = document.getText();
        assert.strictEqual(formattedText, expectedFormattedText, "Formatted text does not match expected text");
    });
});
