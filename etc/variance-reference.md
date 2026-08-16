# Variance in TypeScript — The Complete Reference

Variance answers exactly one question:

> Given that `Dog` is a subtype of `Animal`, what is the relationship between
> `Box<Dog>` and `Box<Animal>`?

There are four possible answers, and TypeScript uses all four — including one
that is deliberately unsound.

## The four kinds

Using `Sub <: Super` for "Sub is assignable to Super":

| Kind | Definition | Reading | Example |
| --- | --- | --- | --- |
| **Covariant** | `Box<Sub> <: Box<Super>` | preserves direction | `Iterable<Dog> <: Iterable<Animal>` |
| **Contravariant** | `Box<Super> <: Box<Sub>` | reverses direction | `(x: Animal) => void <: (x: Dog) => void` |
| **Invariant** | neither | no relationship | `LinkedList<T, Q>` in `Q` |
| **Bivariant** | both | either direction works | method parameters (unsound) |

Mnemonics: **co** = *with*, **contra** = *against*, **in** = *neither*,
**bi** = *both*.

## The position rule

You don't memorise variance per type — you *read it off* the declaration.
Every occurrence of a type parameter sits in either an **output position**
(the type produces values of `T`) or an **input position** (it consumes them).

```ts
interface Box<T> {
  produce(): T;              // output → covariant
  consume(value: T): void;   // input  → contravariant
  both: T;                   // mutable property = read + write → invariant
}
```

Combine every occurrence:

- output only ⟹ **covariant**
- input only ⟹ **contravariant**
- both ⟹ **invariant**

Why this is a rule and not a convention: it's the substitution principle. If
`Box<Dog>` may stand in for `Box<Animal>`, then everything `Box<Animal>`
promised must still hold. It promised to *give you* an `Animal` — a `Dog` is
one, fine. It also promised to *accept* any `Animal` — but `Box<Dog>` only
accepts dogs. Producing is safe to narrow; consuming is not.

---

## 1. Covariance — producers

`T` appears only in outputs.

```ts
type KeyFn<T, Q> = (value: T) => Q;   // Q is covariant
```

Your `keyOf` is covariant in `Q`: it only ever hands a `Q` out. A projection
returning `string` is usable anywhere one returning `string | number` is
expected.

Covariant built-ins:

```ts
Iterable<T>, IterableIterator<T>, Promise<T>, ReadonlyArray<T>,
ReadonlySet<T>, Generator<T>, () => T
```

```ts
const dogs: readonly Dog[] = [];
const animals: readonly Animal[] = dogs;  // ✅ safe — nothing can be written
```

`readonly` is what makes this sound. Remove it and the write path reappears:

```ts
const dogs: Dog[] = [];
const animals: Animal[] = dogs;  // ✅ TS allows it — but see §4, this is unsound
animals.push(new Cat());         // 💥 dogs now contains a Cat
```

## 2. Contravariance — consumers

`T` appears only in inputs. This is the one that feels backwards.

```ts
type CompareFn<T, Q> = (node: LinkNode<T>, query: Q) => boolean;
type HashFn<K>       = (a: K, M: number) => number;
type EqnFn<K>        = (a: K, b: K) => number;
```

All three are contravariant in their query/key parameter. Concretely:

```ts
declare const hashAny: HashFn<string | number>;
declare const hashStr: HashFn<string>;

let h: HashFn<string> = hashAny;  // ✅ handles more than required
let g: HashFn<string | number> = hashStr;  // ❌ can't handle numbers
```

A function that accepts *more* is a valid substitute for one that accepts
less. This is why the error in
[`generic-variance-and-assignability.md`](./generic-variance-and-assignability.md)
reported `NodeStruct<T,V> → T` when you were assigning in the other direction.

### ⚠️ Double contravariance flips back to covariant

Nesting a parameter *inside* a parameter negates twice:

```ts
type Handler<T> = (callback: (value: T) => void) => void;
//                            ^^^^^^^^^^^^^^^^ T is contra here,
//                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^ and this whole fn is contra
//                 ⟹ T ends up COVARIANT
```

