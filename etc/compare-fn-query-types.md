# Decoupling the Query Type from the Element Type (`LinkedList<T, Q = T>`)

Target files:
- `src/data-structures/linked-lists/LinkedLists.ts`
- `src/data-structures/symbol-tables/hashmap.ts`

## The problem

`Hashmap.delete(key)` cannot delete by key. It has to fetch the value first,
rebuild a whole `{ key, value }` struct, and hand that to the bucket — even
though the comparison only ever reads `.key`:

```ts
compareFn(node: LinkNode<NodeStruct<T, V>>, key: NodeStruct<T, V>): boolean {
  return node.value.key == key.key; //  ← `key.value` is never touched
}
```

The dummy `value` is dead weight that the caller must invent. Worse, inventing
it costs a full extra traversal (`get()` → then `remove()`'s own `search()`).

## Why you can't fix this inside `hashmap.ts`

The constraint lives one layer down, in `LinkedLists.ts:13`:

```ts
export type compareFn<T> = (counter: LinkNode<T>, value: T) => boolean;
//                                            ^^^^          ^^^^
//                                       element type == query type
```

One type parameter is doing two unrelated jobs:

| Job | What it should be |
| --- | --- |
| What the list **stores** | `NodeStruct<T, V>` |
| What you **search by** | `NonNullable<T>` (just the key) |

Because `T` serves both roles, `search`, `update`, and `remove` all demand a
complete element. Any fix confined to `Hashmap` is a workaround (fabricate a
struct, or widen `T` to a union) rather than a repair. Split the roles and the
problem disappears.

## The refactor

### 1. Two type parameters, plus a key projection

```ts
// LinkedLists.ts
export type CompareFn<T, Q = T> = (node: LinkNode<T>, query: Q) => boolean;
export type KeyFn<T, Q = T> = (value: T) => Q;

export class LinkedList<T, Q = T> extends Base {
  head: LinkNode<T> | null = null;
  tail: LinkNode<T> | null = null;

  keyOf: KeyFn<T, Q> = (value) => value as unknown as Q;
  compareFn: CompareFn<T, Q> = (node, query) => this.keyOf(node.value) === query;

  constructor(
    list: Iterable<T>,
    compareFn?: CompareFn<T, Q>,
    keyOf?: KeyFn<T, Q>,
  ) {
    super();
    if (keyOf) this.keyOf = keyOf;
    if (compareFn) this.compareFn = compareFn;
    for (const value of list) this.insert(value);
  }

  search(query: Q): LinkNode<T> | null {
    let counter = this.head;
    while (counter) {
      if (this.compareFn(counter, query)) return counter;
      counter = counter.next;
    }
    return null;
  }

  update(value: T): boolean {          // ← signature unchanged
    const found = this.search(this.keyOf(value));
    if (found === null) return false;
    found.value = value;
    return true;
  }

  remove(query: Q): LinkNode<T> | null {
    const found = this.search(query);
    return found === null ? null : this.removeNode(found);
  }
}
```

#### Why `keyOf`, and not an extra parameter on `update`

The obvious move is `update(query: Q, value: T)`. It works, but it changes a
signature that every *other* caller of `LinkedList` is happy with, purely to
serve the hashmap. And `update` isn't special — the same wall is hit by every
method that **holds a `T` but needs a `Q`**: `removeFromStart`,
`removeFromEnd`, a future `contains(value)`. Threading a query argument
through each one is treating the symptom.

The actual gap is that the list has no way to derive a query from an element
it already has. `keyOf` closes it once:

| Caller | Before | After |
| --- | --- | --- |
| Existing `LinkedList<X>` | `update(value)` | `update(value)` — unchanged |
| `Hashmap` bucket | impossible without a dummy | `update({ key, value })` |

For a plain `LinkedList<X>`, `Q` defaults to `X` and `keyOf` defaults to
identity, so `search(this.keyOf(value))` *is* `search(value)`. Nothing moves.

Two things fall out for free:

- **One of the two casts disappears.** The default comparator no longer needs
  `node.value === (query as unknown as T)`; `this.keyOf(node.value) === query`
  has `Q` on both sides and typechecks cleanly. The single remaining assertion
  lives in `keyOf`'s default, where "`Q` is `T`" is precisely what the default
  asserts.
- **`compareFn` becomes optional more often.** With a projection set, the
  default comparator already does key-based `===`. `Hashmap` still passes one
  because it wants `eqnFn`, but a list keyed on a primitive field needs only
  `keyOf`.

⚠️ **Invariant:** `keyOf` and `compareFn` must agree —
`compareFn(node, keyOf(node.value))` must be `true` for every node. Violating
it makes `update(value)` and `search(key)` disagree about what "the same
element" means. Same contract as Java's `equals`/`hashCode`.

#### Alternatives considered

- **Additive method** — keep `update(value)`, add `updateBy(query, value)`.
  Zero risk and perfectly reasonable if you want to stop there. But it scales
  badly: `removeBy`, `containsBy`, one per method, forever.
- **Overloads on arity** — `update(value)` / `update(query, value)`.
  Backwards compatible, but the implementation signature collapses to a union
  and you dispatch on `arguments.length`. Cost outweighs the benefit.
- **Optional trailing parameter** — `update(value: T, query?: Q)` with
  `query ?? (value as unknown as Q)`. Compiles for everyone, then silently
  misbehaves when `Q ≠ T` and a caller omits the argument. This puts the
  unsoundness in the *common* path instead of the default-only path — the one
  variant that is genuinely worse than the others.

### 2. A node-based removal core

`remove` currently owns the splicing logic, which forces
`removeFromStart`/`removeFromEnd` to round-trip a value they *already hold*
back through `search`. That round-trip is now expressible (`remove(keyOf(v))`)
but it is still two wasted traversals to find a node you are holding a pointer
to. Extract the splice:

```ts
removeNode(found: LinkNode<T>): LinkNode<T> {
  const prev = this._prevNode(found);
  if (found === this.head) this.head = found.next;
  if (found === this.tail) this.tail = prev;
  if (prev !== null) prev.next = found.next;
  found.next = null;
  return found;
}

removeFromStart(): LinkNode<T> | null {
  return this.head === null ? null : this.removeNode(this.head);
}

removeFromEnd(): LinkNode<T> | null {
  return this.tail === null ? null : this.removeNode(this.tail);
}

private _prevNode(target: LinkNode<T>): LinkNode<T> | null {
  let curr = this.head;
  if (curr === target) return null;
  while (curr && curr.next !== target) curr = curr.next;
  return curr;
}
```

This is not just plumbing for the generic change — it fixes a real bug.
`_prev(value: T)` compares with `===` on the *value*, so for object elements
(`NodeStruct`) it can only match by reference identity and silently walks off
the end, returning the tail as "previous". Comparing **nodes** is correct by
construction.

### 3. The hashmap probes with a bare key

```ts
type Bucket<T, V> = LinkedList<NodeStruct<T, V>, NonNullable<T>>;

export class Hashmap<T, V> {
  _keys: Bucket<T, V>[] = [];

  //  ← arrow field, not a method (see caveat below)
  private compareFn = (
    node: LinkNode<NodeStruct<T, V>>,
    key: NonNullable<T>,
  ): boolean => this.eqnFn(node.value.key, key) === 0;

  put(key: NonNullable<T>, value: NonNullable<V>): void {
    const idx = this.hash(key);
    const list = this._keys[idx] ?? null;

    if (list === null) {
      this._keys[idx] = new LinkedList(
        [{ key, value }],
        this.compareFn,
        (node) => node.key,   // ← the projection
      );
    } else if (!list.update({ key, value })) {
      list.insertAtEnd({ key, value });
    }
  }

  get(key: NonNullable<T>): NonNullable<V> | null {
    return this._getList(key)?.search(key)?.value.value ?? null;
  }

  delete(key: NonNullable<T>): void {
    this._getList(key)?.remove(key); // one pass, no get() first
  }
}
```

Note this is also the first time `eqnFn` — currently stored in the constructor
and never called — actually gets used. The old `compareFn` used `==`, which
compares object keys by reference and coerces primitives.

---

## Deep dive: what `Q = T` actually means

### It is a *default type argument*, not a constraint

Two different syntaxes that are easy to conflate:

```ts
class A<Q extends T> {} // constraint — Q must be assignable to T
class B<Q = T> {}       // default    — if Q is unspecified, it becomes T
```

`extends` **restricts** what you may pass. `=` **supplies a fallback** when
nothing is passed. `Q = T` places zero restriction on `Q`: the query type is
free to be a key, a string, an id — anything unrelated to the element type.
That freedom is exactly the point of the refactor.

Defaults landed in TypeScript 2.3 and follow the same rule as default function
parameters: they may only be followed by other defaulted parameters.

```ts
class Ok<T, Q = T> {}     // ✅
class Bad<T = string, Q> {} // ❌ required param after an optional one
```

### Why the default makes this refactor non-breaking

Without a default, adding a parameter is a breaking change — every existing
`LinkedList<number>` becomes an arity error:

```ts
class LinkedList<T, Q> {}
const l: LinkedList<number> = ...; // ❌ Generic type requires 2 type arguments
```

With `Q = T`, every old annotation and call site keeps compiling and keeps its
old meaning:

```ts
LinkedList<number>          // ≡ LinkedList<number, number> — the old behaviour
LinkedList<Node, string>    // opt in to key-based probing
```

The default *is* the migration strategy. Combined with `keyOf`, **no public
signature changes at all** — the refactor is purely additive for every
existing caller.

### How `Q` gets resolved, in order

TypeScript picks `Q` by trying three things:

1. **Explicit type argument** wins outright.
   ```ts
   new LinkedList<NodeStruct<K, V>, K>(items, cmp);
   ```
2. **Inference from the arguments**, if `Q` appears in a parameter position.
   ```ts
   new LinkedList(nodes, (n, k: string) => n.value.key === k);
   // Q inferred as string, from compareFn's second parameter
   ```
3. **The default**, only when inference yields no candidates at all.
   ```ts
   new LinkedList([1, 2, 3]); // compareFn omitted → nothing to infer → Q = number
   ```

⚠️ Step 3 is narrower than people expect. The default is a *fallback for the
absence of information*, not a *preference*. If `compareFn` is present, its
second parameter decides `Q`, and the default is never consulted — which is
why `new LinkedList(items, (n, q) => ...)` with an unannotated `q` can infer
`Q = unknown` rather than `T`. Annotate the parameter or the class:

```ts
const l = new LinkedList<Item, ItemId>(items, (n, id) => n.value.id === id);
//                                                  ^^ now contextually typed
```

### The cast in the default `keyOf`

```ts
keyOf: KeyFn<T, Q> = (value) => value as unknown as Q;
```

The field's declared type is `KeyFn<T, Q>` for an *arbitrary* `Q`. Inside
the class body TypeScript treats `T` and `Q` as two opaque, unrelated types —
it deliberately does **not** substitute the default when checking the body,
because the class must be correct for every `Q` a caller might pick. So
returning a `T` where a `Q` is expected is rejected.

`as unknown as T` is a double assertion: `T → unknown → Q`. A single
`value as Q` also fails, since assertions require the types to be
*comparable*, and unrelated type parameters are not. Widening through
`unknown` (which everything is assignable to) is the standard escape hatch.

This is the honest cost of the design: **one unchecked assertion, confined to
the default implementation.** It is only reached when no `keyOf` was
supplied — the case where `Q` really is `T` — so the assertion is true
whenever it runs. Note the projection localises it: because the default
`compareFn` is written in terms of `keyOf`, it needs no cast of its own. If
you would rather have none at all, drop the default and require `keyOf` at
construction. Two alternatives that are *not* better:

- `Q extends T` — restores the coupling you're trying to remove.
- `search(query: T | Q)` — kills inference and pushes narrowing into every
  comparator.

### Variance: `LinkedList<T, Q>` is *invariant* in `Q`

`Q` appears in a *parameter* position of `compareFn`/`search` (contravariant)
**and** in the *return* position of `keyOf` (covariant). Both together means
invariant — two instantiations are assignable only if their `Q`s are
identical:

```ts
declare let wide: LinkedList<Item, string | number>;
declare let narrow: LinkedList<Item, string>;

narrow = wide; // ❌ keyOf returns string|number; narrow's callers expect string
wide = narrow; // ❌ compareFn takes only string; wide promises string|number
```

Without `keyOf`, `Q` would be purely contravariant and `narrow = wide` would
be legal. The projection is what makes it invariant — the price of being able
to convert in both directions. In practice this just means bucket types must
be annotated exactly; give the pairing a name (`type Bucket<T, V> = ...`)
rather than expecting related instantiations to interconvert.

Under `strictFunctionTypes`, function *type* positions (like the
`CompareFn<T, Q>` alias) are checked strictly, while *method* declarations
stay bivariant for backwards compatibility. Declaring the comparator as a
property with a function type — as above — is what gets you the sound check.

Worked example of an error this produces:
[`generic-variance-and-assignability.md`](./generic-variance-and-assignability.md).

### Class-level `Q` vs method-level `Q`

The choice is where the comparison policy lives:

```ts
// per-instance: configure once at construction
class LinkedList<T, Q = T> {
  search(query: Q): LinkNode<T> | null;
}

// per-call: a fresh predicate every time
class LinkedList<T> {
  search(match: (node: LinkNode<T>) => boolean): LinkNode<T> | null;
}
```

The predicate form is maximally flexible and needs no second parameter, but
the list loses any built-in notion of equality and every call site allocates a
closure and restates the comparison. For a hash-table bucket the comparison is
a fixed property of the table (it *is* `eqnFn`), so class-level `Q` is the
better fit. Keep a predicate-based `find()` alongside it if you want ad-hoc
scans.

### Prior art — this is a solved problem

This pattern has a name in other languages: **heterogeneous lookup**.

- **C++14** added transparent comparators (`std::less<>`), letting
  `std::map<std::string, V>::find` accept a `std::string_view` without
  materialising a `std::string`. Same motivation: don't force callers to
  construct an object just to look one up.
- **Rust** solves it with the `Borrow` trait: `HashMap<String, V>::get`
  takes `&Q where String: Borrow<Q>`, so you can pass a `&str`.
- **Java** goes the other way — `Map.get(Object key)` is untyped, trading
  type safety for the same flexibility. A cautionary tale, not a model.

---

## Caveats and adjacent bugs

### ⚠️ `compareFn` must be an arrow field, not a method

`hashmap.ts:50` passes `this.compareFn` as a value to the `LinkedList`
constructor. A class *method* extracted that way loses its receiver, so
`this.eqnFn` is `undefined` at call time and throws. Declare it as an arrow
property (which captures `this` lexically at construction) or bind it in the
constructor.

### ⚠️ `insertAtEnd` breaks on an empty list

```ts
insertAtEnd(value: T): void {
  const newNode = new LinkNode(value);
  if (this.tail) this.tail.next = newNode;
  this.tail = newNode;   // head is never set when the list was empty
}
```

`put()` can reach this path, leaving `head === null` with a non-null `tail` —
`search` then finds nothing. Add `if (this.head === null) this.head = newNode;`.

### ⚠️ The shared `_iter` cursor

`[Symbol.iterator]()` returns `this`, so all iteration shares one mutable
cursor and there is no `return()` method. Any `for…of` with an early `break`
parks the cursor mid-list, and the next iteration of that list resumes from
there. Hand back a fresh cursor object instead:

```ts
[Symbol.iterator](): Iterator<T> {
  let curr = this.head;
  return {
    next: () => {
      if (curr === null) return { value: undefined, done: true };
      const value = curr.value;
      curr = curr.next;
      return { value, done: false };
    },
  };
}
```

## Migration checklist

1. `compareFn<T>` → `CompareFn<T, Q = T>`; add `Q = T` to the class.
2. Add `KeyFn<T, Q>` and the `keyOf` field + constructor parameter.
3. `search`/`remove` take `Q`; `update(value)` keeps its signature and routes
   through `this.keyOf(value)`.
4. Extract `removeNode`; rewrite `_prev` to compare nodes; repoint
   `removeFromStart`/`removeFromEnd`.
5. Fix `insertAtEnd`'s empty-list case.
6. In `Hashmap`: comparator → arrow field using `eqnFn`; pass
   `(node) => node.key` as `keyOf`; `get`/`delete` pass the bare key; `put`
   keeps `update({ key, value })`.
7. **Existing `LinkedList<X>` usages need no change whatsoever** — the type
   default covers the annotations, the `keyOf` default covers the behaviour,
   and no public signature moved.

## Resources

- TS Handbook — Generics (generic classes, constraints):
  https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-classes
- Generic parameter defaults (TS 2.3 release notes):
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#generic-parameter-defaults
- `strictFunctionTypes` — strict vs bivariant parameter checking:
  https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
- Type assertions and why `as unknown as T` is needed:
  https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
- `this` at runtime in classes (why the comparator needs an arrow):
  https://www.typescriptlang.org/docs/handbook/2/classes.html#this-at-runtime-in-classes
- `NonNullable<T>` and other utility types:
  https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype
- The iterator protocol and `return()`:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
- C++ heterogeneous lookup (`std::map::find` transparent comparators):
  https://en.cppreference.com/w/cpp/container/map/find
- Rust's `Borrow` trait — the same problem, solved in the type system:
  https://doc.rust-lang.org/std/borrow/trait.Borrow.html
- Sedgewick, *Algorithms* 4/e — hash tables and separate chaining:
  https://algs4.cs.princeton.edu/34hash/
- Related note in this folder: [`type-predicates.md`](./type-predicates.md)
