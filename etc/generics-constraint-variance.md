# Why `T extends A | B | null` doesn't make `null` assignable to `T`

## The confusion

```ts
class PriorityQueue<T extends string | number | null> {
  array: TArray<T>;
  constructor() {
    this.array = new TArray([null]); // Type 'TArray<null>' is not assignable to 'TArray<T>'
  }
}
```

It looks like this should work: `null` is one of the types in `T`'s constraint,
so surely a `TArray<null>` fits inside `TArray<T>`? It doesn't, and the reason
has nothing to do with the constraint being "wrong" — it's how generic type
parameters work in TypeScript (and in most nominally-checked generic systems).

## Constraint = upper bound for reading, not a lower bound for writing

`T extends string | number | null` tells the compiler: "whatever concrete
type `T` ends up being, it will be no wider than `string | number | null`."
That's a fact you can rely on when you *read* a `T` — e.g. you know you can
safely check `typeof value === "string"` on it.

It does **not** tell the compiler that every member of the constraint
(`string`, `number`, `null`) is itself assignable *to* `T`. `T` is a stand-in
for **one specific, unknown, narrower type**, chosen by the caller.

## The call-site instantiation is the crux

```ts
const pq = new PriorityQueue<number>(20);
```

At this call site, `T` is resolved to `number`. Now walk through the generic
class body with `T = number` substituted in:

```ts
array: TArray<number>;
constructor() {
  this.array = new TArray([null]); // trying to put `TArray<null>` into `TArray<number>`
}
```

`null` is obviously not assignable to `number`. TypeScript has to typecheck
the generic class body in a way that's valid for *every* legal instantiation
of `T` — not just the widest one (`string | number | null`) you might have
been picturing. Since `T` could be instantiated as `number`, or `string`, or
`null`, or any narrower literal type within the constraint, and `null` is not
assignable to all of those, the assignment is rejected generically.

This is the same reason this simpler example fails:

```ts
function fill<T extends string | number | null>(): T {
  return null; // Error: Type 'null' is not assignable to type 'T'.
}
```

Even though `null` satisfies the constraint, it's not assignable to the
*specific* `T` the caller asked for.

## The actual fix

The constraint isn't the problem — the type of the field is. If a field
genuinely needs to hold either a real `T` value *or* a `null` sentinel, its
type should say so explicitly:

```ts
array: TArray<T | null>;
```

`T | null` is a concrete type that always includes `null`, regardless of
what `T` is instantiated to. That's different from `T` alone, which may or
may not include `null` depending on the caller.

Rule of thumb: if you find yourself trying to assign a constraint member
into a bare `T`, the field or return type almost always needs to be widened
to include that member explicitly (`T | null`, `T | undefined`, etc.) rather
than relying on the constraint to do it implicitly.

## Resources

- TypeScript Handbook — [Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- TypeScript Handbook — [Working with Generic Type Variables](https://www.typescriptlang.org/docs/handbook/2/generics.html#working-with-generic-type-variables)
- TypeScript FAQ — [Why can't I assign a value of a generic constraint's type to a generic-typed variable?](https://github.com/microsoft/TypeScript/wiki/FAQ#why-doesnt-this-work-when-passing-in-only-primitive-types)
- Related GitHub issue with deeper discussion: [microsoft/TypeScript#43102](https://github.com/microsoft/TypeScript/issues/43102) — "Generic not narrowed when returning constrained type member"
