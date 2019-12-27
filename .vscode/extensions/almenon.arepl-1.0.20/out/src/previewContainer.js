"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const pythonInlinePreview_1 = require("./pythonInlinePreview");
const pythonPanelPreview_1 = require("./pythonPanelPreview");
const settings_1 = require("./settings");
/**
 * logic wrapper around html preview doc
 */
class PreviewContainer {
    constructor(reporter, context, htmlUpdateFrequency = 50, pythonPanelPreview) {
        this.reporter = reporter;
        this.pythonPanelPreview = pythonPanelPreview;
        if (!this.pythonPanelPreview)
            this.pythonPanelPreview = new pythonPanelPreview_1.default(context, htmlUpdateFrequency);
        this.pythonInlinePreview = new pythonInlinePreview_1.default(reporter, context);
        this.errorDecorationType = this.pythonInlinePreview.errorDecorationType;
    }
    start(linkedFileName) {
        this.clearStoredData();
        return this.pythonPanelPreview.start(linkedFileName);
    }
    /**
     * clears stored data (preview gui is unaffected)
     */
    clearStoredData() {
        this.vars = {};
        this.printResults = [];
    }
    handleResult(pythonResults) {
        console.debug(`Exec time: ${pythonResults.execTime}`);
        console.debug(`Python time: ${pythonResults.totalPyTime}`);
        console.debug(`Total time: ${pythonResults.totalTime}`);
        this.reporter.execTime += pythonResults.execTime;
        this.reporter.totalPyTime += pythonResults.totalPyTime;
        this.reporter.totalTime += pythonResults.totalTime;
        try {
            if (!pythonResults.done) {
                // user has dumped variables, add them to vars
                this.updateVarsWithDumpOutput(pythonResults);
            }
            else {
                // exec time is the 'truest' time that user cares about
                this.pythonPanelPreview.updateTime(pythonResults.execTime);
            }
            this.vars = Object.assign(Object.assign({}, this.vars), pythonResults.userVariables);
            if (!pythonResults.userErrorMsg) {
                pythonResults.userErrorMsg = "";
            }
            // syntax errors have msg attribute
            const syntaxError = pythonResults.userError && 'msg' in pythonResults.userError;
            // a result with a syntax error will not have any variables
            // So only update vars if there's not a syntax error
            // this is because it's annoying to user if they have a syntax error and all their variables dissapear
            if (!syntaxError) {
                this.pythonPanelPreview.updateVars(this.vars);
            }
            if (pythonResults.internalError) {
                // todo: change backend code to send error name
                // first word of last line is usually error name
                const lastLine = pythonResults.internalError.trimRight().split('\n');
                const firstWordOfLastLine = lastLine.pop().split(' ')[0].replace(':', '');
                const error = new Error(firstWordOfLastLine);
                error.stack = pythonResults.internalError;
                this.reporter.sendError(error, 0, 'python.internal');
                pythonResults.userErrorMsg = pythonResults.internalError;
            }
            if (this.printResults.length == 0)
                this.pythonPanelPreview.clearPrint();
            this.updateError(pythonResults.userErrorMsg);
            if (settings_1.settings().get('inlineResults')) {
                this.pythonInlinePreview.updateErrorGutterIcons(pythonResults.userErrorMsg);
            }
            this.pythonPanelPreview.injectCustomCSS(settings_1.settings().get('customCSS'));
            this.pythonPanelPreview.throttledUpdate();
            if (pythonResults.done)
                this.clearStoredData();
        }
        catch (error) {
            if (error instanceof Error || error instanceof String) {
                vscode.window.showErrorMessage("Internal AREPL Error: " + error.toString(), "Report bug").then((action) => {
                    if (action == "Report bug") {
                        const bugReportLink = vscode.Uri.parse("https://github.com/Almenon/AREPL-vscode/issues/new");
                        // enable below for vscode version 1.31.0 or higher
                        // vscode.env.openExternal(bugReportLink)
                        vscode.commands.executeCommand('vscode.open', bugReportLink);
                    }
                });
            }
            if (error instanceof Error) {
                this.reporter.sendError(error);
            }
            else {
                // in JS an error might NOT be an error???
                // god i hate JS error handling
                this.reporter.sendError(new Error(error));
            }
        }
    }
    handlePrint(pythonResults) {
        this.printResults.push(pythonResults);
        this.pythonPanelPreview.handlePrint(this.printResults.join('\n'));
    }
    /**
     * @param refresh if true updates page immediately.  otherwise error will show up whenever updateContent is called
     */
    updateError(err, refresh = false) {
        this.pythonPanelPreview.updateError(err, refresh);
    }
    displayProcessError(err) {
        this.pythonPanelPreview.displayProcessError(err);
    }
    /**
     * user may dump var(s), which we format into readable output for user
     * @param pythonResults result with either "dump output" key or caller and lineno
     */
    updateVarsWithDumpOutput(pythonResults) {
        const lineKey = "line " + pythonResults.lineno;
        if (pythonResults.userVariables["dump output"] != undefined) {
            const dumpOutput = pythonResults.userVariables["dump output"];
            pythonResults.userVariables = {};
            pythonResults.userVariables[lineKey] = dumpOutput;
        }
        else {
            const v = pythonResults.userVariables;
            pythonResults.userVariables = {};
            pythonResults.userVariables[pythonResults.caller + " vars " + lineKey] = v;
        }
    }
    get onDidChange() {
        return this.pythonPanelPreview.onDidChange;
    }
}
exports.PreviewContainer = PreviewContainer;
//# sourceMappingURL=previewContainer.js.map