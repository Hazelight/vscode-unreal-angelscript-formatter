import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.LogOutputChannel;

    public static get outputChannel(): vscode.LogOutputChannel {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel("Unreal AngelScript Formatter", { log: true });
        }
        return this._outputChannel;
    }

    public static log(message: string) {
        this.outputChannel.appendLine(message);
    }

    /**
     * Shows an error dialog with the given message and logs the full message in the output channel
     * @param message The message to show in the error dialog
     * @param error The error.message will logged to the output channel
     */
    public static showErrorMessage(message: string, error: Error) {
        this.outputChannel.error(`${error.name} ${error.message}`);

        vscode.window.showErrorMessage(message, "Show Log").then((value) => {
            if (value === "Show Log") {
                this.outputChannel.show();
            }
        });
    }
}