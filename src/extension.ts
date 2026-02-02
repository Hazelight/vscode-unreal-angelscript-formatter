import * as vscode from 'vscode';
import * as generateConfig from './generate-config';

import { AngelscriptClangDocumentFormattingEditProvider } from "./formatter";


export function activate(context: vscode.ExtensionContext) {

	// ---- Formatters ---- //
	const formatter = new AngelscriptClangDocumentFormattingEditProvider(context);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider("angelscript", formatter)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider("angelscript", formatter)
	);

	context.subscriptions.push(
		vscode.languages.registerOnTypeFormattingEditProvider(
			"angelscript",
			formatter,
			"\n", "("
		)
	);

	// ---- Commands ---- //
	context.subscriptions.push(
		vscode.commands.registerCommand("unreal-angelscript-clang-format.generate-config-file", () => {
			generateConfig.generateConfigFile(context.extensionUri);
		})
	);
}


export function deactivate() { }
