# Review of uncommitted work

Covers everything in the working tree that is not yet committed:

```
M src/algorithms/graphs/PrimMST.test.ts
M src/algorithms/graphs/PrimMST.ts
M src/data-structures/Base.ts
M src/data-structures/arrays/Array.ts
M src/data-structures/linked-lists/LinkedLists.ts
M src/data-structures/priority-queues/IndexedPriorityQueue.ts
M src/data-structures/priority-queues/PriorityQueue.ts
```

Companion to `etc/indexed-pq-layouts.md` (design rationale) and `etc/priority-queue-review.md`
(the earlier pass, most of whose findings are now addressed).

---

## 0. Verification method

Everything marked **VERIFIED** below was reproduced, not inferred:

| check | result |
|---|---|
| `npx vitest run` | **113 passed / 113** |
| randomised PQ drain (300 trials, n∈[2,42], min-heap) | **240 / 300 produced wrong order** |
| `npx tsc --noEmit` on working tree | 11 errors |
| `npx tsc --noEmit` on `HEAD` (via `git stash`) | 10 errors |

> **The headline: the test suite is green and the priority queue is broken.**
> `PrimMST` passing tinyEWG *and* mediumEWG is not evidence the heap works — it's two data
> points against a structure that fails 80% of randomised drains. See §1.1.

---

## 1. `PriorityQueue.ts`

### 1.1 `_bubbleDown` is not a heap sink — CRITICAL, VERIFIED

```ts
let selectedChildIdx = leftChildIdx;
for (let childIdx = leftChildIdx; childIdx <= rightChildIdx; childIdx++) {
  const childValue = this.array[childIdx];
  if (childValue == null) continue;

  if (this._isLess(parentIdx, childIdx)) {
    this.swap(parentIdx, childIdx);
    selectedChildIdx = childIdx;
  }
}
return this._bubbleDown(selectedChildIdx);
```

Four separate defects in nine lines.

**(a) It can swap twice at one level.** If the parent loses to both children, it swaps with the
left child, and then the *new* occupant of the parent slot is compared against the right child and
swaps again. A sink performs exactly one swap per level.

**(b) After a double swap it recurses into the wrong subtree.** This is the correctness break. The
value that must keep sinking is the original parent. After swapping left-then-right, that value is
sitting at `leftChildIdx` — but `selectedChildIdx` is `rightChildIdx`, so the recursion descends
somewhere else and the original parent is abandoned mid-sink.

Verified trace, min-heap, capacity 32:

```
start          : . 1 8 3 9 10
delTop -> 1    : . 3 10 8 9 _
```

Step by step, after `1` is removed and `10` is moved to the root (`. 10 8 3 9`):

```
childIdx=2:  _isLess(1,2)  10 vs 8  → swap  → . 8 10 3 9    selected=2
childIdx=3:  _isLess(1,3)   8 vs 3  → swap  → . 3 10 8 9    selected=3
recurse into 3 ────────────────────────────────┘
             but 10 is at index 2, and its child at index 4 is 9
```

Final heap `. 3 10 8 9`: index 2 holds `10`, its child at index 4 holds `9`. **Parent greater than
child in a min-heap.** The root happens to be correct, which is why small graphs still produce the
right answer.

**(c) Recursion is unconditional.** Even when nothing swapped, it calls
`_bubbleDown(leftChildIdx)`. Every sink walks to the bottom of the tree.

**(d) The terminating guard reads capacity, not element count.** `parentIdx >= this.size`, and
`size` is `array.length` — the *allocated* length (§1.3). With `max = 4096` the recursion runs ~12
levels past the end of the data on every call, doing `_isLess` on empty slots.

**Fix** — pick the better child, swap once, recurse only if you swapped:

```ts
private _bubbleDown(parentIdx: number | null): void {
  if (parentIdx == null) return;

  const lastIdx = this.array.validLen - 1;
  const left = this.getLeftChildIdx(parentIdx);
  const right = this.getRightChildIdx(parentIdx);

  let best = parentIdx;
  if (left  <= lastIdx && this.array[left]  != null && this._isLess(best, left))  best = left;
  if (right <= lastIdx && this.array[right] != null && this._isLess(best, right)) best = right;

  if (best === parentIdx) return;

  this.swap(parentIdx, best);
  this._bubbleDown(best);
}
```

`_isLess(a, b)` returns "a should sit below b", so `_isLess(best, child)` correctly promotes the
child to `best`. Comparing `best` (not `parentIdx`) against the right child is what selects the
better of the two children in a single pass.

