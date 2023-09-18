import * as vscode from 'vscode';
import * as path from 'path';

export const EXTENSION_ID = "unreal-angelscript-clang-format";

/**
 * Get this extension configuration
 */
export function getExtensionConfig() {
    return vscode.workspace.getConfiguration(EXTENSION_ID, vscode.window.activeTextEditor?.document.uri);
}


/**
 * Get a path from the extension config, and resolve it to make sure it's absolute
 * @param config The config key
 */
export function getConfigPath(config: string) {
    let value = getExtensionConfig().get<string>(config);

    // Make sure value is a string and not empty
    if (!value || typeof value !== "string") {
        return undefined;
    }

    // If path isn't absolute, make it relative to the workspace root
    if (!path.isAbsolute(value)) {
        const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
        value = path.join(workspaceRoot, value);
    }

    return path.normalize(value);
}


/**
 * Open the settings and filter the given property
 * @param property The property to search for
 */
export function openExtensionSetting(property: string) {
    vscode.commands.executeCommand('workbench.action.openSettings', `${EXTENSION_ID}.${property}`);
}