```ts
declare let hAnimal: Handler<Animal>;
declare let hDog: Handler<Dog>;
hAnimal = hDog;  // ✅ covariant
```

Count the parameter nestings: even ⟹ covariant, odd ⟹ contravariant. This
catches people out with callback-heavy APIs (`forEach`, event emitters,
middleware).

## 3. Invariance — both

`T` appears in inputs *and* outputs, so neither direction is safe.

```ts
Array<T>, Set<T>, Map<K, V>, LinkNode<T> (mutable `value`)
```

Your `LinkedList<T, Q>` is invariant in `Q` because the refactor put `Q` on
both sides:

| Member | `Q` position | Variance |
| --- | --- | --- |
| `compareFn: (node, query: Q) => boolean` | input | contra |
| `search(query: Q)` / `remove(query: Q)` | input | contra |
| `keyOf: (value: T) => Q` | **output** | co |

⟹ invariant. Before `keyOf` existed it was purely contravariant. Adding a
member that *returns* `Q` is what closed the other direction.

`Hashmap<T, V>` is invariant in both parameters, for the same reason:

```ts
put(key: NonNullable<T>, value: NonNullable<V>): void      // T in, V in
get(key: NonNullable<T>): NonNullable<V> | null            // T in, V out
```

Invariance isn't a bug — it's the correct answer for a mutable container. The
practical consequence is that you must annotate exactly (hence
`type Bucket<T, V> = LinkedList<NodeStruct<T, V>, T>`) rather than relying on
related instantiations to interconvert.

## 4. Bivariance — TypeScript's deliberate unsoundness

Assignable in *both* directions, even though only one is safe. TypeScript
applies this in two places:

### Method parameters

```ts
interface A { fn: (x: Dog) => void }   // property  → contravariant, strict
interface B { fn(x: Dog): void }       // method    → BIVARIANT
```

Under `strictFunctionTypes`, function-*type* positions get the sound
contravariant check. **Method declarations are explicitly exempt.** From the
TS 2.6 release notes: the exemption exists so `Array<T>` and the DOM lib keep
working — `Array<Dog>` must remain assignable to `Array<Animal>` in practice,
and that requires `push(x: T)` to check bivariantly.

This is why `compareFn` being a **property** matters in `LinkedList`. As a
method, the mismatched query type would have compiled and blown up at
runtime.

### `strictFunctionTypes` scope

```jsonc
// tsconfig.json — implied by "strict": true
{ "strictFunctionTypes": true }
```

⚠️ It only affects *function type* comparisons. It never makes methods
strict, and it does not apply to constructor parameters or `any`.

## Determining variance for any type

Mechanically:

1. Find every occurrence of the parameter.
2. Label each: output (return type, readonly property, getter) or input
   (parameter, setter).
3. A mutable property is both.
4. Count nested parameter positions — each nesting flips the sign.
5. Combine: all-out ⟹ co, all-in ⟹ contra, mixed ⟹ invariant.

Applied to your `LinkNode<T>`:

```ts
export class LinkNode<T> {
  value: T;                    // mutable property → invariant
  next: LinkNode<T> | null;
  constructor(value: T, ...)   // constructor params don't affect it
}
```

⟹ **invariant in `T`**. (TypeScript's structural check may still let some
`LinkNode<Dog>` → `LinkNode<Animal>` assignments through in practice, since
it compares members rather than consulting a declared variance — see below.)

## How TypeScript actually decides

TypeScript uses **structural typing** with **inferred, use-site variance**.
It does not require declarations, and it computes variance per type parameter
as an optimisation for recursive generics — falling back to full structural
comparison when the fast path is inconclusive.

Consequences worth knowing:

- Variance is a property of the *shape*, not of a keyword you wrote. Adding a
  member can silently change it (as `keyOf` did).
- Two structurally identical types are interchangeable regardless of name or
  declaration site.
- `any` short-circuits every check in both directions.
- `never` is the bottom type (assignable to everything) and `unknown` the top
  (everything is assignable to it), so `(x: never) => unknown` is the most
  general function type and `(x: unknown) => never` the least.

