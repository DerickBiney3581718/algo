# Priority-queue stack review — pass 2

Supersedes the previous contents of this file, which reviewed work now committed as
`ce5979e feat: add prim mst`.

**Current uncommitted set is small:**

```
M src/data-structures/union-find/UnionFind.ts     (one line: class → export class)
?? src/algorithms/graphs/Kruskal.ts                (stub: comments only, no code)
```

So this pass does three things: re-verifies the previous findings against the committed code
(§2), records what is still wrong (§3), and reviews the Kruskal/UnionFind work that is about to
start (§4–5). §6 answers the `valueOf`-vs-comparator question and **corrects** what the previous
pass claimed.

Companion: `etc/indexed-pq-layouts.md` (design rationale).

> `etc/priority-queue-review.md` is **superseded** — it reviews an implementation that no longer
> exists (`deleteItem`, `insertWithKey`, `updateItem`, `insertSideEffects`, `delMax` are all gone).
> Read it as history only; nothing in this document depends on it.

---

## 1. Verification

Re-run from scratch against the current tree. Everything below is measured, not inferred.

| check | previous pass | now |
|---|---|---|
| `npx vitest run` | 113 / 113 | **113 / 113** |
| PQ randomised drain, `isMin: true` (300 trials) | **240 / 300 wrong** | **0 / 300** ✅ |
| PQ randomised drain, `isMin: false` (300 trials) | not measured | **0 / 300** ✅ |
| IPQ drain with random `update` (200 trials) | not measured | **0 / 200** ✅ |
| `delete(idx)` on a mid-heap index, then drain (400 trials) | not measured | **7 / 400 wrong** ⚠️ |
| `npx tsc --noEmit` | 11 errors | **10 errors** |

> **The sink is fixed.** `_bubbleDown` now selects the better child, swaps once, and recurses only
> when it swapped. 600 randomised drains across both orientations, zero failures. The
> `IndexedPriorityQueue` is likewise clean under random `decreaseKey`/`increaseKey` traffic.
>
> Two real bugs remain: `isEmpty` can never return `true` (§3.1), and `delete(idx)` still doesn't
> swim (§3.2, now measurable at 1.75%).

---

## 2. Previous findings — disposition

### Resolved ✅

| # | finding | how it was fixed |
|---|---|---|
| 1.1 | `_bubbleDown` not a sink | best-child selection, single swap, conditional recursion |
| 1.3 | `size` returned capacity | now returns `array.validLen` (but see §3.3) |
| 1.4 | `delTop()` unguarded on empty | `if (this.isEmpty) return null` added (but see §3.1 — the guard is dead) |
| 1.5 | `_isLess` misnamed | renamed `_shouldSink`; `_valueOf` → `heapVal` |
| 1.7 | six positional constructor params | options object; the `undefined` placeholder is gone |
| 1.10 | leading-underscore members public | `_shouldSink`, `_bubbleUp`, `_bubbleDown`, `swap` private; index helpers `private static` |
| 1.11 | `update` conflated two operations | split into `update(idx, value)` + `reheapify(idx)` |
| 1.12 | `insertBulk` dropped falsy values | now `if (value == null) continue` |
| 1.13 | no `peek` | added (but see §3.1) |
| 1.14 | `if (!parentIdx)` falsy-zero | now `if (parentIdx < 1)` |
| 1.15 | `let heapIdx` | `const` |
| 2.2 | unused `V extends Comparable` generic | generic removed entirely |
| 2.3 | dead `_valueOf` on IPQ | deleted |
| 2.4 | duplicate-key insert corrupts | `contains(key)` added; `insert` delegates to `update` |
| 2.5 | `qp`/`keys` sized from `pq.size` | now sized from `max` directly; `max` is a required parameter |
| 3.6 | hardcoded start vertex | `constructor(G, source = 1)` |
| 3.7 | `dist[1] = 0` decorative | removed |
| 5.4 | `TArray.delete` return value | kept, now genuinely used |
| — | `_delete` → `delete` | public API name matches its role |

### Outstanding ⚠️

