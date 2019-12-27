"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const resultsPanel_1 = require("./resultsPanel");
const settings_1 = require("./settings");
const resultsInline_1 = require("./resultsInline");
/**
 * logic wrapper around html preview doc
 */
class ResultsHandler {
    constructor(reporter, context, htmlUpdateFrequency = 50, resultsPanel) {
        this.reporter = reporter;
        this.resultsPanel = resultsPanel;
        if (!this.resultsPanel)
            this.resultsPanel = new resultsPanel_1.default(context, htmlUpdateFrequency);
        this.resultsInline = new resultsInline_1.ResultsInline(reporter, context);
        this.errorDecorationType = this.resultsInline.errorDecorationType;
    }
    start() {
        this.clearStoredData();
        return this.resultsPanel.start();
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
                this.resultsPanel.updateTime(pythonResults.execTime);
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
                this.resultsPanel.updateVars(this.vars);
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
                this.resultsPanel.clearPrint();
            this.updateError(pythonResults.userErrorMsg);
            if (settings_1.settings().get('inlineResults')) {
                this.resultsInline.updateErrorGutterIcons(pythonResults.userErrorMsg);
            }
            this.resultsPanel.injectCustomCSS(settings_1.settings().get('customCSS'));
            this.resultsPanel.throttledUpdate();
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
        this.resultsPanel.handlePrint(this.printResults.join('\n'));
    }
    /**
     * @param refresh if true updates page immediately.  otherwise error will show up whenever updateContent is called
     */
    updateError(err, refresh = false) {
        this.resultsPanel.updateError(err, refresh);
    }
    displayProcessError(err) {
        this.resultsPanel.displayProcessError(err);
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
        return this.resultsPanel.onDidChange;
    }
}
exports.ResultsHandler = ResultsHandler;
//# sourceMappingURL=resultsHandler.js.map