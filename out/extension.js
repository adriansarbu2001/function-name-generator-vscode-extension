"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const http = __importStar(require("node:http"));
function activate(context) {
    // Register the command that is invoked via shortcut or context menu
    let disposable = vscode.commands.registerCommand('extension.generateFunctionHeader', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            // Only proceed if the document is a Python file
            if (document.languageId === 'python') {
                // Automatically select the entire line where the cursor is
                const cursorPosition = editor.selection.active;
                const line = document.lineAt(cursorPosition.line);
                const selection = new vscode.Selection(line.range.start, line.range.end);
                const selectedText = document.getText(selection);
                // Check if the selected text is a Python comment
                if (selectedText.trim().startsWith('#')) {
                    const inputText = selectedText.replace('#', '').trim();
                    // Send request to AI server
                    const responseText = await getAIResponse(inputText);
                    if (responseText) {
                        editor.edit(editBuilder => {
                            const position = selection.end;
                            editBuilder.insert(position, `\n${responseText}`);
                        });
                    }
                }
                else {
                    vscode.window.showErrorMessage('Please select a Python comment to generate a function header.');
                }
            }
            else {
                vscode.window.showErrorMessage('This command only works in Python files.');
            }
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
async function getAIResponse(input) {
    const postData = JSON.stringify({ input_text: input });
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/inference',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData.output_text);
                }
                catch (e) {
                    if (e instanceof Error) {
                        reject(`Error parsing response: ${e.message}`);
                    }
                    else {
                        reject('Unknown error occurred while parsing response');
                    }
                }
            });
        });
        req.on('error', (e) => {
            reject(`Problem with request: ${e.message}`);
        });
        req.write(postData);
        req.end();
    });
}
//# sourceMappingURL=extension.js.map