declare enum PromiseStatus {
    PENDING = "pending",
    FULFILLED = "fulfilled",
    REJECTED = "rejected"
}
declare class MyPromise<T> {
    PromiseState: PromiseStatus;
    PromiseResult: T;
    onFulfilledCallbacks: (((value: any) => any) | undefined | null)[];
    onRejectedCallbacks: (((reason: any) => any) | undefined | null)[];
    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason: any) => void) => void);
    resolve(value: T | PromiseLike<T>): void;
    reject(reason: any): void;
    clearCallbacks(): void;
    then<TResult = T, TReason = never>(onFulfilled?: ((value: T) => TResult | PromiseLike<TResult>) | undefined | null, onRejected?: ((reason: any) => TReason | PromiseLike<TReason>) | undefined | null): MyPromise<TResult | TReason>;
    catch<TReason = never>(onRejected?: ((reason?: any) => TReason) | undefined | null): MyPromise<TReason>;
    finally(callback: () => any): MyPromise<any>;
    static resolve<TResult>(value?: TResult | MyPromise<TResult> | PromiseLike<TResult>): MyPromise<TResult>;
    static reject<TReason>(reason?: TReason): MyPromise<TReason>;
    static all<T>(iterator: Iterable<T | PromiseLike<T>> | Array<T | PromiseLike<T>>): MyPromise<Awaited<T[]>>;
    static race<T>(iterator: Iterable<T | PromiseLike<T>> | Array<T | PromiseLike<T>>): MyPromise<T>;
    static allSettled<T>(iterator: Iterable<T | PromiseLike<T>> | Array<T | PromiseLike<T>>): MyPromise<{
        status: PromiseStatus;
        value?: T | undefined;
        reason?: any;
    }[]>;
    static deferred(): {
        promise?: MyPromise<any> | undefined;
        resolve?: any;
        reject?: any;
    };
}
export default MyPromise;