### Optional variance annotations (TS 4.7+)

```ts
class LinkedList<T, in out Q> { ... }   // documents invariance in Q
interface Producer<out T> { get(): T }
interface Consumer<in T> { accept(x: T): void }
```

These **do not change behaviour**. They document intent and let the compiler
skip work on large recursive types — and TS will error if the annotation
contradicts the computed variance, which makes them a useful assertion. This
differs fundamentally from Kotlin/Scala/C#, where `in`/`out` are
*declaration-site* and genuinely constrain what you may write.

## Quick reference — common types

| Type | Variance |
| --- | --- |
| `readonly T[]`, `ReadonlyArray<T>` | covariant |
| `T[]`, `Array<T>` | covariant *(unsound — bivariant methods)* |
| `Promise<T>`, `Iterable<T>`, `Generator<T>` | covariant in `T` |
| `() => T` | covariant |
| `(x: T) => void` | contravariant |
| `(x: T) => T` | invariant |
| `(cb: (x: T) => void) => void` | covariant (double flip) |
| `Set<T>`, `Map<K, V>` | invariant |
| `{ value: T }` | invariant |
| `{ readonly value: T }` | covariant |
| `LinkNode<T>` | invariant |
| `CompareFn<T, Q>`, `HashFn<K>`, `EqnFn<K>` | contravariant |
| `KeyFn<T, Q>` | contra in `T`, co in `Q` |
| `LinkedList<T, Q>` | invariant in both |
| `Hashmap<T, V>` | invariant in both |

## Design guidance

- **Prefer producers.** A type that only hands values out is covariant, which
  is the most flexible and the most intuitive. `readonly` is the cheapest way
  to buy covariance.
- **Accept the widest input you can.** Contravariance means a function taking
  `Animal` is usable wherever one taking `Dog` is expected — free
  generality.
- **Expect mutable containers to be invariant.** Don't fight it; name the
  instantiation with an alias instead.
- **Use properties, not methods, for injected callbacks.** You get the sound
  check *and* correct `this` binding.
- **Java's PECS is the same rule**: *Producer Extends, Consumer Super*.
  Producers are covariant, consumers contravariant. Different syntax,
  identical logic.

## Resources

- TS Handbook — Type Compatibility (function compatibility, structural
  typing): https://www.typescriptlang.org/docs/handbook/type-compatibility.html
- `strictFunctionTypes`: https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
- Strict function types, and why methods stay bivariant (TS 2.6):
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html#strict-function-types
- Optional variance annotations `in` / `out` (TS 4.7):
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#optional-variance-annotations-for-type-parameters
- TS Handbook — More on Functions (parameter and return position rules):
  https://www.typescriptlang.org/docs/handbook/2/functions.html
- TS Handbook — `readonly` properties:
  https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties
- `Readonly<T>` / `ReadonlyArray<T>` utility types:
  https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype
- TypeScript FAQ — "why are function parameters bivariant?" and friends:
  https://github.com/microsoft/TypeScript/wiki/FAQ
- Covariance and contravariance — language-agnostic background:
  https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)
- Liskov substitution principle — the rule underneath all of it:
  https://en.wikipedia.org/wiki/Liskov_substitution_principle
- Java generics and subtyping (PECS, wildcards):
  https://docs.oracle.com/javase/tutorial/java/generics/subtyping.html
- Kotlin declaration-site variance — contrast with TS's inferred variance:
  https://kotlinlang.org/docs/generics.html
- C# covariance and contravariance in generics:
  https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/
- Related notes in this folder:
  [`generic-variance-and-assignability.md`](./generic-variance-and-assignability.md)
  (a worked error decode), [`generics-constraint-variance.md`](./generics-constraint-variance.md)
  (why a constraint doesn't make `TArray<null>` fit `TArray<T>`),
  [`compare-fn-query-types.md`](./compare-fn-query-types.md),
  [`generics.md`](./generics.md), [`type-predicates.md`](./type-predicates.md)
