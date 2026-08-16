# `etc/` — Notes Glossary

Working notes for the algorithm-visualizer project: language deep-dives, code
reviews, design-option write-ups, and planning docs. Nothing here is imported
by `src/` — these are reference material.

Everything below is grouped by **what you'd reach for it**, then a suggested
reading order at the end.

---

## 🧭 Project planning

### [`arch.md`](./arch.md)
The master plan. Vision and scope for a Visualgo-style visualizer (arrays,
lists, trees, graphs, sorting, pathfinding, DP, tries, hash tables), then the
engineering design: core/rendering split, the hard rule that **algorithms
must never render directly**, five candidate patterns (Command, Observer,
Strategy, Factory, State Machine) with a recommended model, the `VisualOp` /
Algorithm / Renderer / PlaybackController interfaces, `requestAnimationFrame`
usage, seven anticipated risk areas (rewind complexity, performance, sync
bugs, animation timing, graph layout, memory, accessibility), a five-phase
roadmap, and library evaluations (XState, PixiJS, D3 force, SVG vs Canvas).
The longest doc here by far — skim the headings and dive in.

### [`todo.md`](./todo.md)
Short running task list (linked list/queue/stack/DLL/deque, array forms,
playback controller, better recording abstraction), plus a scratch snippet of
red-black `_delete` in progress.

### [`challenges.ini`](./challenges.ini)
Unrelated to the visualizer — a list of practice project ideas by difficulty
tier with time estimates.

### [`Argos.drawio.svg`](./Argos.drawio.svg)
Architecture diagram (draw.io source, opens as an image).

---

## 🔷 TypeScript language notes

### [`variance-reference.md`](./variance-reference.md) ⭐
The complete variance reference: covariance, contravariance, invariance, and
TypeScript's deliberately-unsound bivariance. The position rule for reading
variance off any declaration, the double-negation flip for nested callback
parameters, why `readonly` buys covariance, the property-vs-method
`strictFunctionTypes` trap, TS 4.7 `in`/`out` annotations, a quick-reference
table for built-ins and this repo's own types, and PECS-style design
guidance.

### [`generic-variance-and-assignability.md`](./generic-variance-and-assignability.md)
How to *read* a TypeScript assignability error. Decodes one real error
bottom-up: what `'T' could be instantiated with an arbitrary type` actually
means, why the reported direction is reversed, and how a generic **default**
(`Q = T`) silently produced a target type you never wrote. Ends with a
six-step debugging checklist. Companion to `variance-reference.md`.

### [`generics-constraint-variance.md`](./generics-constraint-variance.md)
Why `T extends string | number | null` does **not** make `TArray<null>`
assignable to `TArray<T>`. The same unresolved-type-parameter rule, met from
the constraint side rather than the variance side.

### [`generics.md`](./generics.md)
Raw scratch notes on generic classes and functions — field declarations,
`super`, generic identity functions. Unpolished.

### [`type-predicates.md`](./type-predicates.md)
User-defined type guards. The `x is T` annotation is what narrows — not the
returned value; the two-part validity rule; narrowing generic values; the
caveat that a predicate is an *unchecked assertion* you can lie in; and
`asserts x is T`.

### [`declaration-merging.md`](./declaration-merging.md)
Declaring the same name twice merges instead of erroring — interface+interface,
namespace merging, module augmentation. How to extend types you don't own.

---

## 🗺️ Symbol tables & hashing

### [`compare-fn-query-types.md`](./compare-fn-query-types.md) ⭐
The `LinkedList<T, Q = T>` refactor. `compareFn` welded the query type to the
element type, forcing `Hashmap.delete` to fabricate a dummy `{key, value}`
struct (and burn extra traversals) just to search. Splits the two roles, adds
a `keyOf` projection so `update(value)` keeps its signature, and includes a
deep dive on **generic parameter defaults** — how `Q = T` resolves, why it
makes the change non-breaking, and why the default implementation needs
`as unknown as Q`. Prior art: C++ transparent comparators, Rust's `Borrow`.

