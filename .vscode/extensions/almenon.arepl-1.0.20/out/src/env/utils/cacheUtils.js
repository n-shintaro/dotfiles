// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require("../../common/extensions");
const resourceSpecificCacheStores = new Map();
/**
 * Get a cache key specific to a resource (i.e. workspace)
 * This key will be used to cache interpreter related data, hence the Python Path
 *  used in a workspace will affect the cache key.
 * @param {String} keyPrefix
 * @param {Resource} resource
 * @param {VSCodeType} [vscode=require('vscode')]
 * @returns
 */
function getCacheKey(resource, vscode = require('vscode')) {
    const section = vscode.workspace.getConfiguration('python', vscode.Uri.file(__filename));
    if (!section) {
        return 'python';
    }
    const globalPythonPath = section.inspect('pythonPath').globalValue || 'python';
    // Get the workspace related to this resource.
    if (!resource || !Array.isArray(vscode.workspace.workspaceFolders) || vscode.workspace.workspaceFolders.length === 0) {
        return globalPythonPath;
    }
    const folder = resource ? vscode.workspace.getWorkspaceFolder(resource) : vscode.workspace.workspaceFolders[0];
    if (!folder) {
        return globalPythonPath;
    }
    const workspacePythonPath = vscode.workspace.getConfiguration('python', resource).get('pythonPath') || 'python';
    return `${folder.uri.fsPath}-${workspacePythonPath}`;
}
/**
 * Gets the cache store for a resource that's specific to the interpreter.
 * @param {string} keyPrefix
 * @param {Resource} resource
 * @param {VSCodeType} [vscode=require('vscode')]
 * @returns
 */
function getCacheStore(resource, vscode = require('vscode')) {
    const key = getCacheKey(resource, vscode);
    if (!resourceSpecificCacheStores.has(key)) {
        resourceSpecificCacheStores.set(key, new Map());
    }
    return resourceSpecificCacheStores.get(key);
}
function getCacheKeyFromFunctionArgs(keyPrefix, fnArgs) {
    const argsKey = fnArgs.map(arg => `${JSON.stringify(arg)}`).join('-Arg-Separator-');
    return `KeyPrefix=${keyPrefix}-Args=${argsKey}`;
}
function clearCache() {
    resourceSpecificCacheStores.clear();
}
exports.clearCache = clearCache;
class InMemoryInterpreterSpecificCache {
    constructor(keyPrefix, expiryDurationMs, args, vscode = require('vscode')) {
        this.keyPrefix = keyPrefix;
        this.expiryDurationMs = expiryDurationMs;
        this.vscode = vscode;
        this.resource = args[0];
        this.args = args.slice(1);
    }
    get hasData() {
        const store = getCacheStore(this.resource, this.vscode);
        const key = getCacheKeyFromFunctionArgs(this.keyPrefix, this.args);
        const data = store.get(key);
        if (!store.has(key) || !data) {
            return false;
        }
        if (this.hasExpired(data.expiry)) {
            store.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Returns undefined if there is no data.
     * Uses `hasData` to determine whether any cached data exists.
     *
     * @type {(T | undefined)}
     * @memberof InMemoryInterpreterSpecificCache
     */
    get data() {
        if (!this.hasData) {
            return;
        }
        const store = getCacheStore(this.resource, this.vscode);
        const key = getCacheKeyFromFunctionArgs(this.keyPrefix, this.args);
        const data = store.get(key);
        if (!store.has(key) || !data) {
            return;
        }
        return data.value;
    }
    set data(value) {
        const store = getCacheStore(this.resource, this.vscode);
        const key = getCacheKeyFromFunctionArgs(this.keyPrefix, this.args);
        store.set(key, {
            expiry: this.calculateExpiry(),
            value
        });
    }
    clear() {
        const store = getCacheStore(this.resource, this.vscode);
        const key = getCacheKeyFromFunctionArgs(this.keyPrefix, this.args);
        store.delete(key);
    }
    /**
     * Has this data expired?
     * (protected class member to allow for reliable non-data-time-based testing)
     *
     * @param expiry The date to be tested for expiry.
     * @returns true if the data expired, false otherwise.
     */
    hasExpired(expiry) {
        return expiry < Date.now();
    }
    /**
     * When should this data item expire?
     * (protected class method to allow for reliable non-data-time-based testing)
     *
     * @returns number representing the expiry time for this item.
     */
    calculateExpiry() {
        return Date.now() + this.expiryDurationMs;
    }
}
exports.InMemoryInterpreterSpecificCache = InMemoryInterpreterSpecificCache;
//# sourceMappingURL=cacheUtils.js.map