| # | finding | status |
|---|---|---|
| 1.2 | `delete(idx)` sinks but never swims | **now live** — see §3.2 |
| 1.6 | `isMin` is a flag, not comparator inversion | unchanged; `_shouldSink` still branches on it |
| 1.8 | `OnDelete` / `OnInsert` structurally identical | unchanged |
| 1.9 | hook payloads typed `Comparable`, not `T` | unchanged; IPQ still calls `Number(value)` |
| 2.1 | `IPQ.keys` duplicates `PrimMST.dist` | unchanged — see §3.5 |
| 2.6 | no `delete(key)` / `priorityOf(key)` | `contains` landed; the other two didn't |
| 2.8 | load-bearing line order in `IPQ.insert` | unchanged and still uncommented |
| 2.9 | IPQ docstring describes the old design | unchanged |
| 3.1–3.5 | `PrimMST` cleanups | partially — `source` param landed, rest didn't |
| 3.8 | `PrimMST` docstring promises `edges()` | unchanged |
| 4.1–4.6 | `Base` issues (null reflexivity, dead `operations`, split) | unchanged |
| 5.1 | `TArray` is O(n) per heap op | unchanged — see §3.6 |
| 5.2 | `binarySearch` lost a null guard | unchanged |
| 6.1 | `Stack.ts` / `store.ts` bare `Base` | unchanged — still 2 of the 10 type errors |
| 7.1 | `OrderedSymbolTable` `TArray<never>` | unchanged — still 2 of the 10 type errors |
| 8 | no test file for either priority queue | **unchanged, and this is now the top item** |

---

## 3. Outstanding defects, in priority order

### 3.1 `isEmpty` can never be `true` — CRITICAL, VERIFIED

```ts
// PriorityQueue
get isEmpty(): boolean { return this.array.isEmpty; }

// TArray
get isEmpty() { return this.validLen === 0; }
get validLen() { return this.arr.findLastIndex((v) => v !== undefined) + 1; }
```

The constructor writes a sentinel: `this.array.insert(null)` puts `null` at index 0. `null !== undefined`
is `true`, so `findLastIndex` always finds at least index 0, so `validLen >= 1`, so `isEmpty` is
**always false**.

Measured on a fresh queue and on a fully drained one:

```
fresh       : isEmpty=false  size=1  peek=undefined
after +5    : isEmpty=false  size=2
delTop      : 5
drained     : isEmpty=false  size=1  peek=undefined
delTop again: undefined      isEmpty=false  size=1
```

Consequences, all live:

- **`delTop()`'s guard is dead code.** `if (this.isEmpty) return null` never fires, so a drained
  queue returns `undefined` — not `null` — while the signature says `T | null`.
- **`peek()`'s guard is dead code.** Same: returns `undefined`, not `null`.
- **`PrimMST.buildTree` is an infinite loop but for one line.** `while (!this.pq.isEmpty)` never
  terminates on its own; only `if (min == null) return;` stops it. That null check is load-bearing
  in a way nothing says out loud, and `undefined == null` is what makes it work.
- **`size` on an empty queue is 1.**

The sentinel also survives deletion by accident: `delete(0)` splices index 0 out and shifts index 1
down into it, so a `null` lands back at position 0 and `validLen` returns to 1 rather than 0.

**Fix.** Keep the sentinel (1-based indexing is worth it) and stop counting it:

```ts
get size(): number   { return Math.max(this.array.validLen - 1, 0); }  // element count
get isEmpty(): boolean { return this.size === 0; }
```

Then audit `_bubbleDown`, which currently derives `lastIdx = this.size - 1` from the *inflated*
size and is correct only because of that inflation. With the fix it becomes `lastIdx = this.size`.
Add an explicit test for both, because this is exactly the arithmetic that silently drifts.

### 3.2 `delete(idx)` still doesn't swim — CONFIRMED LIVE, 7/400

```ts
delete(idx: number): void {
  const heapIdx = this.array.validLen - 1;
  this.swap(idx, heapIdx);
  const value = this.array.delete(heapIdx);
  this.onDelete({ heapIdx, value });
  this._bubbleDown(idx);        // ← sink only
}
```

The tail element promoted into `idx` can be **better than `idx`'s parent**, in which case it must
swim. Sedgewick: `exch(i, n--); swim(i); sink(i);`.

Verified invariant break — min-heap, `delete(4)`:

