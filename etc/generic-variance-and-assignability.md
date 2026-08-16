# Reading TypeScript Assignability Errors (Variance, and the Default You Didn't Write)

Target file: `src/data-structures/symbol-tables/hashmap.ts`

A worked decode of this error, which appeared while refactoring
`LinkedList<T>` into `LinkedList<T, Q = T>` (see
[`compare-fn-query-types.md`](./compare-fn-query-types.md)):

```
Type 'LinkedList<NodeStruct<T, V>, T>' is not assignable to type 'LinkedList<NodeStruct<T, V>, NodeStruct<T, V>>'.
  Types of property 'compareFn' are incompatible.
    Type 'CompareFn<NodeStruct<T, V>, T>' is not assignable to type 'CompareFn<NodeStruct<T, V>, NodeStruct<T, V>>'.
      Type 'NodeStruct<T, V>' is not assignable to type 'T'.
        'T' could be instantiated with an arbitrary type which could be unrelated to 'NodeStruct<T, V>'.
```

## How to read one of these at all

The indentation is a **drill-down**, not a list of separate problems. Line 1
is the assignment you wrote; each deeper line is the compiler taking one step
further into the structure to explain *why*. There is only ever one real
failure, and it is the **innermost** line.

So read bottom-up. Then, separately, look hard at line 1 — because in generic
code the *target* type is frequently something you never typed, and that is
usually where the actual mistake lives.

## Bottom-up

### Innermost — `'T' could be instantiated with an arbitrary type`

This is TypeScript's standard phrasing for **"`T` here is an unresolved type
parameter."**

Inside `class Hashmap<T, V>`, `T` is not a type. It's a placeholder a caller
will fill in later. The class body must typecheck for *every* legal
instantiation:

```ts
new Hashmap<string, number>(...)                    // T = string
new Hashmap<NodeStruct<string, number>, number>(...) // T = a NodeStruct
```

For the first, `NodeStruct<T, V>` and `T` are wildly unrelated. TypeScript
therefore refuses to assume *any* relationship between an unresolved `T` and
a type built from it. The message is a hint, not a suggestion that some
specific instantiation broke.

⚠️ The common wrong reaction is to reach for a cast. The message means "I
cannot prove this for all `T`" — and it's right, so a cast just moves the
failure to runtime.

### One level up — `'NodeStruct<T, V>' is not assignable to 'T'`

**Look at the direction.** You are assigning

```
source: CompareFn<N, T>            (what you built)
target: CompareFn<N, N>            (the slot)
```

and TypeScript reported a check of `N → T`. Backwards from the assignment.
That reversal is **parameter contravariance**, and it isn't a quirk — it's
the substitution rule:

> For `source` to stand in for `target`, `source` must accept **everything**
> `target` promised to accept.

The target type advertises "call me with a whole `NodeStruct`." Your
comparator's second parameter is `T`. It cannot honour that promise, so it
cannot substitute. Hence the check runs target-param → source-param.

Return types go the other way (**covariant**) — source must return something
the target's callers can use:

```ts
type Fn = (x: Animal) => Dog;

let f: (x: Dog) => Animal;
let g: Fn = f;  // ❌ both directions wrong
let h: (x: Animal) => Dog;
let i: Fn = h;  // ✅
```

Mnemonic: **parameters in, backwards; results out, forwards.**

### Outermost — where the bug actually is

```
target: LinkedList<NodeStruct<T, V>, NodeStruct<T, V>>
```

You never wrote that second `NodeStruct<T, V>`. The compiler supplied it,
from `Q = T` in the class declaration, because the annotation site passed
only one type argument:

```ts
_keys: LinkedList<NodeStruct<T, V>>[] = [];   // ← Q defaults to NodeStruct<T,V>
_getList(key): LinkedList<NodeStruct<T, V>> | null
```

Meaning: *"a list queried by whole structs"* — exactly the coupling the
refactor removes. Meanwhile `put()` constructs a `LinkedList<N, T>`. The
value moved; the annotations didn't.

This is the default doing its job. It exists so old annotations keep
compiling **with their old meaning** — that's what makes the change
non-breaking — which necessarily means every site that wants the *new*
behaviour has to opt in explicitly.

## The fix

Name the pairing once, so it can't drift again:

```ts
/** A bucket stores whole entries but is queried by key alone. */
type Bucket<T, V> = LinkedList<NodeStruct<T, V>, T>;

export class Hashmap<T, V> {
  _keys: Bucket<T, V>[] = [];

  _getList(key: NonNullable<T>): Bucket<T, V> | null { ... }
}
```

An alias beats repeating `LinkedList<NodeStruct<T, V>, T>` at each site for a
reason specific to defaulted parameters: **omitting an argument is silent.**
`LinkedList<NodeStruct<T, V>>` is not an arity error — it's a different type
that compiles fine and fails somewhere else later. One alias makes the
omission unrepresentable.

## Variance of `LinkedList<T, Q>`, precisely

Where a type parameter *appears* determines its variance. `Q` appears in both
positions:

| Member | Signature | `Q` position | Variance |
| --- | --- | --- | --- |
| `compareFn` | `(node: LinkNode<T>, query: Q) => boolean` | parameter | contra |
| `search` / `remove` | `(query: Q) => ...` | parameter | contra |
| `keyOf` | `(value: T) => Q` | **return** | co |

