# Factory Patterns & Iterable Validation

## 1. Checking if userList is a non-empty Iterable

### What is an Iterable?
Any object with a `[Symbol.iterator]` method. Arrays, Sets, Maps, strings, generators all qualify.

```typescript
function isIterable(val: unknown): val is Iterable<unknown> {
  return val != null && typeof (val as any)[Symbol.iterator] === "function";
}
```

But that only checks the protocol exists — not that it has elements. To check non-empty:

```typescript
function isNonEmptyIterable<T>(val: unknown): val is Iterable<T> {
  if (val == null || typeof (val as any)[Symbol.iterator] !== "function") return false;
  // peek at the first value without consuming the iterator
  const iter = (val as Iterable<unknown>)[Symbol.iterator]();
  return !iter.next().done;
}
```

**Why peeking matters:** An empty array `[]` IS iterable, `isIterable([])` returns true.
`isNonEmptyIterable([])` returns false — which is what you actually want here.

### Applied to your factory:

```typescript
if (isNonEmptyIterable<T>(userList)) return userList;
```

---

## 2. No Fallback — undefined or throw?

In your current code:

```typescript
const { userList, total = MAX_ARRAY_SIZE, random = MAX_RANDOM } = params;
if (userList !== undefined) return userList;
else if (total !== undefined && random !== undefined) { ... }
// falls off the end if neither condition is met
```

`total` and `random` always have defaults, so the `else if` always runs.
But if you removed the defaults, the function would **silently return `undefined`** — not throw.

TypeScript would still infer the return type as `T[] | Iterable<T> | undefined`,
and the caller gets `undefined` without any error, which is worse than a throw.

**Rule:** A factory that returns `undefined` is broken. Either:
- Return a guaranteed value (provide defaults), or
- `throw new Error(...)` with a clear message at the end

```typescript
throw new Error("ArrayFactory.create: provide userList or total + random");
```

---

## 3. What's Missing in Your Factory

### a. `random` is never used
`random` is destructured and validated but never drives behavior. Presumably it should control
the range of generated values (e.g., values between 0 and `random * 10`), not just be checked.

### b. `Math.random() * 100` ignores `random`
The generated values are always 0–100. `random` should probably cap the value range:
```typescript
genArray.push(Math.floor(Math.random() * random));
```

### c. `genArray.sort()` sorts lexicographically by default
`[].sort()` converts elements to strings and sorts alphabetically.
`[10, 9, 2].sort()` → `[10, 2, 9]` (wrong for numbers).
Use a comparator:
```typescript
if (isSorted) genArray.sort((a, b) => a - b);
```

### d. Return type is implicit and inconsistent
`userList` is `Iterable<T>` but the generated path returns `number[]`.
The caller has to handle both. Either:
- Convert `userList` to an array: `return Array.from(userList)`
- Or explicitly type the return: `): T[] | Iterable<T>`

### e. No validation on `userList`
If the caller passes an empty iterable, the factory silently passes it through.
Add the `isNonEmptyIterable` check above and fall through to generation if it's empty.

---

## 4. Standard Ways to Create Factories in TypeScript

### a. Static class method (your current approach)
```typescript
class ArrayFactory {
  static create<T>(params: Params<T>): T[] { ... }
}
ArrayFactory.create({ total: 10 });
```
Good when you need a namespace. The class itself is never instantiated.

### b. Plain factory function (simplest)
```typescript
function createArray<T extends number | string>(params: Params<T>): T[] { ... }
createArray({ total: 10 });
```
Preferred when there's no state or related methods. Easier to tree-shake, easier to test.

### c. Factory with builder (fluent API)
```typescript
class ArrayBuilder<T extends number | string> {
  private params: Params<T> = {};

  withList(list: Iterable<T>): this { this.params.userList = list; return this; }
  withTotal(n: number): this { this.params.total = n; return this; }
  sorted(): this { this.params.isSorted = true; return this; }
  build(): T[] { return createArray(this.params); }
}

new ArrayBuilder<number>().withTotal(10).sorted().build();
```
Good when construction has many optional steps and order matters.

### d. Factory with overloads (typed variants)
```typescript
function createArray(params: { userList: Iterable<number> }): number[];
function createArray(params: { total: number; random: number }): number[];
function createArray(params: Params<number>): number[] { ... }
```
Good when different param shapes lead to meaningfully different outputs.
TypeScript picks the right overload at call sites.

### e. Abstract factory (for families of related objects)
```typescript
interface DSAFactory<T> {
  create(params: unknown): T;
}

class ArrayFactory implements DSAFactory<TArray<number>> {
  create(params: createParams<number>): TArray<number> { ... }
}

class LinkedListFactory implements DSAFactory<LinkedList<number>> {
  create(params: createParams<number>): LinkedList<number> { ... }
}
```
Good when you want a common interface across all data structure factories (aligns with
DSABase pattern in ops-design-patterns.md).

---

## Recommendation for This Project

Use **plain factory function (b)** for now — `ArrayFactory` as a static class adds a namespace
without adding anything else. When all data structures have factories, introduce an
**abstract factory interface (e)** so the playback engine can create any DS through one interface.

```typescript
// near-term
export function createArray<T extends number | string>(params: createParams<T>): TArray<T> {
  if (isNonEmptyIterable<T>(params.userList)) return new TArray(params.userList, params.isSorted);
  const { total = MAX_ARRAY_SIZE, random = MAX_RANDOM, isSorted = false } = params;
  if (total > MAX_ARRAY_SIZE || total < 1) throw new Error("...");
  if (random < 1 || random > total) throw new Error("...");
  const arr = Array.from({ length: total }, () => Math.floor(Math.random() * random)) as T[];
  if (isSorted) arr.sort((a, b) => (a as number) - (b as number));
  return new TArray(arr, isSorted);
}
```