```
before       : . 1 50 2 51 52 3 4
after del(4) : . 1 50 2 4 52 3 _
                     ↑     ↑
                  idx2=50 has child idx4=4      ← parent > child in a min-heap
```

The tail (`4`) came from the *right* subtree, so it was never constrained by the left subtree's
ancestors. Sinking from index 4 does nothing because index 4 is a leaf.

This was rated LATENT last pass, on the grounds that `delTop` was the only caller. `delete(idx)` is
now **public**, so that argument no longer holds. Measured impact: 400 random build-delete-drain
cycles → **7 produced a wrong drain order** (1.75%). Low enough to hide indefinitely, which is the
problem — Kruskal or a future `IPQ.delete(key)` will hit it.

**Fix** — the method already has `reheapify`:

```ts
delete(idx: number): void {
  const lastIdx = this.array.validLen - 1;
  this.swap(idx, lastIdx);
  const value = this.array.delete(lastIdx);
  this.onDelete({ heapIdx: lastIdx, value });
  if (idx <= this.array.validLen - 1) this.reheapify(idx);   // sink AND swim
}
```

The guard matters: after deleting the last element, `idx` may now be past the end.

### 3.3 `size` counts the sentinel — API TRAP

Follows from §3.1. `size` returns `array.validLen`, which is `elementCount + 1`. `_bubbleDown`
compensates (`lastIdx = this.size - 1` happens to be the last *element* index), so the code is
self-consistent — but any new reader computing `size` as a count gets an off-by-one, and
`IndexedPriorityQueue.size` forwards the inflated value straight to callers.

Fix together with §3.1; they're the same defect seen from two angles.

### 3.4 The `_shouldSink` comment is now stale — CLARITY

```ts
// when bubbling down, for max: is left less, for min: is left greater. then switch
private _shouldSink(left: number, right: number): boolean {
  let dir = null;
  if (this.isMin) dir = this.compare(leftVal, rightVal);
  else dir = this.compare(rightVal, leftVal);
  return dir === 1;
}
```

The rename fixed the naming complaint, and swapping the *arguments* rather than the *result* is a
genuinely better shape than the old `isMin ? dir === 1 : dir === -1`. But the comment still
describes the old formulation and now actively misleads.

Note what the new shape reveals: `if (isMin) compare(a,b) else compare(b,a)` **is** comparator
inversion, written inline. That is finding 1.6 solved by accident — lift it into the constructor
(`const cmp = isMin ? compare : (a, b) => compare(b, a)`) and the branch leaves the hot path
entirely. Parameters are also still named `left`/`right` while every caller passes
`(parent, child)`.

### 3.5 `IPQ.keys` still duplicates `PrimMST.dist` — ARCHITECTURE

Unchanged from finding 2.1. `PrimMST._addEdges` writes the same number twice:

```ts
this.pq.insert(other, edge.weight);   // → IPQ.keys[other]
this.dist[other] = edge.weight;       // → identical value
```

`IPQ.insert` also writes `keys` twice on the upsert path — once directly, once inside `update`:

```ts
insert(key: number, priority: number): number | null {
  this.keys.update(key, priority);                    // ← write 1
  if (this.contains(key)) return this.update(key, priority);   // ← update() writes it again
  ...
}
```

Also worth naming: `insert` that silently updates an existing key is an **upsert**. Sedgewick
throws here. Either rename it `upsert`, or throw and let callers choose — silent divergence between
"I inserted" and "I replaced" is how duplicate-key bugs hide.

See `etc/indexed-pq-layouts.md` §6 for the Layout C resolution (delete `keys`, let the comparator
read `dist`).

### 3.6 `TArray` is still O(n) per heap operation — PERFORMANCE

Unchanged from finding 5.1, and now more relevant because Kruskal will push **E** elements through
the queue rather than Prim's V.

- `TArray.delete` does `slice().concat()` — two full array copies per call.
- `validLen` is an O(n) `findLastIndex`, read on every insert and every delete.

Net: every heap operation is O(n), so the whole structure is O(n²) where it should be O(n log n).
mediumEWG has 1273 edges; Kruskal will do 1273 inserts and up to 1273 pops against an O(n) backing
store.

