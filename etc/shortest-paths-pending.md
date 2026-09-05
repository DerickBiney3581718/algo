# Pending issues — shortest paths

Open items left over from a pass over the shortest-path classes and the structures
they lean on:

- `src/algorithms/graphs/SP.ts`, `DijkstraSP.ts`, `AcyclicSP.ts`
- `src/algorithms/graphs/TopSort.ts`, `DirectedCycle.ts`
- `src/data-structures/priority-queues/IndexedPriorityQueue.ts`
- `src/data-structures/linked-lists/LinkedLists.ts`

Everything below is unresolved. Fixes already applied are listed at the bottom for
context.

---

## 1. Failing test

### 1.1 `TopSort.test.ts` asserts `.size` on an array

`TopSort.test.ts:15` is `expect(ts.sorted.size).toBe(tinyChain.V)`, but `sorted`
returns `_sorted: number[]` (`TopSort.ts:10`). Arrays have `.length`, not `.size`, so
the assertion reads `undefined` and fails against any `V`. This is the only red test
in the suite (191 passing, 1 failing).

**Solution:** `.length`. Left alone in case `_sorted` is mid-refactor from `Stack`
back to an array — a `Stack` would make `.size` correct.

### 1.2 `TopSort` has no real coverage

The one test above is the whole file, and it never asserts the *order*, only the
count — which is the single property `AcyclicSP` depends on. `sorted` is reverse
topological order (DFS post-order, never reversed); nothing pins that down, so
flipping it would break `AcyclicSP` silently.

**Solution:** assert the actual sequence for `tinyChain`, plus the invariant that for
every edge `v -> w`, `w` appears before `v` in `sorted`.

---

## 2. Cycle detection has a blind spot

`DirectedCycle.ts:18` loops `for (let vtx = 1; vtx < this.G.V; vtx++)` — strictly
less than `V`, so DFS never *starts* at the last vertex. `TopSort.ts:21` loops
`vtx <= G.V` over the same vertex set, so the two disagree about what the graph is.

A cycle is missed whenever it is unreachable from vertices `1..V-1`, which in practice
means a self-loop on `V`:

```
V = 4, edges 1->2, 4->4     self-loop at V detected? false
V = 4, edges 1->1           self-loop at 1 detected? true
```

So `new TopSort(G)` accepts a graph that is not a DAG, and its `"G has to be a DAG"`
guard — which `AcyclicSP` leans on — does not hold.

**Solution:** `vtx <= this.G.V`. Worth checking the other traversals in this folder
for the same off-by-one.

---

## 3. `DijkstraSP` is not textbook Dijkstra

`visit` relaxes first and enqueues second, and a vertex that has already been popped
is no longer in the queue — so an improvement re-inserts a *settled* vertex
(`DijkstraSP.ts:42`). Two consequences:

**It is more capable than Dijkstra.** Negative edge weights give correct answers; it
behaves like Bellman-Ford/SPFA. Verified against a Floyd-Warshall reference on 200
random digraphs, plus a hand-built negative-weight case.

**It loses Dijkstra's performance guarantee.** "Each vertex settles exactly once" no
longer holds, so the worst case is not `O(E log V)` — it is exponential on adversarial
graphs.

**Solution:** decide which class this is, then say so in a comment on the class. If it
should be real Dijkstra, add a `marked` array and skip settled vertices, giving up
negative weights. If it should stay general, rename it and drop the priority queue for
a plain FIFO queue, which is what SPFA actually wants.

### 3.1 A negative cycle hangs the process

Every lap of a negative cycle lowers every distance, so the relaxation guard always
passes and the queue never drains. `0->1 (1), 1->2 (1), 2->0 (-3)` runs until killed —
confirmed at 15s, no output, no error.

**Solution:** if negative weights are in scope, add Bellman-Ford's V-th pass to detect
the cycle and throw, the way `TopSort` throws on a cycle.

### 3.2 `IndexedPriorityQueue.contains` cannot express "settled"

This is the root cause of both items above. `onDelete` nulls out `qp[key]`
(`IndexedPriorityQueue.ts:25`), so a popped key and a never-seen key are
indistinguishable — `contains(0)` is `false` right after `delTop()` returns `0`, and
`insert(0, ...)` then succeeds instead of throwing `"key already exists"`.