### [`hashmap-key-strategies.md`](./hashmap-key-strategies.md) ⭐
How to let `Hashmap<K, V>` accept keys that aren't strings — the full design
menu with trade-offs and how real languages land. Opens with the rule that
governs all of them: **the hash-equals contract** (equal keys must hash
equally), and why `===` on object keys is a bug factory. Recommends injecting
one hash function per instantiation (Strategy), since a generic map is
monomorphic per instance and needs no `typeof` dispatch. Read alongside
`compare-fn-query-types.md` — same class, the equality half of the story.

### [`binary-search-tree-review.md`](./binary-search-tree-review.md)
Review of `BinarySearchTree.ts` with confirmed reproductions: `floor()` /
`ceiling()` returning the search key itself instead of a key from the tree,
and `keys()` / `traverse()` broken for the no-argument call.

### [`ordered-symbol-table-test-options.md`](./ordered-symbol-table-test-options.md)
Setting up testing for `OrderedSymbolTable.ts` from scratch — Vitest vs Jest
vs `node:test` compared with docs links, plus the pre-work of removing
module-level side effects that fire on every import.

---

## 📚 Data-structure reviews

### [`priority-queue-review.md`](./priority-queue-review.md)
Pass over `TArray`, `PriorityQueue`, and `IndexedPriorityQueue`, grouped by
theme: type abstraction (`TArray`'s index signature lying about `null`),
method overriding, inheritance vs composition, and concrete bugs.

### [`indexed-pq-init-order.md`](./indexed-pq-init-order.md)
A field-initialization-order bug: `itemHeapPos` is `undefined` during
construction because subclass field initializers run *after* `super()`, which
itself calls `insert()`.

### [`findings.md`](./findings.md)
The catch-all log — twelve independent findings. Optional chaining can't be
an assignment target; ESM needing file extensions; circular references from
BST parent pointers; a non-recursive `_traverseTree`; refactoring `_traverse`
with factories and closures; `this` being `undefined` in a callback; `Proxy`
`get` traps receiving Symbol keys; making objects subscriptable; JS arrays
having no out-of-bounds error; sequential pointer reassignment in list
reversal; DFS exit times equalling entry times (primitive passed by value);
and `forEach` value-as-index silently extending an array.

---

## ⚙️ Patterns & architecture deep-dives

### [`ops-design-patterns.md`](./ops-design-patterns.md)
Where should `VisualOp` collection live so every future data structure isn't
duplicating it? Compares mixins, inheritance, composition, and decorators.

### [`generator-refactor.md`](./generator-refactor.md)
Untangling algorithm logic from op emission by making each operation a
generator that yields ops, driven by a `runAndRecord` wrapper. Lets algorithms
be tested without instantiating a full DS.

### [`factory-patterns.md`](./factory-patterns.md)
Factory patterns, plus validating that a `userList` is a **non-empty**
iterable — the `Symbol.iterator` protocol check and why protocol presence
isn't emptiness. Pairs with `type-predicates.md`.

### [`store-patterns.md`](./store-patterns.md)
Global state options, starting from the module-singleton `Map` and why the
module cache guarantees one shared instance across ESM, CommonJS, and Vite.

---

## 🌐 JavaScript / runtime / browser

### [`foreach-async-pitfall.md`](./foreach-async-pitfall.md)
`forEach` discards the promise an `async` callback returns, so execution
continues before anything resolves. Shown via the simplified polyfill, with
the `for...of` fix.

### [`abort-error-root-cause.md`](./abort-error-root-cause.md)
Why `Animation.finished` rejects with `AbortError` — explicit `cancel()`,
element removal from the DOM, or document unload — traced to the actual call
site.

### [`scope.js`](./scope.js)
The classic `var`-in-a-loop-with-`setTimeout` closure trap, with `let` and
IIFE fixes.

### [`generators.js`](./generators.js)
Generator-function basics: pausing at `yield`, the iterator protocol, a
`makeRangeIterator` example.

### [`object.js`](./object.js)
Prototypal inheritance with `Object.create` and how `this` resolves through
the chain.

### [`before-after.md`](./before-after.md)
CSS pseudo-elements: `content` is mandatory, they're inline by default, and
they can't attach to void elements.

---

## 🧪 Node.js tooling

### [`node-assert.md`](./node-assert.md)
The built-in `node:assert/strict` module — core methods and why to prefer
strict over the legacy loose-equality import.

### [`node-readline.md`](./node-readline.md)
Interactive terminal input via `node:readline/promises` — the one-shot
`question()` pattern and the continuous-loop pattern, including the
must-`close()`-or-hang gotcha.

---

## 🎨 UI / animation

### [`swap-animation-options.md`](./swap-animation-options.md)
Three approaches to smoothing the abrupt `swapArray` transition, starting with
a `translateX` slide where the two slots physically cross.

---

# Reading order

## If you're new to the project
1. [`arch.md`](./arch.md) — the vision and the architectural rules,
   especially "DO NOT let algorithms render directly."
2. [`ops-design-patterns.md`](./ops-design-patterns.md) — how operations get
   recorded, the decision every DS depends on.
3. [`generator-refactor.md`](./generator-refactor.md) — where that recording
   is heading.
4. [`store-patterns.md`](./store-patterns.md) — how shared state works.
5. [`todo.md`](./todo.md) — what's next.

## The variance / generics track ⭐
Read in this order; each assumes the one before it.
1. [`generics.md`](./generics.md) — scratch basics, skip if comfortable.
2. [`type-predicates.md`](./type-predicates.md) — narrowing, the gentlest
   entry into TS's type-level machinery.
3. [`variance-reference.md`](./variance-reference.md) — the theory: the four
   variances and the position rule.
4. [`generics-constraint-variance.md`](./generics-constraint-variance.md) —
   first encounter with unresolved type parameters, via constraints.
5. [`generic-variance-and-assignability.md`](./generic-variance-and-assignability.md) —
   the same rule met through a real error message, and how to read one.
6. [`compare-fn-query-types.md`](./compare-fn-query-types.md) — the refactor
   that all of the above was in service of. Generic defaults in depth.
7. [`hashmap-key-strategies.md`](./hashmap-key-strategies.md) — the equality
   half of the same class: the hash-equals contract and injecting `hashFn`.
8. [`declaration-merging.md`](./declaration-merging.md) — independent, read
   whenever.

## Debugging a specific data structure
Go straight to the review: [`priority-queue-review.md`](./priority-queue-review.md),
[`indexed-pq-init-order.md`](./indexed-pq-init-order.md),
[`binary-search-tree-review.md`](./binary-search-tree-review.md),
[`hashmap-key-strategies.md`](./hashmap-key-strategies.md). Then search
[`findings.md`](./findings.md) — it's the index of everything that has bitten
this codebase before.

## Setting up tests
[`ordered-symbol-table-test-options.md`](./ordered-symbol-table-test-options.md)
→ [`node-assert.md`](./node-assert.md).

## Chasing a JS runtime oddity
[`findings.md`](./findings.md) first, then the focused notes:
[`foreach-async-pitfall.md`](./foreach-async-pitfall.md),
[`abort-error-root-cause.md`](./abort-error-root-cause.md),
[`scope.js`](./scope.js), [`generators.js`](./generators.js),
[`object.js`](./object.js).

---

## Conventions

- Notes named `*-review.md` are findings against a specific source file, with
  the target path stated at the top.
- Notes named `*-options.md` / `*-patterns.md` compare approaches and end with
  a recommendation.
- Everything else is a topic explainer, with a `## Resources` section of
  external links at the bottom.
- New notes go in this folder, not next to the source file — and get a line
  here.
