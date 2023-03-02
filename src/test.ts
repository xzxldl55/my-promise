import MyPromise from './my-promise';

const m = new Map<any, any>();
m.set(1, new MyPromise((res) => setTimeout(() => res(1))));
m.set(2, 2);
m.set(3, new MyPromise((res, rej) => rej(3)));

const a: MyPromise<number>[] = [
    new MyPromise((res, rej) => res(1)),
    new MyPromise((res) => res(2)),
    new MyPromise((res) => res(3)),
];