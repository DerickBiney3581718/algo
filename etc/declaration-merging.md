# Declaration Merging

TypeScript allows you to declare the same name multiple times in the same scope. Instead of an error, it **merges** the declarations into a single type. This is how you can augment types you don't fully control.

---

## Interface + Interface

The most common form. Two interfaces with the same name are merged into one.

```ts
interface User {
  name: string;
}

interface User {
  age: number;
}

// result: User = { name: string; age: number }
const u: User = { name: "Alice", age: 30 };
```

All members from every declaration must be satisfied. There is no conflict resolution — if the same property appears with incompatible types, TypeScript errors.

---

## Interface + Class (merging into a class)

A class declaration also creates a **type** (the instance type). An interface with the same name merges into that type.

```ts
class TArray<T extends number | string> {
  arr: T[];
  // ...
}

// adds an index signature to the instance type
interface TArray<T extends number | string> {
  [idx: number]: T;
}

const a = new TArray<number>([1, 2, 3]);
a[0]; // typed as number — TS now knows about numeric indexing
```

This is purely a **type-level** declaration. It does not generate any runtime code. The actual numeric access still relies on whatever the runtime does (in this case, a `Proxy`). TypeScript just trusts the assertion.

Use this when the runtime behavior is guaranteed (e.g. a Proxy) but TypeScript cannot infer it statically.

---

## Why TypeScript can't see through a Proxy

`new Proxy(target, handler)` is a runtime construct. TypeScript's type system is static — it only sees the declared shape of the object returned by `new Proxy(...)`, which is `TArray<T>`. There is no mechanism for TS to follow what the `get` trap does at runtime and infer that numeric keys are forwarded to `target.arr`.

The declaration merge is the correct, idiomatic fix: you are telling TS "trust me, this index signature is valid."

---

## Namespace merging

Namespaces can also merge with classes and functions to add static members or grouped exports.

```ts
function parse(input: string) {
  /* ... */
}

namespace parse {
  export type Options = { strict: boolean };
}

// parse is now both a callable and a namespace
const opts: parse.Options = { strict: true };
```

---

## What cannot be merged

- Two `class` declarations with the same name — error.
- Two `enum` declarations (unless both are `const enum` — even then, be careful).
- A `type` alias cannot merge with anything; it always errors on duplicate names.

```ts
type Foo = { a: number };
type Foo = { b: string }; // Error: Duplicate identifier 'Foo'
```

Use `interface` when you anticipate needing to merge or augment; use `type` for aliases, unions, and mapped types where merging is not needed.

---

## Module augmentation

The same merge mechanic works across module boundaries. This is how libraries expose extension points.

```ts
// in your own file, augment an imported module's types
import "some-library";

declare module "some-library" {
  interface SomeInterface {
    myCustomField: string;
  }
}
```

    return new Proxy(this, {
      get(target, key, receiver) {
        // this      → handler object
        // target    → original object passed to new Proxy(orig, handler)
        // receiver  → the proxy itself (what the property was accessed on)
        if (typeof key == "number") return target.arr[key];
        return Reflect.get(target, key, receiver);

---

## Resources

- [TypeScript Handbook — Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [TypeScript Handbook — Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript Deep Dive — Declaration Merging](https://basarat.gitbook.io/typescript/type-system/intro/declaration-spaces)
- [MDN — Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN — Reflect.get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get)
