"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const my_promise_1 = __importDefault(require("./my-promise"));
const m = new Map();
m.set(1, new my_promise_1.default((res) => setTimeout(() => res(1))));
m.set(2, 2);
m.set(3, new my_promise_1.default((res, rej) => rej(3)));
const a = [
    new my_promise_1.default((res, rej) => res(1)),
    new my_promise_1.default((res) => res(2)),
    new my_promise_1.default((res) => res(3)),
];
