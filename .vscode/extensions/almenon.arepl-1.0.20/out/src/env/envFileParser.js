"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// see https://github.com/Microsoft/vscode-python/blob/master/src/client/common/envFileParser.ts
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./platform/constants");
const pathUtils_1 = require("./platform/pathUtils");
const environment_1 = require("./variables/environment");
const fs_1 = require("fs");
function parseEnvironmentVariables(contents) {
    if (typeof contents !== 'string' || contents.length === 0) {
        return undefined;
    }
    const env = {};
    contents.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
        if (match !== null) {
            let value = typeof match[2] === 'string' ? match[2] : '';
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                value = value.replace(/\\n/gm, '\n');
            }
            env[match[1]] = value.replace(/(^['"]|['"]$)/g, '');
        }
    });
    return env;
}
function parseEnvFile(envFile, mergeWithProcessEnvVars = true) {
    const buffer = fs_1.readFileSync(envFile, 'utf8');
    const env = parseEnvironmentVariables(buffer);
    return mergeWithProcessEnvVars ? mergeEnvVariables(env, process.env) : mergePythonPath(env, process.env.PYTHONPATH);
}
exports.parseEnvFile = parseEnvFile;
/**
 * Merge the target environment variables into the source.
 * Note: The source variables are modified and returned (i.e. it modifies value passed in).
 * @export
 * @param {EnvironmentVariables} targetEnvVars target environment variables.
 * @param {EnvironmentVariables} [sourceEnvVars=process.env] source environment variables (defaults to current process variables).
 * @returns {EnvironmentVariables}
 */
function mergeEnvVariables(targetEnvVars, sourceEnvVars = process.env) {
    const service = new environment_1.EnvironmentVariablesService(new pathUtils_1.PathUtils(constants_1.IS_WINDOWS));
    service.mergeVariables(sourceEnvVars, targetEnvVars);
    if (sourceEnvVars.PYTHONPATH) {
        service.appendPythonPath(targetEnvVars, sourceEnvVars.PYTHONPATH);
    }
    return targetEnvVars;
}
exports.mergeEnvVariables = mergeEnvVariables;
/**
 * Merge the target PYTHONPATH value into the env variables passed.
 * Note: The env variables passed in are modified and returned (i.e. it modifies value passed in).
 * @export
 * @param {EnvironmentVariables} env target environment variables.
 * @param {string | undefined} [currentPythonPath] PYTHONPATH value.
 * @returns {EnvironmentVariables}
 */
function mergePythonPath(env, currentPythonPath) {
    if (typeof currentPythonPath !== 'string' || currentPythonPath.length === 0) {
        return env;
    }
    const service = new environment_1.EnvironmentVariablesService(new pathUtils_1.PathUtils(constants_1.IS_WINDOWS));
    service.appendPythonPath(env, currentPythonPath);
    return env;
}
exports.mergePythonPath = mergePythonPath;
//# sourceMappingURL=envFileParser.js.map