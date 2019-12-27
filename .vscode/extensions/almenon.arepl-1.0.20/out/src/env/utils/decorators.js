"use strict";
// tslint:disable:no-any no-require-imports no-function-expression no-invalid-this
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../../common/extensions");
const cacheUtils_1 = require("./cacheUtils");
function clearCachedResourceSpecificIngterpreterData(key, resource, vscode = require('vscode')) {
    const cache = new cacheUtils_1.InMemoryInterpreterSpecificCache(key, 0, [resource], vscode);
    cache.clear();
}
exports.clearCachedResourceSpecificIngterpreterData = clearCachedResourceSpecificIngterpreterData;
function cacheResourceSpecificInterpreterData(key, expiryDurationMs, vscode = require('vscode')) {
    return function (_target, _propertyName, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                const cache = new cacheUtils_1.InMemoryInterpreterSpecificCache(key, expiryDurationMs, args, vscode);
                if (cache.hasData) {
                    console.debug(`Cached data exists ${key}, ${args[0] ? args[0].fsPath : '<No Resource>'}`);
                    return Promise.resolve(cache.data);
                }
                const promise = originalMethod.apply(this, args);
                promise.then(result => cache.data = result).catch(() => { });
                return promise;
            });
        };
    };
}
exports.cacheResourceSpecificInterpreterData = cacheResourceSpecificInterpreterData;
//# sourceMappingURL=decorators.js.map