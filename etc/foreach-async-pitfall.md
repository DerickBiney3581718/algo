# Why `forEach` Doesn't Work with `async/await`

## The short answer

`forEach` was designed for synchronous callbacks. It calls each callback, collects no return value, and moves on. When you pass an `async` function, it returns a `Promise` — but `forEach` throws it away.

```ts
listeners.forEach(async (fn) => await fn(sequence[step]));
// forEach discards the Promise returned by each async callback
// execution continues before any of them resolve
```

## What forEach actually does internally

```ts
// simplified polyfill
Array.prototype.forEach = function(callback) {
  for (let i = 0; i < this.length; i++) {
    callback(this[i], i, this); // return value is ignored
  }
  // returns undefined — there's nothing to await
};
```

There is no `await` inside `forEach`. The async callback fires, suspends at its first `await`, returns a pending Promise — and `forEach` discards that Promise and moves to the next iteration immediately.

## Why `async (fn) => await fn(...)` doesn't help

Wrapping the call in another async function doesn't change anything. The outer async function still returns a Promise, and `forEach` still ignores it. The `await` inside only suspends the inner async function, not `forEach` itself.

```ts
// these are equivalent from forEach's perspective — both discard a Promise
listeners.forEach((fn) => fn(sequence[step]));
listeners.forEach(async (fn) => await fn(sequence[step]));
```

## The fix: `for...of` with `await`

`for...of` is a language construct, not a method. `await` inside it suspends the **enclosing async function**, so each iteration genuinely waits:

```ts
async function callback() {
  for (const fn of listeners) {
    await fn(sequence[step]); // suspends callback() until fn resolves
  }
}
```

## Other array methods with the same problem

| Method | Awaits async callback? |
|---|---|
| `forEach` | No |
| `map` | No — returns `Promise[]`, not `Promise<T[]>` |
| `filter` | No — filters on `Promise` (truthy), not resolved value |
| `reduce` | No — accumulator becomes a `Promise` |
| `find` / `findIndex` | No |
| `for...of` + `await` | Yes |
| `Promise.all(arr.map(...))` | Yes — parallel |

```ts
// map with async — returns an array of Promises, not resolved values
const results = arr.map(async (x) => await fetch(x)); // Promise<Response>[]

// correct: run in parallel and wait for all
const results = await Promise.all(arr.map(async (x) => await fetch(x)));

// correct: run sequentially
for (const x of arr) {
  await fetch(x);
}
```

## Resources

- [MDN — `Array.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
- [MDN — `for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
- [MDN — `Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [ES spec — forEach does not await](https://tc39.es/ecma262/#sec-array.prototype.foreach) — see step 6.c: `Call(callbackfn, T, « kValue, k, O »)` — return value unused
- [Jake Archibald — Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
