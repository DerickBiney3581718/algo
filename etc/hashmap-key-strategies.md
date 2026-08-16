# Strategies for Hashing Arbitrary Key Types

How do you let a `Hashmap<K, V>` accept keys that aren't strings? Here is the
full design menu, with the trade-offs and how real languages/libraries land.

---

## First, the rule that governs *all* of them

> **The hash-equals contract:** if two keys are "equal," they **must** hash to
> the same value. (The reverse need not hold — unequal keys may collide.)

Whatever decides "same key" (`===`, a structural `eqFn`, a `.equals()` method)
has to be consistent with whatever produces the hash. This is *the* bug factory.
Your current `compareFn` uses `===`, which is **reference identity** for
objects — so two structurally-identical object keys are "different" no matter
how they hash. Pick your equality and hashing together, never separately.

---

## Approach A — Inject one hash function (Strategy pattern)  ⭐ recommended

The map is generic in `K`, so **each instance is monomorphic** — a
`Hashmap<string>` only ever sees strings, a `Hashmap<Point>` only ever sees
points. That means you do **not** need `typeof` dispatch and you do **not** need
"a hashFn per type" globally. You need *one* function per instantiation, supplied
by whoever knows `K`.

```ts
type HashFn<K> = (key: K) => number;
type EqFn<K> = (a: K, b: K) => boolean;

class Hashmap<K, V> {
  constructor(
    private hashFn: HashFn<K>,
    private eqFn: EqFn<K> = (a, b) => a === b,
  ) {}
}

// caller picks the strategy that matches K:
new Hashmap<string>(hashString);
new Hashmap<Point>(p => (p.x * 31 + p.y) >>> 0, (a, b) => a.x === b.x && a.y === b.y);
```

- ✅ Fully type-safe; no runtime type-sniffing; correct by construction.
- ✅ This is exactly how **Rust** (`Hash` + `BuildHasher`), **C++**
  (`std::hash<Key>` / `KeyEqual` template params), and **Java** (custom
  `Comparator`/hashing) generalize.
- ❌ Caller has to provide a function for non-primitive keys.

> **Key insight:** generics make "which hashFn?" a *compile-time* decision, so the
> `typeof` question disappears. `typeof` dispatch is only needed if you want a
> *single* map holding **mixed** key types at once — which is unusual and usually
> a design smell.

---

## Approach B — One built-in universal hash that dispatches on `typeof`

Reproduces what dynamic languages do internally: one `hash(key)` that branches on
the runtime type.

```ts
private hash(key: unknown): number {
  switch (typeof key) {
    case "string":  return hashString(key);
    case "number":  return hashNumber(key);
    case "boolean": return key ? 1 : 0;
    case "object":  return key === null ? 0 : hashObject(key);
    default:        return hashString(String(key));
  }
}
```