Cheapest fixes, in order: maintain `validLen` as a counter; add a `pop()` that truncates in place.
Both leave the visualisation behaviour intact.

### 3.7 Everything else

Findings 1.6, 1.8, 1.9, 2.6, 2.8, 2.9, 3.1–3.5, 3.8, 4.1–4.6, 5.2, 6.1, 7.1 stand as written in the
previous pass. The two `OrderedSymbolTable` `TArray<never>` errors and the two bare-`Base` errors in
`Stack.ts` / `store.ts` are still 4 of the 10 remaining type errors, and all four are one-token fixes.

---

## 4. `UnionFind.ts` — the uncommitted change

The diff is one line (`class` → `export class`), which is correct and required for Kruskal. But
Kruskal is about to depend on this class, so it's worth reviewing before that happens.

### 4.1 Falsy-zero guard in `unionize` — BUG

```ts
unionize(x: number, y: number) {
  const xRoot = this.find(x);
  const yRoot = this.find(y);
  if (xRoot && yRoot && !this.isSame(x, y)) {
```

Site `0` is its own root, and `0` is falsy — so **`unionize` silently does nothing whenever either
argument's root is site 0**. The component count stays wrong and the union never happens.

Falsy-zero guards are a recurring failure mode in this codebase — `PrimMST` carried the same shape
(`if (this.edgeTo[other]) continue`) until it was replaced with `marked[]`. Any array whose *values*
are vertex ids, site ids, or heap indices has a legitimate `0`, and `if (x)` rejects it.

Here it is currently masked because the graph loader shifts every vertex by +1 (`parse.ts`
`VERTEX_OFFSET`), so site 0 is unused — but `new UnionFind(G.V + 1)` *allocates* it, and any direct
use of the class with 0-based sites hits it immediately.

**Fix:** the roots are always valid numbers; drop the truthiness check entirely.

```ts
if (!this.isSame(x, y)) { ... }
```

### 4.2 Four `find` calls per `unionize` — EFFICIENCY

```ts
const xRoot = this.find(x);
const yRoot = this.find(y);
if (xRoot && yRoot && !this.isSame(x, y)) {   // isSame() calls find(x) and find(y) again
```

`isSame` recomputes both roots. Compare them directly:

```ts
const xRoot = this.find(x);
const yRoot = this.find(y);
if (xRoot === yRoot) return;
```

That is also clearer about the actual precondition.

### 4.3 No path compression — DESIGN

`_find_parent` walks to the root without flattening. Weighted quick-union alone is O(log n) per
op, which is correct and is what the class name claims. Adding one line makes it near-constant:

```ts
private _find_parent(id: number): number {
  const parentId = this.siteArr[id];
  if (parentId === id) return id;
  const root = this._find_parent(parentId);
  this.siteArr[id] = root;      // path compression
  return root;
}
```

Worth doing, or worth an explicit comment saying it was deliberately left out for the teaching
version.

### 4.4 The comment above `unionize` describes a different algorithm — DOCUMENTATION

```ts
/**
 * naive union is the bottle-neck. Having to loop over entire sites.
 * Meaning for a completely connected component, we get quadratic time
 */
```

That describes **quick-find** (union scans the whole array). This class is **weighted quick-union**,
where `union` is O(log n) and nothing loops over all sites. The comment is a leftover from an
earlier implementation and now contradicts the code directly beneath it.

### 4.5 `isSame`'s `!== undefined` checks are dead — MINOR

```ts
return xRoot !== undefined && yRoot !== undefined && xRoot === yRoot;
```

`find` returns `number`, so neither can be `undefined` per the types. Either add real bounds
validation in `find` (out-of-range `id` currently returns `undefined` at runtime despite the type)
or drop the checks. Right now it's the worst of both — the check exists but the type says it can't
trigger, so nobody will maintain it.

### 4.6 `siteArr` and `PrimMST.edgeTo` are the same representation — WORTH KNOWING

Both are **parent-link forests**: an array indexed by vertex where each slot names that vertex's
parent, with roots pointing at themselves (UF) or holding nothing (`edgeTo`). `siteCounts` adds
subtree size, valid **only at roots** — non-root entries go stale as soon as their tree is merged.

