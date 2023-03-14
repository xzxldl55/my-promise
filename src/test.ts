import MyPromise from './my-promise';

// const m = new Map<any, any>();
// m.set(1, new MyPromise((res) => setTimeout(() => res(1))));
// m.set(2, 2);
// m.set(3, new MyPromise((res, rej) => rej(3)));

// const a: MyPromise<number>[] = [
//     new MyPromise((res, rej) => res(1)),
//     new MyPromise((res) => res(2)),
//     new MyPromise((res) => res(3)),
// ];

MyPromise.resolve()
    .then(() => {
        console.log(0);
        return MyPromise.resolve(4); // 为什么滞后于 2，因为在内部处理 resolvePromise 中，会自动调用该 Promise.then 这里会多存在一层微任务
    })
    .then((res) => {
        console.log(res);
    });

MyPromise.resolve()
    .then(() => {
        console.log(1);
    })
    .then(() => {
        console.log(2);
    })
    .then(() => {
        console.log(3);
    })
    .then(() => {
        console.log(5);
    })
    .then(() => {
        console.log(6);
    });

// PromiseLike也遵循只改变一次原则
// MyPromise.resolve()
//     .then(() => {
//         return {
//             then(onFulfilled: (v: any) => void) {
//                 onFulfilled(1);
//                 onFulfilled(2);
//                 onFulfilled(3);
//             },
//         };
//     })
//     .then((res) => {
//         console.log(res, ' - b');
//     })
//     .then(() => {
//         console.log('c');
//     });
