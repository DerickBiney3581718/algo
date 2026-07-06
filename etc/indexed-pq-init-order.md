# IndexedPriorityQueue: itemHeapPos undefined during construction

## The bug

`IndexedPriorityQueue` constructor:

```ts
class IndexedPriorityQueue<T extends string | number> extends PriorityQueue<T> {
  itemHeapPos: TArray<number> = new TArray([]);
  constructor(params: PQConstructorParams<T>) {
    super(params);
    this.itemHeapPos = new TArray([], false, false, this.size);
  }
  insert(value: T) {
    ...
    if (typeof value === "number") this.itemHeapPos?.insert(value, currentIdx);
    this._bubbleUp(currentIdx);
  }
}
```

`PriorityQueue` constructor:

```ts
constructor(params: PQConstructorParams<T>) {
  super();
  if (params.max) this.array = new TArray([], false, false, params.max);
  else this.array = new TArray([], false, true, 1);
  if (params.entries) {
    this.insertBulk(params.entries); // calls this.insert(value) per entry
  }
}
```

If `params.entries` is passed to `new IndexedPriorityQueue({ entries })`:

1. `IndexedPriorityQueue`'s constructor runs `super(params)` first.
2. Inside `PriorityQueue`'s constructor, `this.insertBulk(entries)` runs, calling `this.insert(value)` per entry.
3. Because `this` is the `IndexedPriorityQueue` instance, this dispatches virtually to **`IndexedPriorityQueue.insert`**, not `PriorityQueue.insert` β€” overrides apply even while still executing inside the base constructor.
4. But `IndexedPriorityQueue`'s own field initializer (`itemHeapPos = new TArray([])`) and the explicit reassignment in its constructor body both run **after `super()` returns** β€” that's the language rule: subclass field initializers/constructor-body code execute only once `super()` has completed.
5. So at step 3, `this.itemHeapPos` is `undefined`. The call `this.itemHeapPos?.insert(...)` silently no-ops due to optional chaining β€” no crash, but the entry is never registered in `itemHeapPos`.

Net effect: entries seeded via the constructor's `params.entries` get added to `this.array` and bubbled correctly, but `itemHeapPos` never learns their positions. `swap()`'s id β†’ position bookkeeping is broken for every constructor-seeded entry; it only starts working for items inserted after construction finishes.

## Why this happens (language rules)

- In a derived class, `super()` must run before any use of `this`, including running the subclass's own field initializers.
- Field initializers for a derived class are compiled to run as the *first thing after `super()` returns*, in declaration order, before the rest of the derived constructor body executes.
- Method calls are always resolved dynamically via the prototype chain β€” there is no "static"/early-bound dispatch to the base class's own version of an overridden method, even from within the base constructor itself. This is the classic "virtual call from constructor" hazard shared with Java/C++/Python: the base constructor unwittingly invokes derived-class logic before the derived class has finished initializing its own state.

## Fixes (pick one)

1. **Don't pass `entries` through the base constructor for indexed queues.** Have `IndexedPriorityQueue` accept entries separately and call `insertBulk` itself, after `itemHeapPos` is initialized:
   ```ts
   constructor(params: Omit<PQConstructorParams<T>, "entries">, entries?: TArray<T>) {
     super(params);
     this.itemHeapPos = new TArray([], false, false, this.size);
     if (entries) this.insertBulk(entries);
   }
   ```
2. **Guard/lazily initialize `itemHeapPos` in `insert()`** so it self-heals if called before the field is set (e.g. `this.itemHeapPos ??= new TArray([], false, false, this.size)`), instead of relying on optional chaining to hide the gap.
3. **Avoid doing meaningful work in the base constructor at all** β€” have `PriorityQueue` expose `insertBulk` but never call it from its own constructor; require callers (or a factory function) to call it explicitly after the object is fully constructed. Removes the virtual-dispatch-from-constructor hazard entirely.

(3) is the most robust long-term since it sidesteps the "calling overridable methods from a constructor" anti-pattern altogether, but (1) is the smallest patch given the current design.

## Resources

- MDN, [`super`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super) β€” `super()` must be called before `this` is used in a derived constructor.
- MDN, [Public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields) β€” field initializers run in declaration order, immediately after `super()` returns in a subclass.
- Effective Java, Item 19 ("Design and document for inheritance or else prohibit it") β€” classic writeup of the "calling overridable methods from constructors" hazard; the JS/TS field-initializer-ordering issue here is a variant of the same root problem (base constructor invoking not-yet-initialized derived state via virtual dispatch).
- TC39 spec background: [class-fields proposal](https://github.com/tc39/proposal-class-fields) β€” defines the semantics of when field initializers run relative to `super()`.