```
UnionFind          siteArr[v]   = parent of v            (+ siteCounts[root] = size)
PrimMST            edgeTo[v]    = edge to v's parent     (parent = edgeTo[v].other(v))
DepthFirstPaths    edgeTo[v]    = parent of v
Dijkstra           edgeTo[v]    = parent of v            (+ distTo[v])
```

Same shape, four algorithms. But the **semantics differ in a way that matters**:

| | `PrimMST.edgeTo` | `UnionFind.siteArr` |
|---|---|---|
| what the tree *is* | the MST — the answer itself | an arbitrary bookkeeping tree |
| is the shape meaningful? | **yes** — it's the output | **no** — deliberately mangled |
| root chosen by | the algorithm's start vertex | whichever subtree is heavier |
| may it be rewritten? | never | freely — that's path compression |
| question it answers | "how did I reach v?" | "are u and v in the same set?" |

That asymmetry is the point. `UnionFind` is allowed to flatten its forest (§4.3) precisely because
nobody reads its structure — only "same root or not". `edgeTo` must be preserved exactly, because
walking it *is* how you recover the tree.

**Consequence for Kruskal.** Kruskal accumulates its MST into a `Queue<WEdge>`, not a parent-link
array, and this is why: mid-run the MST is a *forest* of disjoint trees with no agreed root, so
"the parent of v" isn't defined yet. Prim can use `edgeTo` because it grows a single tree outward
from a fixed source, so every vertex has a parent the moment it joins. Same output, two
representations, chosen by which one the algorithm can actually maintain as it goes.

`PrimMST` currently keeps both `q: Queue<WEdge>` and `edgeTo: WEdge[]`, which is fine — `edgeTo` is
the working state, `q` is the output — but it's worth a comment saying which is which, since they
hold overlapping edges.

### 4.7 Tests — ADDED, 8 RED

`src/data-structures/union-find/UnionFind.test.ts` now exists: 22 tests across construction,
union semantics, weighting, site 0, Sedgewick's `tinyUF` fixture, and a randomised
differential check against a naive label-array reference.

**14 pass, 8 fail — every failure is §4.1.** Verified: replacing the falsy guard with
`if (xRoot !== yRoot)` turns all 22 green with no other change.

`UnionFind` has no tests, and Kruskal's correctness rests entirely on it. A dozen lines comparing
`components` and `isSame` against a brute-force reachability check over random unions would cover it.

---

## 5. `Kruskal.ts` — the stub, and what it needs

Currently comments only:

```ts
export class Kruskal {
  //create sets for each vertex
  // put all edges on pq
  // on each pop: union edge vertices
  // if edge if either vertex was not marked, enqueue
}
```

The plan is right. Three things are missing from the stack before it can be written cleanly.

### 5.1 `WUndirectedGraph` has no `edges()` — BLOCKER

algs4's Kruskal opens with `new MinPQ<Edge>(G.edges())`. `WUndirectedGraph` exposes only
`adj(vtx)`, so there is no way to enumerate all edges. Add:

```ts
*edges(): Iterable<WEdge> {
  for (let v = 1; v <= this.V; v++) {
    for (const e of this.adj(v) ?? []) {
      if (e.other(v) > v) yield e;      // emit each undirected edge once
    }
  }
}
```

The `other(v) > v` test is what prevents every edge appearing twice — it lives in both adjacency
lists. Self-loops (`other(v) === v`) are excluded by `>`; decide deliberately whether that's what
you want.

### 5.2 `PriorityQueue<WEdge>` does not type-check — BLOCKER, VERIFIED

```
src/__tc.ts(3,37): error TS2344: Type 'WEdge' does not satisfy the constraint 'Comparable'.
```

`PriorityQueue<T extends Comparable>` where `Comparable = string | number | null`. Kruskal's whole
shape is a heap **of edges**, so this constraint blocks it outright. See §6 — the runtime already
works; only the type bound is in the way.

### 5.3 `WEdge.compareTo` exists but nothing can use it — REDUNDANCY

```ts
compareTo(that: WEdge): number { ... }
```

Faithfully ported from `Edge.java`, and currently dead — `PriorityQueue` compares via `valueOf`, not
via a method on the element. Either wire it up (§6) or delete it; a dead `compareTo` invites someone
to assume the queue honours it.