Contravariant *and* covariant ⟹ **invariant**. `LinkedList<T, Q1>` and
`LinkedList<T, Q2>` are mutually unassignable unless `Q1` and `Q2` are
identical:

```ts
declare let wide:   LinkedList<Item, string | number>;
declare let narrow: LinkedList<Item, string>;

narrow = wide;  // ❌ keyOf returns string|number, narrow's callers expect string
wide = narrow;  // ❌ compareFn takes only string, wide promises string|number
```

📌 **Correction to the earlier note.** Before `keyOf` existed, `Q` was purely
contravariant and `narrow = wide` was legal. Adding a member that *returns*
`Q` made the class invariant in `Q`. This is the ordinary tax on a bidirectional
projection, not a defect — it just means you should annotate bucket types
exactly (the `Bucket` alias) rather than expecting related instantiations to
interconvert.

TypeScript computes this structurally; you don't declare it. Since 4.7 you
*may* annotate with `in` / `out` (`class LinkedList<T, in out Q>`) — which
does not change behaviour, only documents intent and speeds up checking.

## The property-vs-method trap

This error only surfaced because `compareFn` is a **property with a function
type**:

```ts
compareFn: CompareFn<T, Q>;                                  // strict ✅
compareFn(node: LinkNode<T>, query: Q): boolean;             // bivariant ⚠️
```

Under `strictFunctionTypes`, function-*type* positions get the sound
contravariant check. **Method declarations are deliberately exempt** and stay
*bivariant* — assignable if either direction works. That exemption exists for
backwards compatibility with `Array<T>` and the DOM lib, and it is knowingly
unsound.

So had `compareFn` stayed a method, this assignment would have compiled — and
then handed a `NodeStruct` to a function expecting a key, producing
`undefined` at runtime instead of an error at build time. The property form
is doing real work here. (It's also required for another reason: you pass
`this.compareFn` as a value, and a method extracted that way loses its
receiver, so `this.eqnFn` would be `undefined`.)

## `Q = T` vs `Q = NonNullable<T>`

`Bucket<T, V> = LinkedList<NodeStruct<T, V>, T>` uses `T`, not
`NonNullable<T>`, and that's the right call:

- `eqnFn` is typed `EqnFn<T>`, so the comparator's natural probe type is `T`.
- `NonNullable<T>` is a subtype of `T`, so every `get(key: NonNullable<T>)`
  call passes a valid `T`. Assignability flows the easy way.
- Choosing `NonNullable<T>` instead would force `eqnFn` calls to narrow and
  buy nothing — the list never invents a key, it only forwards yours.

Widen at the boundary, narrow at the entry points. Here the entry points
(`get`, `put`, `delete`) already require `NonNullable<T>`.

## Debugging checklist for errors of this shape

1. **Read the last line first.** That's the only real failure.
2. **Then read the first line's *target* type.** If it contains type
   arguments you didn't write, a generic default filled them in — that's your
   bug, not the variance.
3. **Check the direction** of the innermost check. Reversed ⟹ you're inside a
   parameter position, and the substitution rule applies.
4. **"could be instantiated with an arbitrary type"** ⟹ unresolved type
   parameter. Don't cast; fix the annotation or add a constraint.
5. **Hover the value** to see what TypeScript actually inferred, and compare
   it against the annotation. Divergence between the two *is* the error.
6. **Pin type arguments explicitly** while debugging. Turning inference off
   moves the error to the line that's really wrong.

## Resources

- TS Handbook — Type Compatibility (structural typing, function
  compatibility, variance):
  https://www.typescriptlang.org/docs/handbook/type-compatibility.html
- `strictFunctionTypes` — strict vs bivariant parameter checking, and the
  method exemption:
  https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
- Strict function types (TS 2.6 release notes) — why methods stay bivariant:
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html#strict-function-types
- Optional variance annotations `in` / `out` (TS 4.7):
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#optional-variance-annotations-for-type-parameters
- Generic parameter defaults (TS 2.3) — the source of the phantom target type:
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#generic-parameter-defaults
- TS Handbook — Generics and constraints:
  https://www.typescriptlang.org/docs/handbook/2/generics.html
- TS Handbook — More on Functions (parameter/return position rules):
  https://www.typescriptlang.org/docs/handbook/2/functions.html
- `NonNullable<T>` and other utility types:
  https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype
- TypeScript FAQ — common "not assignable" questions, including unresolved
  type parameters: https://github.com/microsoft/TypeScript/wiki/FAQ
- Covariance and contravariance (background, language-agnostic):
  https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)
- Liskov substitution principle — the rule the parameter check enforces:
  https://en.wikipedia.org/wiki/Liskov_substitution_principle
- Related notes in this folder:
  [`variance-reference.md`](./variance-reference.md) (the full variance
  rules), [`compare-fn-query-types.md`](./compare-fn-query-types.md) (the
  refactor that produced this error),
  [`generics-constraint-variance.md`](./generics-constraint-variance.md)
  (the same "unresolved type parameter" message, hit from the constraint
  side), [`type-predicates.md`](./type-predicates.md)
