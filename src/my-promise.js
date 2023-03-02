"use strict";
/**
 * Promise 遵循原则：
 *
 * from: https://juejin.cn/post/7043758954496655397#heading-17
 *
 * 我们都知道 Js 是单线程都，但是一些高耗时操作就带来了进程阻塞问题。为了解决这个问题，Js 有两种任务的执行模式：同步模式（Synchronous）和异步模式（Asynchronous）。
 * 在异步模式下，创建异步任务主要分为宏任务与微任务两种。ES6 规范中，宏任务（Macrotask） 称为 Task， 微任务（Microtask） 称为 Jobs。
 * 宏任务是由宿主（浏览器、Node）发起的，而微任务由 JS 自身发起。
 *
 * 1. Promise对象代表着一个异步操作，它必然处于以下三种状态：
 *      - pending 等待
 *      - fulfilled 已完成 --> 执行 resolve()
 *      - rejected 已拒绝 --> 执行reject() / 抛出错误
 *    当Promise处于 fulfilled / rejected 后，将无法变更状态
 *
 * 2. Promise状态运转流程: 当 promise 被调用后，它会以处理中状态 (pending) 开始, 最终会以被解决状态 (fulfilled) 或 被拒绝状态 (rejected) 结束，并在完成时调用相应的回调函数（传给 then 和 catch）。
 *
 * 3. Promise.then回调执行时机: 在本轮 事件循环 运行完成之前，Promise.then 的回调函数是不会被调用的 --> PS: 需要注意的是 Promise 本身内部接受的函数参数 (resolve: Promise.resolve, reject: Promise.reject) => void; 是同步进行的
 *
 * 4. thenable对象: 指的是具有then方法的对象，Promise的一些静态方法会自动像解析Promise一样对其进行解析运行
 *
 * 5. Promise.resolve(T): 将会返回一个 Promise 对象，其中 参数 T 有以下几种情况
 *      1) T = Promise实例: 则原封不动返回这个 Promise 实例
 *      2）T = thenable对象: Promise.resolve方法会将这个对象转为 Promise 对象，然后就立即执行thenable对象的then方法
 *      3) T = 不是具有then方法的对象，或根本就不是对象(基础数据类型 + 没有then方法的对象): 返回一个新的 Promise 对象，状态为resolved，将参数 T 传递到下一个then
 *      4) T = 空，不传参数: 直接返回一个resolved状态的 Promise 对象
 *
 * 6. Promise.reject(T): 将返回一个新的 Promise 实例，该实例的状态为rejected
 *      1) 其中参数T，将会原封不动的作为 reject 理由返回，这一点与Promise.resolve不同 ==>
 *          eg: Promise.reject({ then: (resolve, reject) => reject(123) })
 *                  .catch(rejectReason => console.log(rejectReason)); // { then: (resolve, reject) => reject(123) } 而不是 123
 *
 * 7. Promise.prototype.then(T): 它的作用是为 Promise 实例添加状态改变时的回调函数
 *      1) then方法的第一个参数是resolved状态的回调函数。如果该参数不是函数，则会在内部被替换为 (x) => x，即原样返回 promise 最终结果的函数；
 *      2) 第二个参数（可选）是rejected状态的回调函数。如果该参数不是函数，则会在内部被替换为一个 "Thrower" 函数 (it throws an error it received as argument)。
 *      3) then方法返回的是一个新的Promise实例（注意，不是原来那个Promise实例）。因此可以采用链式写法，即then方法后面再调用另一个then方法。
 *        - 1. 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
 *        - 2. 如果 onFulfilled 不是函数且 promise1 成功执行， promise2 必须成功执行并返回相同的值
 *        - 3. 如果 onRejected 不是函数且 promise1 拒绝执行， promise2 必须拒绝执行并返回相同的据因
 *        - 4. 如果 onFulfilled 或者 onRejected 返回一个值 x ，则运行下面的 Promise 解决过程：[[Resolve]](promise2, x)
 *          - 如果x与promise(promise2)指向同一个对象，返回TypeError，拒绝执行（防止循环引用）
 *          - 如果x是一个Promise实例，则令promise2接收x的状态（解开x.then返回值，将其递归返回 ==> 类似 resolvePromise(promise2, await promise2, resolve, reject)）
 *          - 如果x为对象/函数，将其当作thenable执行，与上同
 *          - 如果x不为对象/函数，直接resolve/reject返回x
 *
 * 8. Promise.prototype.catch(): catch() 方法返回一个Promise，并且处理拒绝的情况。
 *      1) 它的行为与调用Promise.prototype.then(undefined, onRejected) 相同，可以将其视作这种形式的语法糖
 *      2) 如果 Promise 状态已经变成resolved，再抛出错误是无效的。`new Promise((s, j) => { s(123); j(456) })` ==> j(456) 是无效的，不会被错误捕获
 *      3) Promise 对象的错误具有“冒泡”性质，会一直向后传递，直到被捕获为止。也就是说，错误总是会被下一个catch语句捕获。所以通常，一串Promise链条只需要在最末尾有一个 catch 处理错误即可。
 *      4) 当一个Promise链，没有错误处理时，将会将错误抛出到顶层 `Unhandled Promise Rejection Warning.`
 *
 * 9. 链式调用: Promise.prototype.then/catch 始终会返回一个新的Promise实例对象，这使得我们可以链式调用（一定程度缓解了原来异步回调地狱的问题） Promise.resolve().then(...).then(...).then(...)...
 *
 * 10. Promise.prototype.finally(): 与 try/catch/finally 中的 finally 一个道理，finally 无论结果是 fulfilled 还是 rejected 都会被执行。
 *      1) 由于无法知道promise的最终状态，所以finally的回调函数中不接收任何参数，它仅用于无论最终结果如何都要执行的情况。
 *      2) 如果 finally 处理函数显式返回一个 pedding 状态的 Promise，那么其返回值也是 Primise<pending>
 *      3) 如果 finally 处理函数显式返回一个 rejected 状态的 Promise 或者执行过程中 throw Error，那么返回值也是 Promise<reject>
 *      4) 除上述两种情况外，finally的返回值将会延续上一个Promise的状态，从而无视自身的return返回（正常数据 + Promise.resolve 都会被忽略）
 *
 * 11. Promise.all(PromiseInstance[]): 并发Promise函数
 *      1) 同时并发多个Promise，并在所有的Promise实例都 fulfilled 后，调用其thenable
 *      2) 当某个并发的Promise，状态为 reject 时，将终止 Promise.all，并将控制权转交后续的 catch 处理
 *      3) 后续 thenable 接收参数为 Promise.all() 中每个 Promise 结果的数组，按照原顺序排序
 *
 * 12. Promise.race(PromiseInstance[]): 竞态Promise函数
 *      1) 同时竞态执行多个Promise，只要其中一个 Promise 状态变为完成(fulfilled / rejected)，将结束运行
 *      2) 一般用作异步操作超时处理
 *
 * 13. Promise.allSettled(): 并发Promise，但与Promise.all不同的是，rejected状态也不会直接结束
 *      1) 同时并发多个Promise，并在所有的Promise实例都 fulfilled 或 rejected 后，调用其thenable
 *      2) 与Promise.all不同的是，其返回值，将被固定数据结构包装一层 `{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }[]` fulfilled 状态 value 有值，rejected 下 reason 有值。
 */
exports.__esModule = true;
var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus["PENDING"] = "pending";
    PromiseStatus["FULFILLED"] = "fulfilled";
    PromiseStatus["REJECTED"] = "rejected";
})(PromiseStatus || (PromiseStatus = {}));
// 返回callback的异步执行函数版本
function nextTick(callback) {
    return function () { return setTimeout(function () { return callback && callback(); }); };
}
/**
 * resolve()、reject() 进行改造增强 针对resolve()和reject()中不同值情况 进行处理(参考Promise/A+规范 [[Resolve]](promise2, x) 解决过程)
 * 正常处理流程即用resolve返回（onRejected的返回值按照规范也会作为fulfilledValue，故也用resolve返回）
 * @param {MyPromise<T>} promise2 promise1.then方法返回的新的promise对象
 * @param {O} x promise1中onFulfilled或onRejected的返回值
 * @param {(value: any) => any} resolve promise2的resolve方法
 * @param {(value: any) => any} reject promise2的reject方法
 */
function resolvePromise(promise2, x, resolve, reject) {
    // 在onFulfilled中返回自身的情况，将造成循环引用
    if (promise2 === x) {
        throw new TypeError('Chaining cycle detected for promise');
    }
    // x 为 promise 对象的情况
    if (x instanceof MyPromise) {
        x.then(function (xValue) { return resolvePromise(promise2, xValue, resolve, reject); }, reject);
        return;
    }
    // x为对象/函数，将其当作thenable尝试执行
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        var then = void 0;
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
            // then为函数，执行，将其当作then执行
            // 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
            var called_1 = false;
            try {
                then.call(x, function (xValue) {
                    if (called_1) {
                        return;
                    }
                    called_1 = true;
                    resolvePromise(promise2, xValue, resolve, reject); // 递归，确保thenValue符合规则
                }, function (xReason) {
                    if (called_1) {
                        return;
                    }
                    called_1 = true;
                    reject(xReason); // 拒绝情况，可直接返回
                });
            }
            catch (e) {
                if (called_1) {
                    return;
                }
                called_1 = true;
                reject(e);
            }
        }
        return;
    }
    // 其他x非对象/函数情况
    resolve(x);
}
var MyPromise = /** @class */ (function () {
    function MyPromise(executor) {
        // 初始化Promise实例
        this.PromiseState = PromiseStatus.PENDING;
        this.PromiseResult = null;
        this.onFulfilledCallbacks = []; // 成功回调保存: then执行时为pending状态，先将回调保存，等待resolve执行后再取出执行 | 用数组缓存，也同时实现了一个Promise能被多次then
        this.onRejectedCallbacks = []; // 失败回调保存: ~
        // 执行Promise回调（PS:这里用bind绑定实例的this环境，因为二者要作为参数传递到外部【executor】函数作用域环境中调用，会丢失class实例的this）
        try {
            executor(this.resolve.bind(this), this.reject.bind(this));
        }
        catch (err) {
            // executor执行抛出的错误，自动当作reject处理
            this.reject(err);
        }
    }
    MyPromise.prototype.resolve = function (value) {
        // resolve后，将pending状态改为fulfilled（PS:这里存在判断而非直接修改，遵循上面原则 1. 当状态非 pending 后，将无法在修改状态）
        if (this.PromiseState === PromiseStatus.PENDING) {
            this.PromiseState = PromiseStatus.FULFILLED;
            this.PromiseResult = value;
            this.onFulfilledCallbacks.forEach(function (fn) { return fn && fn(value); }); // 执行已订阅的resolve回调
            this.clearCallbacks();
        }
    };
    MyPromise.prototype.reject = function (reason) {
        if (this.PromiseState === PromiseStatus.PENDING) {
            this.PromiseState = PromiseStatus.REJECTED;
            this.PromiseResult = reason;
            this.onRejectedCallbacks.forEach(function (fn) { return fn && fn(reason); });
            this.clearCallbacks();
        }
    };
    // 清空回调缓存
    MyPromise.prototype.clearCallbacks = function () {
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];
    };
    /**
     * then方法链：缓解了历史的回调地狱问题
     * 7.3 then需要返回一个新的Promise, 其执行过程 [[Resolve]](promise2, x)
     * 7.3.1/2/3. 如果onFulfilled/onRejected执行过程抛出异常e，则promise2必须拒绝执行(reject)，返回拒绝原因
     * 7.3.4. 规定了onFulfilled/onRejected返回值x不同情况下的不同处理逻辑
     * @param onFulfilled
     * @param onRejected
     * @returns
     */
    MyPromise.prototype.then = function (onFulfilled, onRejected) {
        var _this = this;
        var newPromise = new MyPromise(function (resolve, reject) {
            var execOnFulfilled = function () {
                try {
                    if (typeof onFulfilled !== 'function') {
                        resolve(_this.PromiseResult);
                    }
                    else {
                        var x = onFulfilled(_this.PromiseResult);
                        resolvePromise(newPromise, x, resolve, reject);
                    }
                }
                catch (e) {
                    reject(e);
                }
            };
            var execOnRejected = function () {
                try {
                    if (typeof onRejected !== 'function') {
                        reject(_this.PromiseResult);
                    }
                    else {
                        var x = onRejected(_this.PromiseResult);
                        // 这里onRejected的返回值依旧放入resolvePromise，因为规范上来说，onRejected的返回值 (非Promise.reject/error/执行错误情况) 会作为promise2的 fulfilledValue
                        // 故此 (new Promise((s, r) => r('123'))).then(null, r => r).then(res => 'get:' + res) ==> 'get:123'
                        resolvePromise(newPromise, x, resolve, reject);
                    }
                }
                catch (e) {
                    reject(e);
                }
            };
            // 调用时，pending：回调保存起来，直到resolve/reject触发 --> 确保异步的时序
            if (_this.PromiseState === PromiseStatus.PENDING) {
                _this.onFulfilledCallbacks.push(nextTick(execOnFulfilled));
                _this.onRejectedCallbacks.push(nextTick(execOnRejected));
            }
            else if (_this.PromiseState === PromiseStatus.FULFILLED) {
                nextTick(execOnFulfilled)();
            }
            else {
                nextTick(execOnRejected)();
            }
        });
        return newPromise;
    };
    MyPromise.prototype["catch"] = function (onRejected) {
        return this.then(undefined, onRejected);
    };
    // 类似tryCatchFinally中的finally，无论上游promise是fulfilled/rejected都将执行
    MyPromise.prototype["finally"] = function (callback) {
        return this.then(
        // 接收上一步Promise操作的返回值数据，执行finallyCallback后，返回值为上一步的数据（注：这里将callback函数执行结果作为Promise化，就是为了处理callback返回pending的情况）
        //     只针对onFulfilled情况做了处理，reject情况则根据finallyCallback执行来，不依据上一步操作
        function (value) { return MyPromise.resolve(callback()).then(function () { return value; }); }, 
        // 针对上一步的错误情况，原样返回
        function (reason) {
            return MyPromise.resolve(callback()).then(function () {
                throw reason;
            });
        });
    };
    /**
     * 直接返回一个fulfilled状态的promise
     * @param {TResult | MyPromise<TResult>} value
     * @returns
     */
    MyPromise.resolve = function (value) {
        // 如果value就是一个Promise，则直接返回该promise即可
        if (value instanceof MyPromise) {
            return value;
        }
        else if (value !== null &&
            typeof value === 'object' &&
            'then' in value) {
            // 如果是一个thenable则将其作为Promise解析
            return new MyPromise(function (resolve, reject) {
                return value.then(resolve, reject);
            });
        }
        return new MyPromise(function (resolve) { return resolve(value); });
    };
    // 直接返回rejected状态的promise
    MyPromise.reject = function (reason) {
        return new MyPromise(function (_resolve, reject) { return reject(reason); });
    };
    /**
     * 并发
     * 当全部promise fulfilled / 某个promise rejected后结束
     * @param {Symbol.iterator} iterator 可迭代类型
     * @returns {MyPromise<Awaited<T>[]>}
     */
    MyPromise.all = function (iterator) {
        return new MyPromise(function (resolve, reject) {
            if (typeof iterator[Symbol.iterator] !== 'function') {
                return reject(new TypeError('argument is not iterable'));
            }
            var iteratorArr = Array.from(iterator);
            var result = [];
            var count = 0;
            var length = iteratorArr.length;
            // 如果传入的是一个空迭代对象，则直接返回完成状态
            if (!length) {
                return resolve(result);
            }
            iteratorArr.forEach(function (promise, index) {
                MyPromise.resolve(promise).then(function (value) {
                    // 将结果按顺序保存下来
                    count++;
                    result[index] = value;
                    count === length && resolve(result);
                }, function (reason) {
                    // 一旦遇到reject，直接返回
                    reject(reason);
                });
            });
        });
    };
    /**
     * 竞发
     * 当某个promise变为fulfilled/rejected时结束
     */
    MyPromise.race = function (iterator) {
        return new MyPromise(function (resolve, reject) {
            if (typeof iterator[Symbol.iterator] !== 'function') {
                return reject(new TypeError('argument is not iterable'));
            }
            var iteratorArr = Array.from(iterator);
            // 如果传入的是一个空迭代对象，则直接返回完成状态
            if (!iteratorArr.length) {
                return resolve(null);
            }
            iteratorArr.forEach(function (promise) {
                return MyPromise.resolve(promise).then(resolve, reject);
            });
        });
    };
    MyPromise.allSettled = function (iterator) {
        return new MyPromise(function (resolve, reject) {
            if (typeof iterator[Symbol.iterator] !== 'function') {
                return reject(new TypeError('argument is not iterable'));
            }
            var count = 0;
            var iteratorArr = Array.from(iterator);
            var result = [];
            // 如果传入的是一个空迭代对象，则直接返回完成状态
            if (!iteratorArr.length) {
                return resolve(result);
            }
            function handleAllSettledPromise(index, key, value) {
                var _a;
                count++;
                result[index] = (_a = {
                        status: key === 'reason'
                            ? PromiseStatus.REJECTED
                            : PromiseStatus.FULFILLED
                    },
                    _a[key] = value,
                    _a);
                count === iteratorArr.length && resolve(result);
            }
            iteratorArr.forEach(function (promise, index) {
                MyPromise.resolve(promise).then(handleAllSettledPromise.bind(null, index, 'value'), handleAllSettledPromise.bind(null, index, 'reason'));
            });
        });
    };
    // promises-aplus-tests 测试使用
    MyPromise.deferred = function () {
        var result = {};
        result.promise = new MyPromise(function (resolve, reject) {
            result.resolve = resolve;
            result.reject = reject;
        });
        return result;
    };
    return MyPromise;
}());
exports["default"] = MyPromise;
