# Node.js `assert` Module

Built-in Node.js module for writing tests and validating invariants without a third-party framework.

## Import

```js
// Strict mode (recommended)
import assert from "node:assert/strict";

// Legacy (loose equality in some methods — avoid)
import assert from "node:assert";
```

Prefer `node:assert/strict` — it uses `===` and structural equality everywhere, removing the footgun of `assert.equal` using `==`.

## Core Methods

| Method | What it checks |
|---|---|
| `assert(value)` | `value` is truthy |
| `assert.ok(value)` | same as above, explicit alias |
| `assert.strictEqual(a, b)` | `a === b` |
| `assert.notStrictEqual(a, b)` | `a !== b` |
| `assert.deepStrictEqual(a, b)` | deep structural equality (`===` at leaves) |
| `assert.notDeepStrictEqual(a, b)` | deep structural inequality |
| `assert.throws(fn, matcher?)` | `fn` throws; optionally matches error |
| `assert.doesNotThrow(fn)` | `fn` does not throw |
| `assert.rejects(asyncFn, matcher?)` | returned promise rejects |
| `assert.doesNotReject(asyncFn)` | returned promise resolves |
| `assert.fail(message?)` | always throws — marks unreachable branches |

## Common Patterns

### Primitive equality
```js
assert.strictEqual(list.size, 3);
assert.strictEqual(list.head.value, 1);
```

### Array / object equality
```js
assert.deepStrictEqual([...list], [1, 2, 5]);
assert.deepStrictEqual({ a: 1 }, { a: 1 }); // passes
```

### Error matching
```js
// Match by message string
assert.throws(() => new SortedLinkedList(7), {
  message: "the constructor needs an iterable",
});

// Match by error type
assert.throws(() => JSON.parse("{bad}"), SyntaxError);

// Match by regex on message
assert.throws(() => riskyOp(), /permission denied/i);
```

### Async / promises
```js
await assert.rejects(fetchUser(-1), { message: "not found" });
await assert.doesNotReject(fetchUser(1));
```

### Unreachable branches
```js
switch (status) {
  case "ok": ...; break;
  case "err": ...; break;
  default: assert.fail(`unexpected status: ${status}`);
}
```

## `strict` vs legacy mode

| | `assert/strict` | `assert` (legacy) |
|---|---|---|
| `equal` | uses `===` | uses `==` |
| `deepEqual` | structural + `===` | structural + `==` |
| `assert(1 == "1")` | passes | passes |
| `assert.strictEqual(1, "1")` | **fails** | **fails** |

The legacy `assert.equal` and `assert.deepEqual` will coerce types (`1 == "1"` is true), which causes silent false positives. Always use strict mode.

## Running

No test runner needed — assertions throw `AssertionError` on failure:

```bash
node sorted-linked-list.js
```

Silence = all assertions passed. Failure prints the diff:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

+ [ 1, 2, 4, 5, 8, 9 ]
- [ 0, 1, 2, 4, 5, 8, 9 ]
```

## Resources

- [Node.js assert docs](https://nodejs.org/api/assert.html)
- [Strict assertion mode](https://nodejs.org/api/assert.html#strict-assertion-mode)
- [AssertionError class](https://nodejs.org/api/assert.html#class-assertassertionerror)
- [node: protocol (explicit built-ins)](https://nodejs.org/api/esm.html#node-imports)
