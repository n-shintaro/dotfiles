"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * shows error icons
 */
class PythonInlinePreview {
    constructor(reporter, context) {
        this.reporter = reporter;
        this.errorDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: context.asAbsolutePath('media/red.jpg'),
        });
    }
    /**
     * sets gutter icons in sidebar. Safe - catches and logs any exceptions
     */
    updateErrorGutterIcons(error) {
        try {
            const errLineNums = this.getLineNumsFromPythonTrace(error);
            let decorations = errLineNums.map((num) => {
                const lineNum = num - 1; // python trace uses 1-based indexing but vscode lines start at 0
                const range = new vscode.Range(lineNum, 0, lineNum, 0);
                return { range };
            });
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.setDecorations(this.errorDecorationType, decorations);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                this.reporter.sendError(error);
            }
            else {
                this.reporter.sendError(new Error(error));
            }
        }
    }
    /**
     * returns line numbers for each error in the stack trace
     * @param error a python stacktrace
     */
    getLineNumsFromPythonTrace(error) {
        /* this regex will get the line number of each error. A error might look like this:
        
        Traceback (most recent call last):
        line 4, in <module>
        line 2, in foo
        TypeError: unsupported operand type(s) for +: 'int' and 'str'
        
        The regex will not get line numbers in different files. Those have different format:
        File "filePath", line 394, in func
        */
        const lineNumRegex = /^ *line (\d+), in /gm;
        let errLineNums = [];
        let match;
        while (match = lineNumRegex.exec(error)) {
            const matchCaptureGroup = match[1];
            errLineNums.push(parseInt(matchCaptureGroup));
        }
        return errLineNums;
    }
}
exports.default = PythonInlinePreview;
//# sourceMappingURL=pythonInlinePreview.js.map