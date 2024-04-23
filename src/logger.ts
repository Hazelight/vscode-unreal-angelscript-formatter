import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.OutputChannel;

    public static log(message: string) {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel("Unreal AngelScript Formatter");
        }

        const dateTimeStr = new Date().toLocaleString();

        this._outputChannel.appendLine(`[${dateTimeStr}] ${message}`);
    }

    public static show() {
        if (this._outputChannel)
            this._outputChannel.show();
    }

    /**
     * Shows an error dialog with the given message and logs the full message in the output channel
     * @param message The message to show in the error dialog
     * @param fullMessage The full message to log in the output channel
     */
    public static showErrorMessage(message: string, fullMessage: string) {
        this.log(fullMessage);

        vscode.window.showErrorMessage(message, "Show Log").then((value) => {
            if (value === "Show Log") {
                this.show();
            }
        });
    }
}