### 1.2 `_delete` sinks but never swims — LATENT

```ts
_delete(idx: number): void {
  const heapIdx = this.array.validLen - 1;
  this.swap(idx, heapIdx);
  const value = this.array.delete(heapIdx);
  this.onDelete({ heapIdx, value });
  this._bubbleDown(idx);        // ← sink only
}
```

The element promoted from the tail into position `idx` can be *better* than `idx`'s parent, in
which case it must swim, not sink. Sedgewick's `delete(i)` is `exch(i, n--); swim(i); sink(i);`.

Harmless **today** because the only caller is `delTop()` with `idx = 1`, where there is no parent.
It becomes a live bug the moment `IndexedPriorityQueue` grows a `delete(key)` (§2.6) — which is one
of the two operations an indexed PQ exists to provide. Note `update()` already does both correctly,
which makes the inconsistency easy to miss.

### 1.3 `size` means capacity — API TRAP

```ts
get size(): number { return this.array.length; }   // TArray.length === arr.length
```

`array.length` is the *allocated* length, not the element count. Every reader of `.size` reasonably
expects the latter. Two consequences already in the tree:

- `_bubbleDown`'s guard is inert (§1.1d).
- `IndexedPriorityQueue` sizes `qp` and `keys` from `this.size` (§2.5) and genuinely wants
  capacity — so both meanings are live in the codebase simultaneously.

**Fix:** `get capacity()` for the allocated length, `get size()` returning `validLen - 1` (minus the
index-0 sentinel). Audit both call sites when renaming.

### 1.4 `delTop()` on an empty queue — MINOR

```ts
delTop(): T | null {
  const max = this.array[1];
  this._delete(1);
  return max;
}
```

No emptiness guard. On an empty queue this reads `undefined` and still runs a delete, where
`validLen - 1` is `0` and it swaps/deletes the sentinel. Add `if (this.isEmpty) return null;`.
The local is also still named `max` on a class that is now min-or-max.

### 1.5 `_isLess` is misnamed, and the comment says so — CLARITY

```ts
// when bubbling down, for max: is left less, for min: is left greater. then switch
_isLess(left: number, right: number): boolean {
  ...
  return this.isMin ? dir === 1 : dir === -1;
}
```

A comment that has to explain that a predicate named `_isLess` sometimes means "is greater" is the
abstraction telling you its name is wrong. The predicate actually answers **"should the element at
`left` sit below the element at `right`?"**. Name it `_shouldSinkBelow(a, b)` or `_beats(a, b)` and
the `isMin ? dir === 1 : dir === -1` double-negative disappears from the reader's head.

Also: the parameters are called `left`/`right` (positional siblings) but callers pass
`(parentIdx, childIdx)` — a vertical relationship. Rename to `(a, b)`.

### 1.6 `isMin` should be comparator inversion, not a flag — DESIGN

Already argued in `etc/indexed-pq-layouts.md` §10. `isMin` is `(a, b) => compare(b, a)`. Keeping it
as a boolean puts a branch in the hottest method in the class and creates a state where `isMin` and
`valueOf` can disagree. Folding it in also removes the `isMin`/`_isLess` naming problem in §1.5.

### 1.7 Six positional constructor parameters, four of them optional — DESIGN

```ts
constructor(max?, isMin = false, valueOf?, onDelete?, onInsert?, onSwap?)
```

`IndexedPriorityQueue` already has to write a placeholder hole:

```ts
this.pq = new PriorityQueue(max, isMin, this.valueOf, this.onDelete, undefined, this.onSwap);
//                                                                   ^^^^^^^^^
```

That `undefined` is the signature telling you it has outgrown positional arguments. Move to an
options object — it also makes the parameter list self-documenting at every call site and lets you
add hooks without renumbering.

```ts
constructor(opts: {
  capacity?: number;
  compare: (a: T, b: T) => number;
  onInsert?: HeapHook<T>;
  onDelete?: HeapHook<T>;
  onSwap?: (e: { left: number; right: number }) => void;
})
```

### 1.8 `OnDelete` and `OnInsert` are structurally identical — REDUNDANCY

```ts
export interface OnDelete { (_meta: { heapIdx: number; value: Comparable }): void; }
export interface OnInsert { (_meta: { heapIdx: number; value: Comparable }): void; }
```

Two names, one type. TypeScript is structural, so they are already interchangeable — the
duplication buys nothing and will drift. Collapse:

