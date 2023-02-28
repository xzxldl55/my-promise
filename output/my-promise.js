"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MyPromise_instances, _MyPromise_clearCallbacks;
Object.defineProperty(exports, "__esModule", { value: true });
var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus["PENDING"] = "pending";
    PromiseStatus["FULFILLED"] = "fulfilled";
    PromiseStatus["REJECTED"] = "rejected";
})(PromiseStatus || (PromiseStatus = {}));
function nextTick(callback) {
    return () => setTimeout(() => callback && callback());
}
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        throw new TypeError('Chaining cycle detected for promise');
    }
    if (x instanceof MyPromise) {
        x.then((xValue) => resolvePromise(promise2, xValue, resolve, reject), reject);
        return;
    }
    if (x !== null &&
        (typeof x === 'object' || typeof x === 'function')) {
        let then;
        try {
            then = x.then;
        }
        catch (e) {
            return reject(e);
        }
        if (typeof then !== 'function') {
            resolve(x);
        }
        else {
            let called = false;
            try {
                then.call(x, (xValue) => {
                    if (called) {
                        return;
                    }
                    called = true;
                    resolvePromise(promise2, xValue, resolve, reject);
                }, (xReason) => {
                    if (called) {
                        return;
                    }
                    called = true;
                    reject(xReason);
                });
            }
            catch (e) {
                if (called) {
                    return;
                }
                called = true;
                reject(e);
            }
        }
        return;
    }
    resolve(x);
}
class MyPromise {
    constructor(executor) {
        _MyPromise_instances.add(this);
        this.PromiseState = PromiseStatus.PENDING;
        this.PromiseResult = null;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];
        try {
            executor(this.resolve.bind(this), this.reject.bind(this));
        }
        catch (err) {
            this.reject(err);
        }
    }
    resolve(value) {
        if (this.PromiseState === PromiseStatus.PENDING) {
            this.PromiseState = PromiseStatus.FULFILLED;
            this.PromiseResult = value;
            this.onFulfilledCallbacks.forEach((fn) => fn && fn(value));
            __classPrivateFieldGet(this, _MyPromise_instances, "m", _MyPromise_clearCallbacks).call(this);
        }
    }
    reject(reason) {
        if (this.PromiseState === PromiseStatus.PENDING) {
            this.PromiseState = PromiseStatus.REJECTED;
            this.PromiseResult = reason;
            this.onRejectedCallbacks.forEach((fn) => fn && fn(reason));
            __classPrivateFieldGet(this, _MyPromise_instances, "m", _MyPromise_clearCallbacks).call(this);
        }
    }
    then(onFulfilled, onRejected) {
        const newPromise = new MyPromise((resolve, reject) => {
            const execOnFulfilled = () => {
                try {
                    if (typeof onFulfilled !== 'function') {
                        resolve(this.PromiseResult);
                    }
                    else {
                        const x = onFulfilled(this.PromiseResult);
                        resolvePromise(newPromise, x, resolve, reject);
                    }
                }
                catch (e) {
                    reject(e);
                }
            };
            const execOnRejected = () => {
                try {
                    if (typeof onRejected !== 'function') {
                        reject(this.PromiseResult);
                    }
                    else {
                        const x = onRejected(this.PromiseResult);
                        resolvePromise(newPromise, x, resolve, reject);
                    }
                }
                catch (e) {
                    reject(e);
                }
            };
            if (this.PromiseState === PromiseStatus.PENDING) {
                this.onFulfilledCallbacks.push(nextTick(execOnFulfilled));
                this.onRejectedCallbacks.push(nextTick(execOnRejected));
            }
            else if (this.PromiseState === PromiseStatus.FULFILLED) {
                nextTick(execOnFulfilled)();
            }
            else {
                nextTick(execOnRejected)();
            }
        });
        return newPromise;
    }
    catch(onRejected) {
        return this.then(undefined, onRejected);
    }
    static resolve(value) {
        return new MyPromise((resolve) => {
            resolve(value);
        });
    }
    static reject(reason) {
        return new MyPromise((_resolve, reject) => {
            reject(reason);
        });
    }
    static all() { }
    static race() { }
    static allSettled() { }
    static deferred() {
        let result = {};
        result.promise = new MyPromise((resolve, reject) => {
            result.resolve = resolve;
            result.reject = reject;
        });
        return result;
    }
}
_MyPromise_instances = new WeakSet(), _MyPromise_clearCallbacks = function _MyPromise_clearCallbacks() {
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];
};
const d = MyPromise.deferred();
console.log(d);
exports.default = MyPromise;
MyPromise.resolve().then(() => {
    console.log(0);
    return MyPromise.resolve(4);
}).then((res) => {
    console.log(res);
});
MyPromise.resolve().then(() => {
    console.log(1);
}).then(() => {
    console.log(2);
}).then(() => {
    console.log(3);
}).then(() => {
    console.log(5);
}).then(() => {
    console.log(6);
});
