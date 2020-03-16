"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utilities_1 = require("./utilities");
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
     * Safe - catches and logs any exceptions
     */
    showInlineErrors(error, userErrorMsg) {
        try {
            if (userErrorMsg.includes("AREPL has ran into an error")) {
                // this.showInternalError(userErrorMsg)
                // return
            }
            const decorations = this.convertErrorToDecorationOptions(error);
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.setDecorations(this.errorDecorationType, decorations);
            }
        }
        catch (internalError) {
            if (internalError instanceof Error) {
                this.reporter.sendError(internalError);
            }
            else {
                this.reporter.sendError(new Error(internalError));
            }
        }
    }
    showInternalError(internalError) {
        throw Error('not implemented');
    }
    convertFrameToDecorationOption(frame) {
        const lineNum = frame.lineno - 1; // python trace uses 1-based indexing but vscode lines start at 0
        // todo: pull endCharNum from relevant line from file
        // remember that the file might not be the active doc...
        const endCharNum = 0;
        const range = new vscode.Range(lineNum, 0, lineNum, endCharNum);
        // temporarily skip error text untill above todo is fixed
        // _str might be empty if user raised an error while leaving message empty
        //const text = error._str ? error._str : error.exc_type["py/type"]
        const text = "";
        return {
            range,
            renderOptions: {
                after: {
                    contentText: text
                }
            }
        };
    }
    convertErrorToDecorationOptions(error) {
        let decorations = [];
        if (utilities_1.default.isEmpty(error))
            return [];
        const flattenedErrors = utilities_1.default.flattenNestedObjectWithMultipleKeys(error, ["__context__", "__cause__"]);
        flattenedErrors.forEach(error => {
            error.stack["py/seq"].forEach(frame => {
                decorations.push(this.convertFrameToDecorationOption(frame));
            });
        });
        return decorations;
    }
}
exports.default = PythonInlinePreview;
//# sourceMappingURL=pythonInlinePreview.js.map