- ✅ Most ergonomic — caller passes any key, no function needed.
- ❌ You must enumerate every type and get objects right (structural vs identity).
- ❌ Loses the type-safety of `K`; `hash` takes `unknown`.
- This is roughly what **Python** (`hash()` + each type's `__hash__`) and JS
  engines do behind the scenes.

---

## Approach C — Serialize to string, then reuse your string hash

```ts
private hash(key: K): number {
  return hashString(JSON.stringify(key));
}
```

- ✅ Dead simple; one code path; works for many plain-data keys.
- ❌ `JSON.stringify` is **not canonical**: object key order matters
  (`{a,b}` ≠ `{b,a}`), and it silently mishandles `undefined`, functions,
  `NaN`→`null`, `BigInt` (throws), `Map`/`Set`, and circular refs.
- Fine for a toy/study map with plain object keys; risky for general use unless
  you write a *canonical* serializer (sorted keys, stable formatting).

---

## Approach D — Require a `hashCode()` protocol (and auto-box primitives)

```ts
interface Hashable { hashCode(): number; equals(o: unknown): boolean; }
```

Now `"foo".hashCode()` doesn't exist — primitives have no such method. To support
them you'd **auto-box**: `string → new StringKey(s)`, `number → new NumberKey(n)`,
etc. That is literally **Java autoboxing** (`int` → `Integer`).

- ✅ Clean for your *own* rich key classes.
- ❌ Heavy ceremony; boxing every primitive is wasteful and easy to get subtly
  wrong. Rarely worth it in TS.
- Mirrors **Java**'s `Object.hashCode()`/`equals()` contract — but Java only gets
  away with it because the language auto-boxes for you.

---

## Approach E — Sensible default + optional override (hybrid)  ⭐ also great

Give a built-in universal hash (Approach B or C) as the **default**, but let the
constructor **override** it for custom types. This is **Python's** model:
everything is hashable by default via `__hash__`, and you override when you need
custom behavior.

```ts
constructor(hashFn: HashFn<K> = defaultHash, eqFn: EqFn<K> = Object.is) {}
```

- ✅ Ergonomic for primitives *and* correct for custom types.
- ✅ Best all-round choice if you want the map to "just work" out of the box.

---

## Approach F — Identity hashing for objects (WeakMap of ids)

If you want **reference** semantics for object keys (two distinct objects are
different even if identical in content — like JS `Map` and Java's default
`Object.hashCode()`):

```ts
const ids = new WeakMap<object, number>();
let next = 1;
function identityHash(o: object): number {
  let id = ids.get(o);
  if (id === undefined) ids.set(o, (id = next++));
  return id;
}
```

- ✅ No structural traversal; matches JS `Map`/`Set` semantics.
- ❌ Only works for objects (WeakMap keys), and gives *identity* equality — not
  what you want if `{x:1,y:2}` should equal a fresh `{x:1,y:2}`.

---

## Recommendation for this repo

For an **algorithms study** map, **Approach A** (inject one `hashFn` + `eqFn`)
teaches the real generalization every serious language uses, keeps full
type-safety, and sidesteps `typeof`/auto-boxing entirely. If you want ergonomics
too, layer **Approach E** on top: default to a built-in hash, allow an override.

Either way: **decide equality and hashing as one unit**, and replace the current
`===` compare with an injected `eqFn` so structural keys can work.

---

## Aside: how does JS `Map` hash many key types at once?

`Map` (and `Set`) hold keys of **any** type in **one** internal table — there is
*not* a separate hashmap per type. Equality is **SameValueZero** (`===` but with
`NaN` equal to `NaN`). Plain **objects** are different: their keys are always
coerced to strings (or symbols), so `o[1]` and `o["1"]` are the same key — which
is why objects model a hashmap poorly.

"How does it hash without checking the type?" — it *does* check. In a dynamically
typed language every value carries a **runtime type tag** in its representation
(NaN-boxing / tagged pointers). The engine's internal hash reads that tag and
branches:

| Key kind         | How it's hashed                                             |
| ---------------- | ----------------------------------------------------------- |
| small integer    | hash the integer bits                                       |
| double           | hash the bit pattern                                        |
| string           | hash the chars — V8 **caches** the hash in the string header |
| object / symbol  | **identity hash**: a random id lazily assigned + stored on the object, then reused |

Reading the tag is a couple of bit ops — far cheaper than a userland `typeof`
chain, but the same idea. There is no way to hash a heterogeneous pile of keys
without consulting each one's type.

**Why your generic `Hashmap<K>` doesn't need this:** `Map` is *one instance
holding many types*, so it **must** dispatch at runtime. `Hashmap<K, V>` is
generic, so each instance is **monomorphic** — `new Hashmap<string>()` only holds
strings, and the "type check" already happened at **compile time**. Same check,
paid at a different moment: `Map` pays at runtime (flexibility), a typed map pays
at compile time (safety + speed). That is the dynamic-vs-static trade in
miniature, and it is exactly why Approach A needs no `typeof`.

## Resources

- **Java** `Object.hashCode()` / `equals()` contract:
  https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Object.html#hashCode()
- **Python** hashable objects, `__hash__` / `__eq__`:
  https://docs.python.org/3/reference/datamodel.html#object.__hash__
  and the glossary "hashable": https://docs.python.org/3/glossary.html#term-hashable
- **Rust** `std::hash::Hash` + `BuildHasher`:
  https://doc.rust-lang.org/std/hash/trait.Hash.html
- **C++** `std::hash` and `unordered_map` template params (`Hash`, `KeyEqual`):
  https://en.cppreference.com/w/cpp/utility/hash
  and https://en.cppreference.com/w/cpp/container/unordered_map
- **JS** `Map` key equality (SameValueZero) and `WeakMap`:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
- **SameValueZero** algorithm (the equality `Map`/`Set` use):
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#same-value-zero_equality
- Object → string key coercion (`ToPropertyKey`) on plain objects:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors#property_names
- V8 internals — `OrderedHashTable` behind `Map`/`Set`:
  https://v8.dev/blog/hash-code (identity hash codes for objects)
- **immutable.js** value equality / custom hashing (real-world Approach D/E):
  https://immutable-js.com/docs/latest/ValueObject/
- Strategy pattern (the OO name for Approach A):
  https://refactoring.guru/design-patterns/strategy
- `JSON.stringify` gotchas (why Approach C isn't canonical):
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description