```ts
export type HeapEvent<T> = { heapIdx: number; value: T | null };
export type HeapHook<T> = (event: HeapEvent<T>) => void;
```

### 1.9 Hook payloads throw away the generic — TYPE ABSTRACTION

The class is `PriorityQueue<T extends Comparable>`, but the hooks declare `value: Comparable`. So a
`PriorityQueue<number>` hands its callbacks a `string | number | null`, and
`IndexedPriorityQueue` has to launder it back:

```ts
onDelete: OnDelete = ({ value }): void => {
  if (value == null) return;
  this.qp.update(Number(value), null);      // Number() on something already known to be a number
  this.keys.update(Number(value), null);
};
```

Parameterise the hooks (`HeapHook<T>` above) and the `Number()` calls and the null-guard-as-type-
narrowing both disappear.

### 1.10 Leading-underscore members are public — ENCAPSULATION

This changeset correctly privatised `_bubbleUp`, `_bubbleDown`, and `swap`. Still public:

| member | should be |
|---|---|
| `_isLess` | `private` |
| `_valueOf` | `private` |
| `getParentIdx` / `getLeftChildIdx` / `getRightChildIdx` | `private static` (they're pure index math) |
| `_delete` | deliberate API — rename `delete(idx)` |
| `update` | deliberate API — see §1.11 |

The `_` prefix is a convention saying "this is internal"; the language has a keyword for that now
that the file is TypeScript.

### 1.11 `update(idx, value)` is two operations wearing one name — DESIGN

```ts
update(idx: number, value: T): void {
  this.array.update(idx, value);
  this._bubbleDown(idx);
  this._bubbleUp(idx);
}
```

`IndexedPriorityQueue.update` calls it as `this.pq.update(idx, key)` — writing the key back into a
slot that already contains that key. The write is a no-op; the only thing wanted is "the priority
at `idx` changed, restore the invariant."

Split it:

```ts
update(idx: number, value: T): void { this.array.update(idx, value); this.reheapify(idx); }
reheapify(idx: number): void { this._bubbleDown(idx); this._bubbleUp(idx); }
```

Under Layout C (`etc/indexed-pq-layouts.md` §6) `reheapify` is the *only* one the IPQ needs, because
the priority lives outside the queue entirely.

### 1.12 `insertBulk` — MINOR

```ts
insertBulk(entries: TArray<T>) {
  for (const value of entries) {
    if (value) this.insert(value);
  }
}
```

- Typed to `TArray<T>` for no reason; `Iterable<T>` accepts `TArray`, plain arrays, `Set`, and
  generators.
- `if (value)` silently drops `0` and `""` — both legal `Comparable` values. Use `value != null`.
- Repeated `insert` is `O(n log n)`; bottom-up heapify is `O(n)`. Worth a comment even if you keep
  the simple version, since the method's whole reason to exist is bulk efficiency.

### 1.13 Missing `peek` — MINOR

Every consumer of a PQ wants to look without removing, and `delTop` already contains the read.
`peek(): T | null { return this.isEmpty ? null : this.array[1]; }`

### 1.14 `_bubbleUp`'s falsy-zero guard — MINOR

```ts
if (!parentIdx) return childIdx;
```

Relies on `getParentIdx(1) === 0` being falsy. Correct, but it's the same pattern that caused real
bugs elsewhere in this codebase (`etc/priority-queue-review.md` §4 bug #3). `if (parentIdx < 1)`
states the actual condition.

### 1.15 `let heapIdx` in `insert` is never reassigned — NIT

`const`.

---

## 2. `IndexedPriorityQueue.ts`

The move to injected hooks is the right call and resolves the orphaned-override bug from the
previous session. `onSwap` is correct — `PriorityQueue.swap` mutates the array *before* firing the
hook, so `_valueOf(left)` returns the new occupant and `qp[newOccupant] = left` is the right write.
Remaining issues:

### 2.1 `keys` duplicates `PrimMST.dist` — ARCHITECTURE

```ts
// PrimMST._addEdges
this.pq.insert(other, edge.weight);   // → IPQ.keys[other] = weight
this.dist[other] = edge.weight;       // → identical number, second home
...
this.pq.update(other, edge.weight);
this.dist[other] = edge.weight;       // → hand-synced again
```

Two arrays holding the same values, kept in step manually in four places. This is exactly the
Layout B/C tension documented in `etc/indexed-pq-layouts.md` §5–6. Pick one:

- **Layout C** — delete `IPQ.keys`, pass `compare: (u, v) => dist[u] - dist[v]`. The client owns the
  priority; the queue owns the ordering. Fewest moving parts for graph algorithms.
- **Keep `keys`** — delete `PrimMST.dist` and expose `pq.priorityOf(key)`.

Either is fine. Both is a defect waiting for the two to disagree.

### 2.2 The `V extends Comparable` generic is unused — DEAD CODE

```ts
export class IndexedPriorityQueue<V extends Comparable> {
```

`V` appears nowhere in the body — every priority is hardcoded `number`. `PrimMST` declares
`pq: IndexedPriorityQueue;` with no argument, which only type-checks because the parameter is
vestigial. Either drop `V`, or actually use it (`keys: TArray<V>`, `insert(key: number, priority: V)`).

### 2.3 `_valueOf(idx)` is dead code — DEAD CODE

```ts
_valueOf(idx: number): number | null {
  const key = Number(this.pq._valueOf(idx));
  return this.keys[key];
}
```

Nothing calls it. Left over from the override era, before the hooks were injected.

### 2.4 `insert` doesn't reject duplicate keys — CORRECTNESS

The previous version had an "already present → update" branch; the rewrite dropped it. Inserting a
key twice now puts two entries in the heap and leaves `qp[key]` pointing at whichever moved last —
silent corruption. Sedgewick throws `IllegalArgumentException`. Add:

```ts
contains(key: number): boolean { return this.qp[key] != null; }
```

and make `insert` throw (or delegate to `update`) when it is already present. There is also no
bounds check on `key` against capacity — the old `insertWithKey` had one.

### 2.5 `qp`/`keys` are sized from capacity and are non-resizable — FRAGILITY

```ts
this.qp   = new TArray<number>([], false, false, this.size);
this.keys = new TArray<number>([], false, false, this.size);
```

`this.size` is `pq.size`, which is `TArray.length` — capacity (§1.3). That is what you want here,
but only because `PriorityQueue` was given an explicit `max`. If `max` is omitted, `PriorityQueue`
builds a **resizable** array of length 1, so `qp` and `keys` get capacity 1 and `isResizable: false`
— the second insert throws `Array is full`.

`max` is effectively required. Make it required in the signature rather than leaving a constructor
that only works if you happen to pass the optional argument.

### 2.6 The indexed API is missing its reason for existing — COMPLETENESS

Public surface is `insert`, `update`, `delTop`, `isEmpty`, `size`, `toString`. An *indexed* PQ is
defined by keyed access, and these are absent:

| missing | why it matters |
|---|---|
| `contains(key)` | §2.4; also lets `PrimMST` drop its `MAX_SAFE_INTEGER` sentinel (§3.3) |
| `delete(key)` | the other half of "indexed"; needs §1.2 fixed first |
| `priorityOf(key)` | lets `PrimMST` drop `dist` entirely (§2.1) |
| `peek()` | §1.13 |

`delTop()` also returns only the key, discarding the priority the caller usually wants next.

### 2.7 `qp` is written twice on insert — REDUNDANCY

```ts
insert(key, priority) {
  this.keys.update(key, priority);
  const currIdx = this.pq.insert(key);
  this.qp.update(key, currIdx);       // ← onSwap already maintained this during the swim
}
```

`_bubbleUp` fires `onSwap` for each swap, which already sets `qp[key]` to the final position. The
trailing write is redundant when the element moved, and it is the *only* write when it didn't —
which is why it can't simply be deleted. The clean version is to use the `onInsert` hook that is
currently being passed `undefined`:

```ts
onInsert: HeapHook<number> = ({ heapIdx, value }) => this.qp.update(value, heapIdx);
```

Then `insert` is two lines and the bookkeeping lives in one place with the other two hooks. Note
the ordering constraint that makes it work: `PriorityQueue.insert` fires `onInsert` *before*
`_bubbleUp`, so the initial position is recorded and then corrected by `onSwap`.

Also note `pq.insert` returns `number | null`; when it returns `null`, `qp.update(key, null)` wipes
the entry. `TArray.update` treats a `null` *index* as a no-op but a `null` *value* as a real write.

### 2.8 Ordering dependency in `insert` is load-bearing and undocumented — HAZARD

```ts
this.keys.update(key, priority);   // MUST precede the line below
const currIdx = this.pq.insert(key);
```

`pq.insert` triggers `_bubbleUp` → `_isLess` → `valueOf(key)` → `this.keys[key]`. Swap these two
lines and the swim that positions the new element compares `undefined`, which `Base.compare`
silently treats as `null` and orders as smallest — no crash, just a scrambled heap.

This is the temporal coupling `etc/indexed-pq-layouts.md` §5 warns about, now load-bearing in
production code. It deserves a comment, and ideally a test that would catch the reordering.

### 2.9 The class docstring describes the previous design — DOCUMENTATION

```
* example: Patient triage. Patients have unique ids that should be mapped to heap positions.
* Key -> heap position
* key -> value
* original: heap position -> value
```

There is no longer a "value" — priorities are `number` and payloads live with the client. Rewrite
against the three questions in `etc/indexed-pq-layouts.md` §3, and say which layout this class
implements.

---

## 3. `PrimMST.ts`

The rewrite is a real improvement: `marked[]` replaces the `edgeTo[x] == null` truthiness test
(which was broken for vertex `0`), and `edgeTo` now stores edges rather than vertices.

### 3.1 `buildTree` re-derives the vertex it was just handed — REDUNDANCY

```ts
const min = this.pq.delTop();          // ← min IS the vertex joining the tree
...
const treeVtx = minEdge.either();
const newVtx = minEdge.other(treeVtx);

if (this.marked[treeVtx] != true) this._addEdges(treeVtx);
if (this.marked[newVtx] != true) this._addEdges(newVtx);
```

`min` is the new tree vertex — that is what the queue is keyed by. The `either()`/`other()` dance
recovers a fact the pop already returned, and the two guarded calls work only because exactly one
endpoint is unmarked. Collapse to:

```ts
if (!this.marked[min]) this._addEdges(min);
```

Also `!= true` → `!`.

### 3.2 `_addEdges` hides the marking — CLARITY

`marked[vtx] = true` is the last statement of a method named "add edges". Callers must know the
side effect to reason about §3.1's guards. Rename to `_scan(vtx)` / `_relaxFrom(vtx)`, and mark at
the **top** — the vertex is in the tree the moment you begin scanning from it, and marking first
makes the in-loop `marked[other]` check naturally skip self-loops.

### 3.3 `Number.MAX_SAFE_INTEGER` carries two meanings — DESIGN

```ts
if (this.dist[other] == Number.MAX_SAFE_INTEGER) { /* insert */ } else { /* update */ }
```

The sentinel simultaneously means "no candidate edge yet" and "not currently in the queue". Those
are the same set today, but only by construction. Two improvements:

- Use `Infinity`, not `MAX_SAFE_INTEGER` — weights are floats, and `MAX_SAFE_INTEGER` is an integer
  concept that invites `+1` arithmetic bugs.
- Better, ask the authority directly: `if (!this.pq.contains(other))` (§2.6). Then the branch is
  about queue membership, which is what it actually tests.

### 3.4 `edgeTo` is typed non-optional but is genuinely sparse — TYPE SAFETY

```ts
edgeTo: WEdge[];
this.edgeTo = Array.from({ length: G.V + 1 });   // → holes, all undefined
...
const minEdge = this.edgeTo[min];
this._weight += minEdge.weight;                   // ← unguarded deref
```

The type claims every slot holds a `WEdge`; the initialiser guarantees none do. `minEdge` is
`undefined` for index 0 and for any vertex never relaxed. Declare `(WEdge | undefined)[]` and let
the compiler force the guard — same class of "the type lies about `null`" issue flagged for
`TArray` in `etc/priority-queue-review.md` §1.1.

### 3.5 Disconnected graphs silently produce a partial tree — CORRECTNESS

The algorithm seeds from vertex `1` and stops when the queue empties. On a disconnected graph that
yields one component's tree, not a spanning forest, and `weight` is quietly wrong. algs4 handles
this with an outer `for (v : V) if (!marked[v]) prim(G, v)`.

At minimum, document the precondition. Better, either loop over unmarked vertices (producing an
MSF) or assert `q.size === V - 1` and throw.

### 3.6 The start vertex is hardcoded — FLEXIBILITY

`this.dist[1] = 0; this._addEdges(1);`. Take a `source = 1` constructor parameter. Needed anyway for
§3.5.

### 3.7 `dist[1] = 0` is decorative — DEAD CODE

Nothing ever reads it. Vertex 1 is marked at the end of `_addEdges(1)` and every later scan skips
marked vertices, so `dist[1]` is never compared against anything. Harmless, but it reads like
load-bearing initialisation.

### 3.8 The class docstring promises an API the class doesn't have — DOCUMENTATION

```
* Iterable<Edge> edges() all of the MST edges
* double weight() weight of MST
```

`weight` exists; `edges()` does not — the field is `q: Queue<WEdge>`, public and named after its
type. Either add `edges()` or update the docstring. `q` is also a poor name next to `pq`.

### 3.9 All work happens in the constructor — DESIGN, LOW PRIORITY

`new PrimMST(G)` runs the whole algorithm, so the object cannot be built for inspection and the
constructor can throw from deep inside graph traversal. This matches algs4 so it's defensible, but
a static `PrimMST.of(G)` or an explicit `run()` would be more testable.

---

## 4. `Base.ts`

### 4.1 `compare` is not reflexive on `null` — CORRECTNESS

```ts
if (leftVal == null) return -1;
if (rightVal == null) return 1;
```

`compare(null, null)` returns `-1` — "null is less than null". Any binary search, sort, or
equality test built on `compare(a, a) === 0` breaks on null. Return `0` when both are null.

The deeper issue: `null` is being used both as a *value* that sorts first and as an *error signal*
for "no comparable projection". Those need different handling.

### 4.2 Removing `CompareFn` narrows the abstraction — DESIGN

The diff deleted `CompareFn` and the `compare` constructor parameter, leaving `valueOf` as the only
injection point. That forces every ordering to be expressible as a single `string | number`
projection, which rules out:

- multi-key ordering (by weight, then by id)
- locale-aware or case-insensitive string ordering
- reverse ordering without the `isMin` flag (§1.6)

`etc/indexed-pq-layouts.md` §10 argued for exactly one of `valueOf`/`compare`, and recommended
**comparator**, because `valueOf` is the strictly weaker of the two:
`compare = (a, b) => sign(f(a) - f(b))`. This change kept the weaker one. Suggest inverting: accept
a comparator, and provide `byNumber(fn)` / `byString(fn)` helpers that build one for the common case.

### 4.3 The default `valueOf` stringifies — LANDMINE

```ts
valueOf: ValueOfFn<T | null> = (value) => value == null ? null : String(value);
```

So `new PriorityQueue<number>(32, true)` — no explicit `valueOf` — orders numbers **lexicographically**:
`"10" < "9"`. It silently produces a wrong heap with no type error, since `number` is a valid `T`.
Every numeric structure in the repo must remember to inject a projection.

Default to identity, or make the projection/comparator a required constructor argument.

### 4.4 `valueOf` shadows `Object.prototype.valueOf` — HAZARD

Every structure extending `Base` now has an own property named `valueOf`, which JavaScript invokes
implicitly during coercion — `` `${pq}` ``, `+pq`, `pq == 1`, `pq + ""`. The engine calls it with
**no arguments**, so `value` is `undefined`, and in `IndexedPriorityQueue` that path reads
`this.keys[undefined]`.

This predates the changeset but the changeset converted it from a prototype method to an own field
on every instance, which widens the surface. Rename to `priorityOf` / `projection` / `rank`.

### 4.5 `operations` and `getOps()` are dead — DEAD CODE, VERIFIED

```ts
protected operations: VisualOp[] = [];
getOps() { return [...this.operations]; }
protected record(op: VisualOp) { this.dispatchEvent(new CustomEvent("op", { detail: op })); }
```

`record` only dispatches an event. Nothing ever pushes to `operations`, so `getOps()` returns `[]`
forever. Either have `record` push, or delete both.

### 4.6 `Base` has two unrelated responsibilities — ARCHITECTURE

It is simultaneously:

1. a **comparison policy** (`valueOf`, `compare`) — generic in `T`
2. a **visualisation event recorder** (`EventTarget`, `record`, `operations`) — not generic at all

The evidence they don't belong together is in this very changeset: `LinkedList extends Base<T>` was
changed purely to satisfy the generic, yet `LinkedList` defines its **own** unrelated
`CompareFn<T, Q>` and uses `Base` only for recording. Meanwhile `Stack extends Base` (no argument)
is a standing type error.

Split into `Recordable` (the EventTarget half, non-generic) and either a `Comparator<T>` interface
or a plain injected compare function. Structures then take what they need.

---

## 5. `arrays/Array.ts`

### 5.1 `TArray` is a teaching/visualisation array being used as a hot data structure — ARCHITECTURE

This is the most consequential structural point in the review. `TArray` exists to *record and
animate* operations: it dispatches events on every mutation, and it returns a `Proxy` from its
constructor so `arr[i]` can be intercepted. Both are the right call for a visualiser.

`PriorityQueue` then uses it as heap storage, so every heap comparison and swap pays for a proxy
trap, an event dispatch, and — worse — the following two:

**`delete` is O(n) and allocates:**

```ts
delete(idx: number): T | null {
  const value = this.arr[idx];
  const newArr = this.arr.slice(0, idx).concat(this.arr.slice(idx + 1));
  newArr.length = this.length;
  this.arr = newArr;
  ...
}
```

Two array copies per call. A heap only ever deletes the **last** element, where truncation is O(1).
Every `delTop` currently copies the whole backing store twice.

**`validLen` is O(n) and is read on every insert and delete:**

```ts
get validLen() { return this.arr.findLastIndex((value) => value !== undefined) + 1; }
```

Net effect: **every priority-queue operation is O(n) rather than O(log n)**, so `PrimMST` on
mediumEWG is doing far more work than the algorithm calls for. It's invisible at V=250 and won't be
at V=10,000.

Options, cheapest first:

1. Maintain `validLen` as a counter (`_len`), incremented/decremented on insert/delete. Removes the
   scan.
2. Add `pop(): T | null` that truncates in place, and use it from `_delete`. Removes the copies.
3. Let `PriorityQueue` hold a plain `(T | null)[]` and keep `TArray` for the visualiser. Cleanest
   separation; largest change.

(1) and (2) are small and would leave the visualisation intact.

### 5.2 `binarySearch` lost a guard — BEHAVIOUR CHANGE

```diff
-if (searchVal === null || this.valueOf(searchVal) === null) return -1;
+if (searchVal === null) return -1;
```

A `searchVal` that is non-null but projects to `null` now falls through into `compare`, where §4.1's
asymmetric null handling returns `-1`/`1` rather than "not found" — so the search walks a branch
instead of reporting absence. If the goal was to avoid calling `valueOf` twice, hoist it into a
local instead of dropping the check.

### 5.3 `binarySearch(searchVal, high, low)` parameter order — NIT

`high` before `low` inverts the conventional reading order and makes call sites easy to get
backwards. `(searchVal, low, high)`.

### 5.4 `delete` now returns the deleted value — GOOD

Correct and necessary — it's what lets `PriorityQueue._delete` pass a real key to `onDelete`.
Worth a test, since nothing currently covers it.

---

## 6. `linked-lists/LinkedLists.ts`

### 6.1 `extends Base` → `extends Base<T>` — GOOD, VERIFIED

Removes one type error (confirmed: it's the single error that disappears between `HEAD` and the
working tree). Two more of the same kind remain, in files not touched here:

```
src/data-structures/stacks/Stack.ts(4,31): Generic type 'Base<T>' requires 1 type argument(s).
src/common/store.ts(45,22):                Generic type 'Base<T>' requires 1 type argument(s).
```

Worth fixing in the same commit — same one-token change, and it takes the count to zero for that
error class.

### 6.2 `LinkedList` declares its own `CompareFn<T, Q>` — see §4.6

```ts
export type CompareFn<T, Q> = (counter: LinkNode<T>, value: Q) => boolean;
```

Same name as the type this changeset deleted from `Base`, different shape and meaning
(node-vs-value predicate rather than an ordering). Now that `Base.CompareFn` is gone the collision
is harmless, but the name is misleading — it's a *match* predicate, not a comparator. Rename to
`MatchFn` / `PredicateFn`.

---

## 7. Regressions this changeset introduces

### 7.1 Two new type errors in `OrderedSymbolTable` — VERIFIED

`HEAD` → 10 errors; working tree → 11, with one fixed (§6.1) and **two new**:

```
src/data-structures/symbol-tables/OrderedSymbolTable.ts(29,3): error TS2322:
  Type 'TArray<never>' is not assignable to type 'TArray<K>'.
    Types of property 'valueOf' are incompatible.
      Type 'ValueOfFn<null>' is not assignable to type 'ValueOfFn<K | null>'.
```

Cause: widening `ValueOfFn<T>` to `ValueOfFn<T | null>` made `valueOf` a **function-typed property**
whose parameter type now participates in assignability. `new TArray([], true, true)` infers
`TArray<never>`, and `ValueOfFn<never | null>` = `ValueOfFn<null>` no longer accepts `K`.

Fix at the call site — the annotation was always doing more work than it should:

```ts
_keys: TArray<K> = new TArray<K>([], true, true);
values: TArray<K> = new TArray<K>([], false, true);
```

(Adjacent, not caused by this changeset: `values` is typed `TArray<K>`, so a symbol table's values
are constrained to its key type. Almost certainly should be a second parameter `V`.)

### 7.2 Test suite passes over a broken invariant — PROCESS

See §0 and §1.1. This is the most important item in the document and it is not a code issue.

---

## 8. Testing gaps

`src/data-structures/priority-queues/` contains **no test file**. The whole graph stack now depends
on it:

```
PrimMST ──> IndexedPriorityQueue ──> PriorityQueue ──> TArray ──> Base
```

and the only coverage of any of it is two end-to-end MST weight assertions. That is how a heap that
fails 80% of randomised drains ships green.

**Highest-value addition in this review** — roughly 20 lines:

```ts
it("drains in priority order", () => {
  for (let trial = 0; trial < 200; trial++) {
    const vals = randomInts();
    const pq = new PriorityQueue<number>(4096, true, (v) => v);
    vals.forEach((v) => pq.insert(v));
    const got = vals.map(() => pq.delTop());
    expect(got).toEqual([...vals].sort((a, b) => a - b));
  }
});
```

Then, in rough priority order:

| test | catches |
|---|---|
| randomised drain, min **and** max | §1.1 |
| heap-invariant assertion after every mutation | §1.1, §1.2 |
| `decreaseKey` on a key mid-heap, then drain | §2.7, §2.8 |
| duplicate `insert` of one key | §2.4 |
| `delete(key)` for a non-root key | §1.2 |
| `insert` ordering: priority written before `pq.insert` | §2.8 |
| empty-queue `delTop` / `peek` | §1.4 |
| `IndexedPriorityQueue` without `max` | §2.5 |
| `PrimMST` asserts the MST **edge set**, not just the weight | two trees can share a weight |
| `PrimMST` on a disconnected graph | §3.5 |

`PrimMST.test.ts` currently checks `q.size` and `weight`. Both tinyEWG and mediumEWG have unique
MSTs, so asserting the sorted edge list costs nothing and is far more specific than a float sum.

---

## 9. Suggested order of attack

**Before committing:**

1. **§1.1** — fix `_bubbleDown`. Everything else is cosmetic next to a heap that isn't a heap.
2. **§8** — add the randomised drain test *first*, watch it fail, then fix. It is the regression
   guard for every later change.
3. **§7.1** — add the two `TArray<K>` annotations; net type errors back to 9.
4. **§6.1** — same one-token fix in `Stack.ts` and `store.ts`; that error class goes to zero.
5. **§2.2, §2.3, §4.5** — delete the unused generic, `_valueOf`, and `operations`/`getOps`.

**Soon after:**

6. **§1.2** — swim-then-sink in `_delete`, before `delete(key)` exists to expose it.
7. **§2.4, §2.6** — `contains` / `delete(key)` / `priorityOf`; makes the class actually indexed.
8. **§2.1** — resolve `keys`-vs-`dist`. Pick a layout and delete the other array.
9. **§5.1(1)(2)** — `validLen` counter and `pop()`. Restores O(log n) per operation.
10. **§3.1, §3.2, §3.3** — simplify `buildTree`, rename `_addEdges`, drop the sentinel.

**Larger, discuss first:**

11. **§1.7** — options object; **§1.6** — fold `isMin` into the comparator.
12. **§4.2** — comparator instead of `valueOf`, with `byNumber` helper.
13. **§4.6** — split `Base` into `Recordable` + comparison policy. Unblocks `Stack`, `store`,
    `LinkedList` all at once.
14. **§5.1(3)** — decouple `PriorityQueue` from `TArray`.
15. **§3.5** — spanning forest support.

**Documentation:**

16. **§2.9, §3.8** — the two docstrings that describe code that no longer exists.

---

## 10. What's good in this changeset

Worth recording so it doesn't get refactored away:

- **Injected hooks over overridden ones.** `onSwap`/`onInsert`/`onDelete` are the correct fix for
  the orphaned-override bug, and match what `etc/priority-queue-review.md` §3 recommended.
- **`private` on `_bubbleUp` / `_bubbleDown` / `swap`.** The heap internals are no longer part of
  the public API.
- **`marked[]` in `PrimMST`.** Replaces `if (this.edgeTo[other])`, which was a falsy-zero bug
  waiting for a 0-indexed graph.
- **`edgeTo` holding edges instead of vertices.** Removes the `either()`/`other()` juggling that
  the old `buildTree` needed to reconstruct which endpoint was new.
- **`TArray.delete` returning the deleted value.** Small change; it's what makes a correct
  `onDelete` payload possible.
- **Debug `console.log`s removed.** Verified: none remain in the changed files.