**Solution:** either keep a `settled` set in `DijkstraSP` rather than asking the queue
a question it cannot answer, or have the queue retain deleted keys in a separate state
so `contains` and `wasDeleted` stay distinct.

---

## 4. `SP` is superseded, and unbounded on cycles

`SP.ts` walks paths rather than vertices: `dfs` recurses on every edge that relaxes
(`SP.ts:30`), with no visited set. It terminates on non-negative cycles because a
relaxation must strictly improve, but:

- work is exponential in path count on dense DAGs, which is why its tests build small
  graphs inline instead of using `mediumEWG`
- a negative cycle recurses forever, same as `DijkstraSP`

Between `DijkstraSP` (general) and `AcyclicSP` (DAGs, linear), `SP` no longer has a
niche.

**Solution:** keep it as the naive baseline with a comment saying so, or delete it. Its
21 tests are the most thorough of the three and should move to whichever class
survives.

---

## 5. Vertex numbering is inconsistent across the folder

Two conventions are live at once:

| Class | Convention | Array sizing |
| --- | --- | --- |
| `SP`, `DijkstraSP` | vertices `0..V-1` | `length: G.V` |
| `AcyclicSP`, `TopSort`, `DirectedCycle` | vertices `1..V` | `length: G.V + 1` |

`WDigraph._adj` is `V + 1` long and `data/graphs/parse.ts` shifts every fixture by
`+1`, so `1..V` is the house convention — `SP` and `DijkstraSP` are the outliers. They
work only because they never touch `TopSort`, and their tests are written 0-indexed to
match. This already cost one bug: `AcyclicSP` sized `distTo` at `G.V` while iterating
`1..V`, dropping vertex `V` off the end.

**Solution:** move `SP`/`DijkstraSP` to `1..V` and `G.V + 1`, and update their tests.
Any class mixing the two is a latent out-of-bounds.

---

## 6. `LinkedList` iteration state is shared, not per-iterator

`[Symbol.iterator]()` returns `this`, and `next()` advances a single `_iter` field on
the list (`LinkedLists.ts:19`). An abandoned iteration leaves the cursor parked
mid-list, and the *next* consumer silently gets a partial list:

```
list = [3, 2, 1]
first pass, break at 2  -> [1, 2]
second pass             -> [3]        <- resumes where the break left off
third pass              -> [1, 2, 3]
```

Nested iteration over the same list has the same problem. Nothing in the graph code
triggers it today — `visit`/`dfs` use `continue`, never `break`, and no two loops share
an adjacency list — but it is one `break` away in any future traversal.

**Solution:** return a fresh iterator object from `[Symbol.iterator]()` holding its own
cursor, instead of returning `this`.

---

## 7. All-pairs shortest paths is not implemented

Asked for and designed, not written: an `AllPairsSP` wrapper holding one `DijkstraSP`
per vertex — `O(V·E log V)` to build, `O(V²)` space, answering `hasPath(s, t)` in
`O(1)` and `path(s, t)` in `O(path length)`.

Verified feasible: `DijkstraSP` from every source matched a Floyd-Warshall reference on
200 random digraphs, and reconstructed paths summed to `distTo` from every source on
100 more. Note the density tradeoff — at `E ≈ V²`, Floyd-Warshall's `O(V³)` on a flat
`number[][]` beats `O(V³ log V)` with a heap.

---

## Fixed in this pass, for context

- `SP.dfs` crashed on any graph with a sink — `WDigraph.adj` returned `undefined` for a
  vertex with no outgoing edges. (Since made moot: `WDigraph` now fills `_adj` with
  empty lists.)
- `DijkstraSP` looped forever on any directed cycle — a settled vertex was treated as
  undiscovered and reinserted, with `distTo` overwritten unconditionally. Now relaxes
  first, enqueues second.
- `DijkstraSP` sized its indexed PQ at `G.E`; `qp`/`keys` are vertex-indexed, so it
  needed `G.V`.
- `AcyclicSP` threw on every DAG: seeded `distTo[src] = src` instead of `0`, sized its
  arrays `G.V` while indexing `1..V`, relaxed `TopSort._edges[vtx]` (one DFS discovery
  edge per vertex, empty at roots) instead of every outgoing edge, and walked `sorted`
  forwards when it is reverse topological order.