### 5.4 Sketch, once §5.1 and §5.2 land

```ts
export class Kruskal {
  mst = new Queue<WEdge>();
  private _weight = 0;

  constructor(G: WUndirectedGraph) {
    const pq = new PriorityQueue<WEdge>({
      isMin: true,
      max: G.E + 1,
      valueOf: (e) => (e == null ? null : e.weight),
    });
    for (const e of G.edges()) pq.insert(e);

    const uf = new UnionFind(G.V + 1);
    while (!pq.isEmpty && this.mst.size < G.V - 1) {
      const e = pq.delTop();
      if (e == null) break;
      const v = e.either();
      const w = e.other(v);
      if (uf.isSame(v, w)) continue;
      uf.unionize(v, w);
      this.mst.enqueue(e);
      this._weight += e.weight;
    }
  }

  get weight() { return this._weight; }
}
```

Two hazards to note when you write it:

- **`while (!pq.isEmpty)` will not terminate** until §3.1 is fixed. The `mst.size < G.V - 1` clause
  masks it for connected graphs and does *not* mask it for disconnected ones.
- **Kruskal drains the whole queue in order**, so it exercises `_bubbleDown` far harder than Prim
  did — E pops instead of V. It is the natural regression test for §3.2 as well, since a
  `delete(idx)` bug and a sink bug both surface as an out-of-order pop.

Kruskal is also the cheap way to cross-check `PrimMST`: both must produce the same total weight on
tinyEWG (1.81) and mediumEWG (10.46351). Two independent algorithms agreeing is much stronger
evidence than either passing alone.

---

## 6. `valueOf` vs comparator — correcting the previous pass

The previous pass (§4.2) said dropping `CompareFn` "kept the weaker one" and implied projection was
inadequate. **That overstated it.** For the case in front of you — order edges by weight —
projection is entirely sufficient. Verified at runtime:

```ts
const pq = new PriorityQueue({
  max: 32, isMin: true,
  valueOf: (e) => (e == null ? null : e.weight),
});
// insert 5 WEdges with weights .35 .16 .28 .93 .17
// drained: 0.16 0.17 0.28 0.35 0.93   ✅
```

`Base.compare` calls `valueOf` on both operands and compares the primitives, so any ordering
expressible as "project to one number or string" already works today. That covers weight, distance,
priority, timestamp, name — nearly everything in this repo.

**The blocker is not the mechanism, it's the type bound:**

```ts
export class PriorityQueue<T extends Comparable>   // Comparable = string | number | null
```

The constraint says "elements must themselves be primitives", which contradicts the existence of
`valueOf` — if elements are always primitives, there is nothing to project *from*. Those two design
decisions cancel each other out. Relaxing to `PriorityQueue<T>` is what unblocks Kruskal, and it's a
one-token change.

Where projection is genuinely weaker — worth knowing, not worth blocking on:

| case | projection | comparator |
|---|---|---|
| by one number/string | ✅ | ✅ |
| tie-break (weight, then id) | ✗ — needs string-encoding hacks | ✅ |
| descending strings | ✗ (`-x` is numbers only) | ✅ |
| custom null ordering | ✗ — `Base.compare` decides | ✅ |
| cost per comparison | 2 calls, + an allocation when `String()` | 1 call |

The last row matters at scale: a heap does O(n log n) comparisons, each invoking `valueOf` twice.

**Recommendation, revised:** keep `valueOf` as the primary API — it is the more ergonomic of the two
and you cannot get its sign backwards. Relax the `T extends Comparable` bound so it can actually be
used. Optionally accept a `compare` override for the tie-breaking cases, with `valueOf` remaining
the default path. That is exactly the shape Sedgewick's shipped `MinPQ` uses: a natural ordering
plus an optional `Comparator` escape hatch.

Also fold `isMin` into whichever one you keep (§3.4) — the inversion is already written inline.

---

## 7. Testing

Still the highest-value item, and now the only thing standing between you and another silent
regression. `src/data-structures/priority-queues/` and `src/data-structures/union-find/` both have
**no test file**, and the entire graph stack sits on them:

