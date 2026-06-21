# Refactoring Op Recording with Generators

## The Problem

Right now, `this.record(...)` is scattered through DS method bodies. Some at the end of a method, some inside loops, some inside recursion. This means:

- The DS class is responsible for both **algorithm logic** and **op emission** — two concerns tangled together
- Algorithm logic can't be tested without instantiating a full DS (which requires `EventTarget`, the Proxy, etc.)
- Adding a new DS means repeating the same recording boilerplate

---

## The Pattern: Algorithm Generators + `runAndRecord`

### Core idea

Split each operation into two layers:

| Layer | Responsibility | Knows about |
|---|---|---|
| **Algorithm generator** | Pure logic, yields ops as side-effects | Input data only |
| **DS method** | State mutation + wiring | `this.arr`, `runAndRecord` |

### 1. Add `runAndRecord` to `Base`

```ts
// Base.ts
protected runAndRecord<R>(gen: Generator<VisualOp, R>): R {
  let result = gen.next();
  while (!result.done) {
    this.record(result.value);
    result = gen.next();
  }
  return result.value as R;
}
```

This is the only recording boilerplate you'll ever write. Every DS method delegates to it.

---

### 2. Write algorithm logic as generators

Generators use `yield` to emit ops and `return` for their result value. No `this`, no side-effects.

**Linear search:**
```ts
function* linearSearch<T>(arr: T[], val: T): Generator<VisualOp, number> {
  for (let idx = 0; idx < arr.length; idx++) {
    yield { op: VISUAL_OPS_TYPES.MOVE_PTRS, args: { idx } };
    if (arr[idx] === val) return idx;
  }
  return -1;
}
```

**Delete:**
```ts
function* deleteAt<T>(arr: T[], idx: number, length: number): Generator<VisualOp, T[]> {
  const newArr = arr.slice(0, idx).concat(arr.slice(idx + 1));
  newArr.length = length;
  yield { op: VISUAL_OPS_TYPES.DEL, indices: [idx] };
  return newArr;
}
```

**Binary search (iterative instead of recursive — easier to yield from):**
```ts
function* binarySearch<T extends number | string>(
  arr: T[],
  val: T,
  validLen: number,
): Generator<VisualOp, number> {
  let low = 0, high = validLen - 1;
  while (low <= high) {
    const mid = Math.ceil((high + low) / 2);
    yield { op: VISUAL_OPS_TYPES.MOVE_PTRS, args: { low, high, mid } };
    if (arr[mid] === val) return mid;
    else if (arr[mid] > val) high = mid - 1;
    else low = mid + 1;
  }
  return -1;
}
```

> Note: recursive generators are possible via `yield*` but iterative is simpler and avoids stack growth.

---

### 3. DS methods become thin wrappers

```ts
// Array.ts
delete(idx: number) {
  this.arr = this.runAndRecord(deleteAt(this.arr, idx, this.length));
  this.updateValidLen();
}

search(val: T): number {
  return this.runAndRecord(
    this.isSorted
      ? binarySearch(this.arr, val, this.validLen)
      : linearSearch(this.arr, val)
  );
}
```

The DS method owns **what state to mutate** and **which algorithm to run**. Nothing else.

---

### 4. Where to put the algorithm functions

Three options depending on how much you want to separate things:

```
src/
  data-structures/
    Array.ts          ← DS class (thin wrappers only)
  algorithms/
    array/
      search.ts       ← linearSearch, binarySearch generators
      delete.ts       ← deleteAt generator
      insert.ts       ← insertAt generator
```

Or keep them co-located at the bottom of `Array.ts` if the project stays small. Either works — the key is they're plain functions, not methods.

---

### 5. Testing becomes easy

Because algorithm generators are pure functions, you can test op sequences directly without any DOM, EventTarget, or Proxy:

```ts
// delete.test.ts
it("emits DEL op at correct index", () => {
  const ops = [...deleteAt([1, 2, 3, 4], 2, 4)]; // spread to collect all yielded values
  expect(ops).toEqual([{ op: "delete", indices: [2] }]);
});

it("emits ops in correct order for binary search", () => {
  const gen = binarySearch([1, 3, 5, 7, 9], 7, 5);
  const ops: VisualOp[] = [];
  let r = gen.next();
  while (!r.done) { ops.push(r.value); r = gen.next(); }
  // assert pointer movements
});
```

---

## Why not decorators?

A method decorator fires once, after (or before) the whole method body. That works for `delete` (one op, at the end) but breaks down for `search` and `binarySearch` where ops are emitted **inside loops and recursion** — the algorithm and its op sequence are interleaved. Generators model this naturally; decorators don't.

---

## Resources

- [MDN: Iterators and Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators) — fundamentals, `yield`, `return` value, `Generator<T, TReturn>`
- [MDN: `function*` syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
- [MDN: `yield*` for delegating to another generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)
- [TypeScript Generator types](https://www.typescriptlang.org/docs/handbook/2/functions.html#other-types-to-know-about) — `Generator<YieldType, ReturnType, NextType>`
- [TC39: Decorators proposal](https://github.com/tc39/proposal-decorators) — why decorators are limited to method boundaries
