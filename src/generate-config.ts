import * as vscode from 'vscode';

import * as path from 'path';
import * as fs from 'fs';

import * as utils from './utils';

export async function generateConfigFile(extensionPath: string) {
    // Make sure the default file exists
    const defaultFilepath = utils.getDefaultStyleFilepath(extensionPath);
    if (!fs.existsSync(defaultFilepath)) {
        vscode.window.showErrorMessage(`Could not find default style file: ${defaultFilepath}`);
        return;
    }

    // Ask user which directoy to save the file in
    const destUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        "title": "Select where to save the config file",
        "openLabel": "Generate .clang-format file"
    });

    if (!destUri)
        return;

    const destDir = destUri[0].fsPath;
    const destFilepath = path.join(destDir, ".clang-format");

    // Overwrite file if it already exists
    if (fs.existsSync(destFilepath)) {
        const selectedValue = await vscode.window.showWarningMessage(`File already exists: ${destFilepath}`, "Overwrite");
        if (selectedValue !== "Overwrite")
            return;

        fs.unlinkSync(destFilepath);
    }

    fs.copyFileSync(defaultFilepath, destFilepath);

    // Open the file
    const doc = await vscode.workspace.openTextDocument(destFilepath);
    await vscode.window.showTextDocument(doc);

    const selectedValue = await vscode.window.showInformationMessage(
        'Remember to set the "style" setting to point to this new file.',
        "Open settings");

    if (selectedValue === "Open settings") {
        utils.openExtensionConfig("style");
    }
}
