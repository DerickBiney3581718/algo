# TypeScript Type Predicates (User-Defined Type Guards)

## The core idea

A normal function that returns `boolean` tells the compiler nothing about its
arguments. A **type predicate** does — by using a special return-type form:

```ts
function isString(x: unknown): x is string {
  return typeof x === "string";
}
```

The `x is string` part is the type predicate. It instructs the compiler:

> If this function returns `true`, treat `x` as `string` in that branch.

```ts
function f(value: unknown) {
  if (isString(value)) {
    value.toUpperCase(); // value: string  ✅ narrowed
  } else {
    value;               // value: unknown
  }
}
```

## Return *type* narrows, not return *value*

This is the trap. Both of these return a `boolean` **value** at runtime:

```ts
function a(x: any): boolean            { ... } // return type: boolean → no narrowing
function b(x: any): x is Iterable<string> { ... } // return type: predicate → narrows
```

`Object.prototype.hasOwnProperty` is declared `(v: PropertyKey): boolean`, so it
never narrows — its return type is a plain `boolean`, regardless of what it does
at runtime. Narrowing lives entirely in the **type annotation**, not in the
returned value.

## The two-part rule

To write a valid predicate you need *both*:

1. **The annotation** — `x is T` on the return. This is what causes narrowing.
2. **Every path returns a boolean** — a validity rule the compiler enforces
   *once* you declare a predicate. This alone does nothing; adding a
   `return false` without the annotation is a no-op.

```ts
// ❌ still returns `boolean` — adding `return false` changes nothing
export function isNonEmptyIterable(someIter: any) {
  if (someIter == null) return false;
  if (Symbol.iterator in someIter) {
    const it = someIter[Symbol.iterator]();
    if (it.next().value != null) return true;
  }
  return false;
}

// ✅ the annotation is what narrows
export function isNonEmptyIterable(
  someIter: any,
): someIter is Iterable<string> {
  if (someIter == null) return false;
  if (Symbol.iterator in someIter) {
    const it = someIter[Symbol.iterator]();
    if (it.next().value != null) return true;
  }
  return false;
}
```

## Narrowing a generic value

A predicate narrows even a generic-typed value to the predicate's type:

```ts
function hash<T>(str: NonNullable<T>) {
  if (isNonEmptyIterable(str)) {
    for (const char of str) {   // str: Iterable<string>, char: string ✅
      char.charCodeAt(0);
    }
  }
}
```

## ⚠️ Caveat: a predicate is an unchecked assertion

The compiler does **not** verify that the body actually proves the predicate.
You can lie:

```ts
function isCat(x: unknown): x is Cat {
  return true; // compiler trusts you — unsound
}
```

Keep the runtime check honest, or the narrowing becomes a lie the rest of the
code base believes.

## Related forms

- **`asserts x is T`** — assertion function; throws instead of returning a
  boolean, then narrows for the rest of the scope.
- **`asserts x`** — asserts the argument is truthy.
- Built-in narrowing that needs no predicate: `typeof`, `instanceof`, `in`,
  equality checks, discriminated unions.

## Resources

- TS Handbook — Narrowing (type predicates, `asserts`):
  https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- TS Handbook — `this`-based type guards:
  https://www.typescriptlang.org/docs/handbook/2/classes.html#this-based-type-guards
- Assertion functions (3.7 release notes):
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
- `unknown` vs `any` (why guards usually take `unknown`):
  https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown
