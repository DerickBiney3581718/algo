# Dijkstra's Precondition

A working reference on the shortest-path classes in `src/algorithms/graphs/`.

Every shortest-path bug in this folder traces back to one question: does the algorithm
*know* the order to settle vertices in, or is it guessing? Dijkstra guesses, and
non-negative weights are what make the guess safe.

Reference: Sedgewick & Wayne, *Algorithms* 4ed, §4.4. Every number below was produced by
running these classes against the graphs shown, not derived by hand. Open items live in
`etc/shortest-paths-pending.md`.

---

## 1. One skeleton, two algorithms

Prim and Dijkstra are the same program. Indexed priority queue of vertices, an `edgeTo`
array, pop the minimum, relax its outgoing edges. The only thing that differs is what
goes in the key.

| | Prim (MST) | Dijkstra (SP) |
| --- | --- | --- |
| key for `v` | `edge.weight` | `distTo[u] + edge.weight` |
| meaning | cheapest single edge joining `v` to the tree | cumulative cost of the whole path from `src` |
| relax test | `weight < distTo[v]` | `distTo[u] + weight < distTo[v]` |

Change one expression in `relax` and you have converted one into the other. Everything
else — the queue, the decrease-key branch, the path reconstruction — is untouched.

> **The thing to hold onto.** The priority queue holds **vertices**, not edges. One slot
> per vertex is exactly what makes decrease-key possible: you can find `v`'s entry and
> lower it. Push edges instead and you have the lazy variant, where you never update
> anything and instead discard stale pops.

---

## 2. Three ways to write it

All three are correct. They differ in where the bookkeeping lives.

| Formulation | Loop body | PQ size | Cost |
| --- | --- | --- | --- |
| **CLRS** | pure decrease-key — all `V` vertices seeded at `∞` up front, so the insert branch is dead code | `O(V)` always | pays for unreachable vertices |
| **Eager** *(in use here)* | insert on discovery, decrease-key on improvement | discovered only | needs an indexed PQ |
| **Lazy** | never update — push a fresh entry per improvement, skip stale pops via `settled[]` | `O(E)` | plain PQ, no indexing |

There is no fourth variant that skips both the update *and* the staleness check.
Something has to notice that a frontier estimate improved.

---

## 3. Discovered is not settled

The tempting shortcut is to treat `distTo[v] < ∞` as "already handled" and skip. It
isn't. A finite distance means *a* path was found, not the *best* path. There are three
states, and that test collapses two of them.

| state | `distTo[v]` | in PQ? |
| --- | --- | --- |
| undiscovered | `∞` | no |
| **frontier** | finite, **still improvable** | yes |
| settled | finite, final | no |

### Counterexample

```
0 --10--> 1
0 --1--> 2 --1--> 1
```

Pop `0`, relax both edges: `distTo[1] = 10` via the direct edge, `distTo[2] = 1`. Vertex
`1` is now on the frontier with a finite — and wrong — distance.

Later, pop `2` and look at `2→1`, giving `1 + 1 = 2`. Under the shortcut you skip,
because `distTo[1]` is already finite. You report **10**. The answer is **2**.

The comparison has to be against the current best, which is what the real guard does:

```ts
if (this.distTo[edge.to] <= newDist) continue;
```

`∞` is not a special case here. It is just the seed value that every real distance
beats, so one comparison covers both "never seen it" and "seen it, but this route is
worse".

---

## 4. The re-insertion

After a vertex is popped it is no longer in the queue — `delTop` nulls its `qp` slot, so
`contains()` reads `false` for a settled vertex exactly as it does for one never seen.
The two are indistinguishable, and the else-branch fires:

```ts
if (this.idxMinPQ.contains(edge.to))
  this.idxMinPQ.update(edge.to, newDist);   // frontier: decrease-key
else
  this.idxMinPQ.insert(edge.to, newDist);   // new... or settled. Same branch.
```

But reaching that branch requires passing the guard from §3, and that guard demands a
**strict** improvement. So the failure is not "any edge into a settled vertex re-queues
it" — it is "an edge that would genuinely shorten a settled vertex re-queues it".

With non-negative weights that never happens. A popped vertex already holds its final
distance, so no later edge can beat it, the guard fires first, and the insert is
unreachable. The same strictness is what stopped the older infinite loop on ordinary
directed cycles: going around a non-negative cycle cannot improve anything.

> **Where the intuition breaks.** "Strictly decreasing, so it can't happen many times" —
> that step does not hold. With negative edges the number of distinct achievable path
> lengths is exponential, so a distance can strictly decrease exponentially many times.
> Every one of those decreases is honest.

---

## 5. The adversarial graph

A chain of `n` gadgets. Each is one hub-plus-detour unit, and each gadget's exit hub is
the next gadget's entry hub.

```
              +----------- 0 ----------+
              |                        v
           ( h_i )                ( h_i+1 )         w = 2^(n-i)
              |                        ^
              +--- w ---> ( c_i ) --- -2w ---+
```

Weights shrink geometrically down the chain so gadget `i`'s detour always fires *after*
its direct hop has already settled the next hub.

The mechanism, per gadget: `h_i+1` gets key `d` from the free direct hop and is popped
first, because `d < d + w`. It is now settled. Then `c_i` pops at `d + w` and relaxes
`h_i+1` down to `d − w` — a genuine improvement to an already-settled vertex.
Re-inserted, re-settled.

One improving pop of a hub therefore produces two improving pops of the next hub. That
compounds.

### Measured, against the code in this repo

| n | V | E | pops | vs. a settled set |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 4 | 3 | 4 | 4 |
| 4 | 10 | 12 | 46 | 10 |
| 8 | 18 | 24 | 766 | 18 |
| 12 | 26 | 36 | 12,286 | 26 |
| 14 | 30 | 42 | 49,150 | 30 |

Exactly `3·2^n − 2`. Since `V = 2n + 2`, that is roughly `2^(V/2)` — 49,150 pops on a
graph with thirty vertices and forty-two edges. Bellman-Ford would finish the same
instance in `V·E = 1,260` steps.

### The full trace at n = 2

```
0=h_0  1=c_0  2=h_1  3=c_1  4=h_2

edges:  0->2 (0)   0->1 (4)   1->2 (-8)
        2->4 (0)   2->3 (2)   3->4 (-4)

pops:   0 @ 0     2 @ 0     4 @ 0     3 @ 2     4 @ -2
        1 @ 4     2 @ -4    4 @ -4    3 @ -2    4 @ -6
```

Ten pops on five vertices. Vertex `4` is popped four times, at `0, −2, −4, −6` — each a
strict improvement, each passing the guard honestly. Vertex `2` is settled at `0`, then
re-settled at `−4`.

---

## 6. What actually triggers it

Four plausible conditions. Only two hold.

| | Condition | |
| :---: | --- | --- |
| ✓ | **A negative edge somewhere upstream** | Necessary. With all weights non-negative the guard makes re-insertion unreachable. |
| ✓ | **In-degree ≥ 2 at the re-inserted vertex** | Necessary for the first one. Its old value came from relaxing `u→w`; the improvement comes from `v→w`. If `u = v` that vertex was popped twice — but this is the first re-insertion, so nothing has been. Hence `u ≠ v`. |
| ✗ | The negative edge points *into* the re-inserted vertex | Not required — see the trace below. |
| ✗ | A cycle or back edge | Not required. The gadget in §5 is a DAG: with `h_i = 2i` and `c_i = 2i+1`, every edge runs from a lower index to a higher one. |

### A settled vertex improved through a positive edge

Instrumented run — acyclic, one negative edge, nowhere near vertex 1:

```
edges:  0->1 (5)   0->2 (10)   2->3 (-9)   3->1 (+1)

pop 0 @ 0
pop 1 @ 5
pop 2 @ 10
pop 3 @ 1
  !! settled 1 improved 5 -> 2 via edge 3 -(1)-> 1  (weight POSITIVE)
RE-POP 1 at 2
```

The negative edge `2→3` is one hop upstream. It drags `distTo[3]` down to `1` *after*
vertex `1` was settled at `5`, and the ordinary `+1` hop from there still beats it.

So the real trigger is not the position of the negative edge. It is **pop order**: a
vertex is settled, and a later pop turns out to lie on a shorter route to it. Negative
weights are what break the guarantee that this cannot happen.

---

## 7. Cycles are not the problem

The correctness argument never mentions acyclicity. It is only: when `v` is popped it
holds the smallest tentative distance of anything unsettled, and every remaining route
to `v` passes through something unsettled and then along edges that cannot lower the
total — so `distTo[v]` is final. That reasoning needs one property, and it is not "no
cycles". It is "no edge decreases a distance".

Intuitively: a cycle would only matter if going around it could pay. With non-negative
weights it never can, so a shortest path never revisits a vertex. Zero-weight cycles and
self-loops are fine for the same reason — a lap cannot strictly improve anything, so
nothing re-queues.

| Weights | Structure | Outcome |
| --- | --- | --- |
| non-negative | cycles fine | correct, `O(E log V)` |
| negative, no negative cycle | even a DAG | correct, but up to `2^(V/2)` pops |
| negative cycle | — | never terminates |

Negativity is the axis that matters. Cycles matter only in that they are what lets
negativity become a *negative cycle* — every lap lowers every distance, the guard always
passes, and the queue never drains.

---

## 8. Order, not count

Sedgewick notes that the proof for edge-weighted DAGs does not depend on non-negative
weights, so the restriction lifts. It is tempting to credit that to relaxing each edge
exactly once. The causation runs the other way: single-visit is a *consequence* of having
the right order, and both facts descend from the same parent.

That parent: **topological order tells you the settling order in advance, and it is
correct by construction.** Every path into `v` arrives from vertices that precede `v`
topologically, so by the time you relax `v`'s outgoing edges, every route into `v` is
already accounted for. No weight signs appear anywhere in that argument.

Dijkstra must *discover* the order at runtime, and its only instrument is "the smallest
tentative distance is final". That claim is what needs the precondition.

### Single-visit is not sufficient

A DAG, each edge relaxed exactly once, in the wrong order:

```
edges:  1->2 (0)   1->3 (5)   3->2 (-10)      correct: distTo[2] = -5

relax 1->2    distTo[2] = 0
relax 3->2    distTo[3] is INFINITY, no-op
relax 1->3    distTo[3] = 5

              result: distTo[2] = 0     wrong
```

### Single-visit is not necessary

Bellman-Ford handles negative weights and relaxes every edge `V−1` times. Tolerance for
negative weights plainly is not coming from the visit count.

So the order is what buys correctness; the count is what buys `O(V + E)` instead of
`O(E log V)` — the priority-queue factor you are paying Dijkstra and do not need on a
DAG.

> **The two preconditions are complements.** **Dijkstra** needs non-negative weights,
> allows cycles, `O(E log V)`. **AcyclicSP** needs a DAG, allows negative weights,
> `O(V + E)`. The only case neither covers is negative weights *with* cycles —
> Bellman-Ford and Johnson's territory.
>
> Confirmation: the gadget in §5 that costs `2^(V/2)` pops is a DAG. `AcyclicSP` solves
> that exact instance in linear time, negative weights and all. Same graph; the only
> difference is that one algorithm is told the order and the other tries to infer it.

---

## 9. Infinity is load-bearing

`hasPathTo` tests `distTo[vtx] < Number.POSITIVE_INFINITY`. The worry is reasonable:
`AcyclicSP` relaxes every vertex in topological order, including ones with no connection
to `src`, so does a finite distance really mean a path exists?

It does, and nothing explicit enforces it — the arithmetic does:

```ts
const newDist = this.distTo[edge.from] + edge.weight;  // Infinity + w === Infinity
const updated = toDist > newDist;                      // Infinity > Infinity === false
```

`Infinity` absorbs addition, negative weights included (`Infinity + (-100) === Infinity`),
and the comparison is strict. So relaxations out of unreachable vertices are silent
no-ops. Only `src` is seeded finite, and a vertex goes finite only by relaxing an edge
whose `from` was already finite — which gives the induction: **finite distance ⟺ a real
chain of edges back to `src`**, exactly what `pathTo` then walks.

Checked against BFS reachability that ignores weights entirely: **4,000 vertex checks
across 400 random DAGs, 200 of them with negative weights, zero mismatches.** And the
case the worry is really about:

```
G = 1->2 (5), 3->4 (-100),  src = 1

distTo    = [0, 5, Infinity, Infinity]
hasPathTo = [true, true, false, false]
```

> **The one thing that would break it.** This rests entirely on `POSITIVE_INFINITY` being
> a real infinity. Swap in a large sentinel — `Number.MAX_SAFE_INTEGER`, or the `1e9`
> common in competitive code — and `MAX + (-100) < MAX` is **true**. Unreachable vertices
> pick up finite distances and `hasPathTo` starts lying. With non-negative weights a
> sentinel survives by luck; with negative weights it fails immediately.

---

## 10. Which class to reach for

| Class | Requires | Allows | Cost |
| --- | --- | --- | --- |
| `DijkstraOG` | non-negative weights, checked in the constructor | cycles | `O(E log V)`, guaranteed |
| `DijkstraSP` | nothing enforced — faithful to the book | negative weights (behaves as SPFA) | no polynomial bound; hangs on a negative cycle |
| `AcyclicSP` | a DAG | negative weights | `O(V + E)` |

The split is deliberate. `DijkstraOG` carries the `marked` array that
`IndexedPriorityQueue` cannot express — a separate settled set, rather than asking the
queue a question it has no way to answer. `DijkstraSP` stays 1:1 with Sedgewick, with the
caveats stated in its class comment instead of patched in code.

### All-pairs

"All pairs" is just "all sources", so `V` shortest-path trees answer every query:
`O(V·E log V)` to build, `O(V²)` space, then `hasPath` and `dist` in `O(1)` and `path` in
`O(path length)`.

```ts
// Sedgewick's DijkstraAllPairsSP, p.656
constructor(G: WDigraph) {
  this.all = Array.from({ length: G.V }, (_, v) => new DijkstraOG(G, v));
}

dist(s: number, t: number) { return this.all[s].distTo[t]; }
path(s: number, t: number) { return this.all[s].pathTo(t); }
```

Two things decide whether it is the right build. **Density** — at `E ≈ V²` this is
`O(V³ log V)`, and Floyd-Warshall's `O(V³)` on a flat `number[][]` wins on constants
alone, three nested loops over contiguous memory against `V` heaps. And **weight signs** —
if negatives are in scope, Dijkstra-per-source is the wrong tool at any speed.

The fix there is **Johnson's algorithm**, not a different loop: one Bellman-Ford pass from
a virtual source computes a potential `h(v)`, every edge is reweighted to
`w'(u,v) = w(u,v) + h(u) − h(v)` — provably non-negative, and shortest paths are
preserved — then Dijkstra runs `V` times on the reweighted graph. Same `O(V·E log V)`,
correct on negative weights, and the Bellman-Ford pass detects negative cycles for free.
