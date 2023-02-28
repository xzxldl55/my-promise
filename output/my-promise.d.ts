declare enum PromiseStatus {
    PENDING = "pending",
    FULFILLED = "fulfilled",
    REJECTED = "rejected"
}
declare class MyPromise<T> {
    #private;
    PromiseState: PromiseStatus;
    PromiseResult?: T;
    onFulfilledCallbacks: (((value: any) => any) | undefined | null)[];
    onRejectedCallbacks: (((reason: any) => any) | undefined | null)[];
    constructor(executor: (resolve: (value?: T) => void, reject: (reason?: any) => void) => void);
    resolve(value?: T): void;
    reject(reason?: any): void;
    then<TResult = T, TReason = never>(onFulfilled?: ((value?: T) => TResult) | undefined | null, onRejected?: ((reason?: any) => TReason) | undefined | null): MyPromise<TResult | TReason>;
    catch<TReason = never>(onRejected?: ((reason?: any) => TReason) | undefined | null): MyPromise<TReason>;
    static resolve<TResult>(value?: TResult): MyPromise<TResult>;
    static reject<TReason>(reason?: TReason): MyPromise<TReason>;
    static all(): void;
    static race(): void;
    static allSettled(): void;
    static deferred(): {
        promise?: MyPromise<any> | undefined;
        resolve?: any;
        reject?: any;
    };
}
export default MyPromise;
