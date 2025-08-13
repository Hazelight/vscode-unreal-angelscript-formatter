import * as vscode from 'vscode';

import * as path from 'path';
import * as fs from 'fs';

import { clangFormatPath } from 'clang-format-node';

export const EXTENSION_ID = "unreal-angelscript-clang-format";
export const EXECUTABLE_CONFIG_KEY = 'executable';


export function getActiveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    if (vscode.window.activeTextEditor) {
        const activeDocument = vscode.window.activeTextEditor.document;
        return vscode.workspace.getWorkspaceFolder(activeDocument.uri);
    }
}

/**
 * Get this extension configuration
 */
export function getExtensionConfig() {
    return vscode.workspace.getConfiguration(EXTENSION_ID, getActiveWorkspaceFolder()?.uri);
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
        const activeWorkspaceFolder = getActiveWorkspaceFolder();
        if (!activeWorkspaceFolder) {
            return undefined;
        }

        const workspaceRoot = activeWorkspaceFolder.uri.fsPath;
        value = path.join(workspaceRoot, value);
    }

    return path.normalize(value);
}


/**
 * Open the settings and filter the given property
 * @param config The config key to search for, should not include the extension ID
 */
export function openExtensionConfig(config: string) {
    vscode.commands.executeCommand('workbench.action.openSettings', `${EXTENSION_ID}.${config}`);
}


/**
 * Get the path to the default clang-format style file
 * @param extensionPath The extension's installation path
 */
export function getDefaultStyleFilepath(extensionUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(extensionUri, "resources", "default-style", ".clang-format");
}


/**
 * Get the path to the clang-format style file
 * @param extensionPath The extension's installation path
 */
export function getClangStyle(extensionPath: vscode.Uri) {
    const styleFilepath = getConfigPath("style") || getDefaultStyleFilepath(extensionPath).fsPath;
    return `file:${styleFilepath}`;
}


/**
 * @returns The path to the clang-format executable, or null if it doesn't exist
 */
export function getClangExecutable() {
    let clangExecutable = getConfigPath(EXECUTABLE_CONFIG_KEY);
    if (!clangExecutable) {
        // If user hasn't set a path, use the clang-format that ships with the extension
        return clangFormatPath;
    }

    if (fs.existsSync(clangExecutable)) {
        return clangExecutable;
    }

    return null;
}


export async function uriExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch (e) {
        return false;
    }
}