import * as vscode from 'vscode';
import axios from 'axios';
import 'formdata-polyfill';
import JSZip = require('jszip');
import { IntermediateJson } from '../types/IntermediateJson';
import { HARMONY_SERVER_API, VERSION_VALUE } from './../config';

export async function runServerAnalysis(
    outputChannel: vscode.OutputChannel,
    mainFilename: string,
    onFailModelCheck: (json: IntermediateJson, staticHtmlUrl?: string, duration?: number) => void,
    onOther: (msg: string) => void
): Promise<void> {
    const bodyFormData = new FormData();
    const zip = new JSZip();
    const search = vscode.workspace.findFiles("*.hny")
    const getFileName = function (str : String) {
        return str.replace(/^.*[\\\/]/, '');
    }
    let fileNum = 0;
    const uris = await search
    for (const uri of uris){
        let text = await vscode.workspace.fs.readFile(uri)
        zip.file(getFileName(uri.fsPath), new TextDecoder().decode(text));
        outputChannel.appendLine(`Zipping File: ${getFileName(uri.fsPath)}`);
        fileNum++;
    }

    if (fileNum <= 0) 
        return onOther("No files in workspace");

    let zippedFiles = await zip.generateAsync({type:"blob"})
    bodyFormData.append("file", zippedFiles);
    bodyFormData.append("main", getFileName(mainFilename));
    bodyFormData.append("version", VERSION_VALUE);
    bodyFormData.append("source", "vscode");

    outputChannel.appendLine(`Uploading for analysis...
    - Entry Point: ${getFileName(mainFilename)}
    - Harmonylang Lite Version: ${VERSION_VALUE}`);
    
    try {
        axios.post(HARMONY_SERVER_API + "/check",
            bodyFormData,
            {
                headers: { "Content-Type": "multipart/form-data" },
        }).then(function (response) {
            if (200 <= response.status && response.status < 300) {
                const data = response.data;
                if (data.status === "FAILURE") {
                    const json: IntermediateJson = data.jsonData;
                    if (data.staticHtmlLocation && data.duration) {
                        const staticHtmlUrl = HARMONY_SERVER_API + data.staticHtmlLocation;
                        const duration: number = data.duration;
                        return onFailModelCheck(json, staticHtmlUrl, duration);
                    } else {
                        return onFailModelCheck(json);
                    }
                }
                return onOther(data.message);
            } else {
                return onOther(response.data);
            }
        });
    } catch (err) {
        console.log(err);
    }
}