```
PrimMST ─┐
         ├─> IndexedPriorityQueue ─> PriorityQueue ─> TArray ─> Base
Kruskal ─┴─> UnionFind
```

Everything in §1's table was produced by throwaway probes that no longer exist. Making them
permanent is roughly 60 lines and would have caught both remaining bugs:

| test | catches |
|---|---|
| randomised drain, `isMin` both ways | 1.1 (regression guard) |
| **`isEmpty` on fresh and fully drained queues** | **§3.1** |
| **`delete(idx)` mid-heap, then drain** | **§3.2** |
| heap-invariant assertion after every mutation | §3.1, §3.2, and anything future |
| `peek`/`delTop` return `null` (not `undefined`) when empty | §3.1 |
| IPQ: random `insert` + `update`, drain in order | regression guard |
| IPQ: duplicate-key `insert` | §3.5 upsert semantics |
| `UnionFind`: random unions vs. brute-force reachability | §4.1 |
| **`UnionFind.unionize(0, x)`** | §4.1 directly |
| `PrimMST` asserts the MST **edge set**, not just the weight | two trees can share a weight |
| `Kruskal` weight === `PrimMST` weight on both fixtures | cross-validation |

The invariant assertion is the one with the best coverage-per-line:

```ts
function assertHeap(pq: any, isMin: boolean) {
  const a = pq.array.arr;
  for (let i = 2; i < pq.array.validLen; i++) {
    const p = a[Math.trunc(i / 2)], c = a[i];
    if (p == null || c == null) continue;
    expect(isMin ? p <= c : p >= c).toBe(true);
  }
}
```

Call it after every insert/delete/update in a randomised loop and every structural bug in this
document becomes a failing test rather than a 1.75% mystery.

---

## 8. Order of attack

**Before writing Kruskal:**

1. **§3.1** — `isEmpty` / `size`. Kruskal's main loop is `while (!pq.isEmpty)`; it will not
   terminate correctly on a disconnected graph until this is fixed.
2. **§5.2** — relax `T extends Comparable` to `T`. One token; without it `PriorityQueue<WEdge>`
   does not compile.
3. **§5.1** — add `WUndirectedGraph.edges()`.
4. **§7** — the drain + invariant tests, before more code depends on the queue.

**Before committing UnionFind:**

5. **§4.1** — the falsy-zero guard in `unionize`. A real bug in a two-line diff's blast radius.
6. **§4.2** — stop calling `find` four times.
7. **§4.4** — fix the comment that describes quick-find.
8. ~~**§4.7** — UnionFind tests.~~ Done — and they are what makes §4.1 a red test rather than a
   paragraph. Fix §4.1 first; the other seven failures go with it.

**Soon after:**

9. **§3.2** — swim in `delete(idx)`. Kruskal will exercise it.
10. **§3.4** — lift the `isMin` inversion into the constructor; fix the stale comment.
11. **§3.5** — resolve `keys`-vs-`dist`; decide `insert` vs `upsert`.
12. **§3.6** — `validLen` counter and `pop()`. Matters more with E elements than V.
13. Type errors: the two `TArray<K>` annotations, the two bare `Base` references. Four one-token
    fixes, 10 errors → 6.

**Larger:**

14. §4.3 path compression; §1.8/1.9 hook types; §4.x `Base` split; §5.1(3) decouple `TArray`.

---

## 9. What's good

- **The sink fix is right.** Best-child selection with conditional recursion, verified across 600
  randomised drains in both orientations. The `(left, right)` argument-swap formulation of
  `_shouldSink` is cleaner than the `dir === 1 : dir === -1` version it replaced.
- **The options-object constructor.** The `undefined` placeholder hole is gone and every call site
  now reads as documentation.
- **`reheapify` split out of `update`.** Exactly the right seam — it's what `IPQ.update` needed,
  and it made `IPQ.update` a three-liner.
- **`contains(key)` with a real bounds check** (`this.qp.length > key && this.qp[key] != null`).
- **IPQ generic dropped, `max` made required.** Two findings closed by deleting things.
- **`heapVal` / `_shouldSink` naming.** Both now say what they do.
- **`private static` on the index helpers.** They were always pure arithmetic.
- **`source` parameter on `PrimMST`**, with an honest `//!disconnected components` marker on the
  known gap.
