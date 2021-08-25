import * as vscode from 'vscode';
import { IntermediateJson } from "./types/IntermediateJson";
import CharmonyPanelController_v2 from "./outputPanel/PanelController_v2";
import { runServerAnalysis } from './feature/runServerAnalysis';

const hlConsole = vscode.window.createOutputChannel("HarmonyLang");

export function activate(context: vscode.ExtensionContext) {

	const runHarmonyCommand = vscode.commands.registerCommand('harmonylang-lite.run', () => {
        try {
            const filename = vscode.window.activeTextEditor?.document?.fileName;
            if (!filename?.endsWith('.hny')) {
                vscode.window.showInformationMessage('Target file must be an Harmony (.hny) file.');
                return;
            }
            if (filename == null) {
                vscode.window.showInformationMessage('Could not locate target file.');
                return;
            }
            runHarmony(context, filename);
        } catch (e) {
            console.error('Run Harmony failed:', e);
            vscode.window.showInformationMessage('Run Harmony failed. See the console log in the DevTools.');
        }
    });

    context.subscriptions.push(runHarmonyCommand);
}

const showVscodeMessage = (isError: boolean, main: string, subHeader?: string, subtext?: string) => {
    const show = isError ? vscode.window.showErrorMessage : vscode.window.showInformationMessage;
    if (subHeader == null || subtext == null) {
        show(main);
    } else {
        show(main + (subtext.length > 0 ? `\n${subHeader}: ${subtext}` : ''));
    }
};

const showMessage = (main: string, subHeader?: string, subtext?: string) => {
    return showVscodeMessage(false, main, subHeader, subtext);
};

function onReceivingIntermediateJSON(results: IntermediateJson) {
    if (results != null && results.issue != null && results.issue != "No issues") {
        CharmonyPanelController_v2.currentPanel?.updateResults(results);
    } else {
        CharmonyPanelController_v2.currentPanel?.updateMessage(`No Errors Found.`);
    }
}

export function runHarmony(context: vscode.ExtensionContext, fullFileName: string) {
    CharmonyPanelController_v2.currentPanel?.dispose();
    CharmonyPanelController_v2.createOrShow(context.extensionUri);
    CharmonyPanelController_v2.currentPanel?.startLoading();
    runServerAnalysis(hlConsole, fullFileName, (json, staticHtmlUrl, duration) => {
        if (staticHtmlUrl && duration) {
            hlConsole.appendLine(`Harmony HTML can be found here: ${staticHtmlUrl}`);
            showMessage("Download HTML file.", `Link lasts for ${duration / 60 / 1000} minute(s)`, staticHtmlUrl);
        }
        onReceivingIntermediateJSON(json);
    }, msg => {
        hlConsole.appendLine(msg);
        CharmonyPanelController_v2.currentPanel?.updateMessage(msg);
    });
}


// this method is called when your extension is deactivated
export function deactivate() {}
