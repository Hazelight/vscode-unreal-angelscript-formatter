import * as vscode from 'vscode';

import { AngelscriptClangDocumentFormattingEditProvider } from "./formatter";


export function activate(context: vscode.ExtensionContext) {

	const formatter = new AngelscriptClangDocumentFormattingEditProvider(context);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider("angelscript", formatter)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider("angelscript", formatter)
	);
}


export function deactivate() { }
