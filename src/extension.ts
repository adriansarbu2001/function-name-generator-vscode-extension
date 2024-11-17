import * as vscode from 'vscode';
import * as http from 'node:http';

export function activate(context: vscode.ExtensionContext) {
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
                } else {
                    vscode.window.showErrorMessage('Please select a Python comment to generate a function header.');
                }
            } else {
                vscode.window.showErrorMessage('This command only works in Python files.');
            }
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

async function getAIResponse(input: string): Promise<string | undefined> {
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
        const req = http.request(options, (res: http.IncomingMessage) => {
            let data = '';

            res.on('data', (chunk: any) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData.output_text);
                } catch (e) {
                    if (e instanceof Error) {
                        reject(`Error parsing response: ${e.message}`);
                    } else {
                        reject('Unknown error occurred while parsing response');
                    }
                }
            });
        });

        req.on('error', (e: any) => {
            reject(`Problem with request: ${e.message}`);
        });

        req.write(postData);
        req.end();
    });
}
