# Review: `TArray`, `PriorityQueue`, `IndexedPriorityQueue`

Findings from a pass over:
- `src/data-structures/arrays/Array.ts`
- `src/data-structures/priority-queues/PriorityQueue.ts`
- `src/data-structures/priority-queues/IndexedPriorityQueue.ts`

Grouped by theme: type abstraction, method overriding, inheritance-vs-composition, and concrete bugs.

---

## 1. Type abstraction

### 1.1 `TArray`'s index signature lies about `null`

`TArray<T extends number | string | null>` declares:

```ts
export interface TArray<T extends number | string | null> {
  [idx: number]: T;
}
```

but the backing store is `arr: (T | null)[]`, and `insert`/`update` both accept `T | null`. Every read through the proxy (`target.arr[+key]`) is typed as `T`, but can genuinely be `null` or `undefined` at runtime.

**Solution:** change the index signature to `[idx: number]: T | null` and let every consumer handle `| null` explicitly, instead of relying on ad-hoc `!= null` runtime guards to compensate for a type that claims non-null.

**Further reading:**
- [TS Handbook — Index Signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
- [TS Handbook — Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

### 1.2 Two different constraints for the same concept

`createTArray<T extends string | number>` (no `null`) returns a `TArray<T extends number | string | null>` (allows `null`). Same logical type, two different constraints in the same file.

**Solution:** pick one constraint and reuse it — e.g. export a shared type alias `type TArrayElement = string | number | null;` and use it in both places.

### 1.3 `array` is `public` on `PriorityQueue`, and its meaning changes per subclass

`array: TArray<T>` (PriorityQueue.ts) holds actual values to compare in the base class, but holds *keys* that index into `keyValues` in `IndexedPriorityQueue`. Same field, same declared type, different meaning depending on which class you're holding a reference to — exposing it publicly means external code can read/mutate heap internals while assuming the wrong semantics if it's only typed as `PriorityQueue<T>`.

**Solution:** mark `array` `protected`. If a caller needs read access, expose a narrow accessor (`peekMax()`, `toArray()`) instead of the raw structure.

**Further reading:**
- [Liskov Substitution Principle (Wikipedia)](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
- [TS Handbook — Member Visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

### 1.4 `showArr` is a no-op wrapper

`get showArr() { return this.arr; }` — `arr` is already `public`, so this getter adds no encapsulation.

**Solution:** either make `arr` `private` and keep `showArr` as the sanctioned read path, or delete `showArr` entirely.

---

## 2. Method overriding

### 2.1 What's already working well

- `insertSideEffects` / `deleteSideEffects` no-op hooks on `PriorityQueue` are the correct fix for the earlier signature-widening problem (`insert(value, keyValue)` vs. base `insert(value)`) — a template-method hook instead of a narrowed override. See `docs/generics-constraint-variance.md`-adjacent discussion on why widening an override's required params breaks substitutability.
- `IndexedPriorityQueue.swap` is a clean override: calls `super.swap(...)`, then adds bookkeeping on top, without changing the signature.

### 2.2 `_isLess` is reimplemented, not extended, and the two versions disagree on null-handling

Base (`PriorityQueue._isLess`) has explicit `== null` early returns. The override (`IndexedPriorityQueue._isLess`) has none — `Number(undefined)` is `NaN`, `Number(null)` is `0`, so a sparse/empty slot silently participates in comparison as `0`/`NaN` instead of being excluded the way the base class excludes it. The `isMin` flip is also written with different structure in each (`leftVal > rightVal` vs. `!isLeftLess`), which makes it easy for the two to drift out of agreement over time.

**Solution:** extract a single, non-overridden `_isLess` on the base that calls an overridable hook, e.g. `_valueAt(idx): T | null`. Subclasses override *what value is being compared*, not *how the comparison, null-handling, and `isMin` flip work*. This removes the duplicated logic and the drift risk in one move.

```ts
// base
_isLess(left: number, right: number): boolean {
  const l = this._valueAt(left);
  const r = this._valueAt(right);
  if (r == null) return false;
  if (l == null) return true;
  return this.isMin ? l > r : l < r;
}
protected _valueAt(idx: number): T | null {
  return this.array[idx];
}

// IndexedPriorityQueue — only this changes
protected _valueAt(idx: number): T | null {
  const key = Number(this.array[idx]);
  return this.keyValues[key];
}
```

**Further reading:**
- [Refactoring Guru — Template Method pattern](https://refactoring.guru/design-patterns/template-method)
- [Effective TypeScript, Item 33 — "Push Null Values to the Perimeter of Your Types"](https://effectivetypescript.com/) (concept applies generally; also see the free summary threads if you don't have the book)

---

## 3. Side-effect hooks: composition instead of inheritance?

`IndexedPriorityQueue` isn't cleanly an "is-a" `PriorityQueue` — it changes what the base's core field (`array`) *means* (§1.3), and it has to reimplement comparison logic to compensate (§2.2). That's a classic signal that composition/strategy fits better than subclassing.

**Possible direction:**

```ts
class PriorityQueue<T> {
  constructor(opts: {
    max?: number;
    isMin?: boolean;
    compare?: (a: T, b: T) => boolean;
    onInsert?: (idx: number, value: T, metadata?: T) => void;
    onDelete?: (idx: number) => void;
  }) { /* ... */ }
}
```

`IndexedPriorityQueue` would then *compose* a `PriorityQueue` with a custom `compare`/`onInsert`/`onDelete`, instead of subclassing and fighting the base class's assumptions about what `array` and `_isLess` mean.

This is a real rewrite, not a small patch — worth doing only if you want to invest in it now. The current template-method-hook approach (`insertSideEffects`/`deleteSideEffects`, §2.1) is a reasonable middle ground if not.

Smaller, cheaper naming fix either way: `insertSideEffects`/`deleteSideEffects` read like a warning ("this has side effects") rather than "hook to extend behavior." `onInsert`/`onDelete` or `afterInsert`/`afterDelete` signal intent more clearly and match common conventions (React's `componentDidMount`, DOM's `onclick`, etc.).

**Further reading:**
- [Composition over Inheritance (Wikipedia)](https://en.wikipedia.org/wiki/Composition_over_inheritance)
- [Refactoring Guru — Strategy pattern](https://refactoring.guru/design-patterns/strategy)
- ["Prefer composition over inheritance" — React docs (concept transfers beyond React)](https://reactjs.org/docs/composition-vs-inheritance.html)

---

## 4. Concrete bugs found

| # | Location | Bug | Fix |
|---|----------|-----|-----|
| 1 | `IndexedPriorityQueue.insertWithKey` | When the key already exists, `updateItem(...)` runs but execution falls through and *also* calls `this.insert(keyValue, value)` unconditionally (no `return`/`else`) — existing keys get a duplicate heap entry instead of an in-place update. | Add `return` (or wrap in `else`) after the `updateItem` call. |
| 2 | `IndexedPriorityQueue.insertWithKey` | The `key value exceeds limit` bounds check runs *after* the update-path already executed, so an out-of-range key can trigger `updateItem` with a garbage `keyHeapPos[key]` before the error fires. | Move the bounds check to the top of the method, before any other logic. |
| 3 | `IndexedPriorityQueue.deleteItem` | `if (!key && !idx)` and `key ? this.keyHeapPos[key] : idx` both treat key `0` as "missing" (falsy), so a legitimate `key === 0` is rejected or silently mishandled. | Use `key == null` / `idx == null` checks instead of truthiness. |
| 4 | `IndexedPriorityQueue.deleteItem` | The trailing `if (key) { keyValues.update(key, null); keyHeapPos.update(key, null); }` block is dead code — `_delete(heapIdx)` already invokes `deleteSideEffects(lastIdx)`, which nulls out the same entries by reading the key back out of `this.array[deletedIdx]`. | Delete the redundant block. |
| 5 | `Array.ts` `insertAndSwap` | The `targetIdx !== undefined` fix only covers the unsorted, explicit-index branch. The `else` (sorted-insert) branch still computes `leftIdx = idx - 1` and swaps against `arr[-1]` when inserting at index 0, since `leftVal == null` is `true` for `undefined`. | Guard with `leftIdx >= 0` before calling `_swap` in both branches. |
| 6 | `Array.ts` `[Symbol.iterator]` | Returns `this` and relies on an instance-level `nextCounter`. Two concurrent `for...of` loops, or an early `break`, corrupt iteration state for future loops. | Use a generator: `*[Symbol.iterator]() { yield* this.arr; }` — removes the shared mutable counter and makes iteration reentrant. |
| 7 | `IndexedPriorityQueue.toString` | `JSON.stringify({ keyValues, keyHeapPos, heapPosKey })` serializes whole `TArray` instances (including `isSorted`, `nextCounter`, recorded visualization history from `Base`), not just logical contents. | Stringify `.arr` (or a dedicated `.toArray()` accessor) on each `TArray` instead of the instance itself. |

**Further reading:**
- [MDN — Iterators and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
- [MDN — Equality comparisons (`==` vs `===`, and why `undefined == null`)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality)

---

## Suggested order of attack

1. Bugs #1–#4 (`IndexedPriorityQueue` correctness bugs — active, easy to isolate, easy to verify).
2. Bug #5 (negative-index swap in `Array.ts`).
3. §2.2 `_isLess` dedup (`_valueAt` hook) — medium effort, removes a recurring source of drift.
4. §3 composition-vs-inheritance — larger call, only worth it if you want to invest in the redesign now.
5. §1 type-abstraction cleanups (`null` in index signature, `protected array`, drop `showArr`) — can be done incrementally alongside any of the above.
