"use strict";
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
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
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
            this.clearCallbacks();
        }
    }
    reject(reason) {
        if (this.PromiseState === PromiseStatus.PENDING) {
            this.PromiseState = PromiseStatus.REJECTED;
            this.PromiseResult = reason;
            this.onRejectedCallbacks.forEach((fn) => fn && fn(reason));
            this.clearCallbacks();
        }
    }
    clearCallbacks() {
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];
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
    finally(callback) {
        return this.then((value) => MyPromise.resolve(callback()).then(() => value), (reason) => MyPromise.resolve(callback()).then(() => {
            throw reason;
        }));
    }
    static resolve(value) {
        if (value instanceof MyPromise) {
            return value;
        }
        else if (value !== null &&
            typeof value === 'object' &&
            'then' in value) {
            return new MyPromise((resolve, reject) => value.then(resolve, reject));
        }
        return new MyPromise((resolve) => resolve(value));
    }
    static reject(reason) {
        return new MyPromise((_resolve, reject) => reject(reason));
    }
    static all(iterator) {
        return new MyPromise((resolve, reject) => {
            if (typeof iterator[Symbol.iterator] !== 'function') {
                return reject(new TypeError('argument is not iterable'));
            }
            const iteratorArr = Array.from(iterator);
            const result = [];
            let count = 0;
            const length = iteratorArr.length;
            if (!length) {
                return resolve(result);
            }
            iteratorArr.forEach((promise, index) => {
                MyPromise.resolve(promise).then((value) => {
                    count++;
                    result[index] = value;
                    count === length && resolve(result);
                }, (reason) => {
                    reject(reason);
                });
            });
        });
    }
    static race(iterator) {
        return new MyPromise((resolve, reject) => {
            if (typeof iterator[Symbol.iterator] !== 'function') {
                return reject(new TypeError('argument is not iterable'));
            }
            const iteratorArr = Array.from(iterator);
            if (!iteratorArr.length) {
                return resolve(null);
            }
            iteratorArr.forEach((promise) => MyPromise.resolve(promise).then(resolve, reject));
        });
    }
    static allSettled(iterator) {
        return new MyPromise((resolve, reject) => {
            if (typeof iterator[Symbol.iterator] !== 'function') {
                return reject(new TypeError('argument is not iterable'));
            }
            let count = 0;
            const iteratorArr = Array.from(iterator);
            const result = [];
            if (!iteratorArr.length) {
                return resolve(result);
            }
            function handleAllSettledPromise(index, key, value) {
                count++;
                result[index] = {
                    status: key === 'reason'
                        ? PromiseStatus.REJECTED
                        : PromiseStatus.FULFILLED,
                    [key]: value,
                };
                count === iteratorArr.length && resolve(result);
            }
            iteratorArr.forEach((promise, index) => {
                MyPromise.resolve(promise).then(handleAllSettledPromise.bind(null, index, 'value'), handleAllSettledPromise.bind(null, index, 'reason'));
            });
        });
    }
    static deferred() {
        let result = {};
        result.promise = new MyPromise((resolve, reject) => {
            result.resolve = resolve;
            result.reject = reject;
        });
        return result;
    }
}
exports.default = MyPromise;
module.exports = MyPromise;
