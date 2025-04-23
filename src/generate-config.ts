import * as vscode from 'vscode';

import * as utils from './utils';
import { Logger } from './logger';

export async function generateConfigFile(extensionUri: vscode.Uri) {
    // Make sure the default file exists
    const defaultStyle = utils.getDefaultStyleFilepath(extensionUri);
    if (!await utils.uriExists(defaultStyle)) {
        vscode.window.showErrorMessage(`Could not find default style file: ${defaultStyle.fsPath}`);
        return;
    }

    // Ask user which directoy to save the file in
    const destDirectory = await vscode.window.showOpenDialog({
        defaultUri: utils.getActiveWorkspaceFolder()?.uri,
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        "title": "Select where to save the config file",
        "openLabel": "Create .clang-format file"
    });

    if (!destDirectory)
        return;

    const destFilepath = vscode.Uri.joinPath(destDirectory[0], ".clang-format");

    // Ask before overwriting the file
    if (await utils.uriExists(destFilepath)) {
        const selectedValue = await vscode.window.showWarningMessage(
            `File already exists`,
            {
                "modal": true,
                "detail": destFilepath.fsPath
            },
            "Overwrite"
        );
        if (selectedValue !== "Overwrite")
            return;
    }

    Logger.log(`Copying ${defaultStyle.fsPath} to ${destFilepath.fsPath}`);

    try {
        await vscode.workspace.fs.copy(defaultStyle, destFilepath, { overwrite: true });
    }
    catch (error) {
        Logger.showErrorMessage("Error copying file", error as Error);
        return;
    }

    const doc = await vscode.workspace.openTextDocument(destFilepath);
    await vscode.window.showTextDocument(doc);

    const selectedValue = await vscode.window.showInformationMessage(
        'Remember to set the "style" setting to point to this new file.',
        "Open settings");

    if (selectedValue === "Open settings") {
        utils.openExtensionConfig("style");
    }
}
