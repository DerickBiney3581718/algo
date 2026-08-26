# Kosaraju–Sharir SCC: why the reverse graph, and why reverse postorder

Working notes for `src/algorithms/graphs/SCC.ts`. Companion to `src/algorithms/graphs/TopSort.ts`,
which already contains the `reversePost` machinery (postorder pushed onto a `Stack`).

## 0. The reference implementation

```java
DepthFirstOrder order = new DepthFirstOrder(G.reverse());
for (int s : order.reversePost())
    if (!marked[s]) { dfs(G, s); count++; }
```

Two passes:

1. DFS over **G^R** purely to compute an *ordering*.
2. DFS over **G** in that ordering; each top-level `dfs` call marks exactly one SCC.

That single `G.reverse()` line exists for one reason: **to produce an order that visits the sink
components of G first.** Nothing else. It does not find components, it does not change them.

---

## 1. Definitions

**Reverse (transpose) graph `G^R`** — every edge `u→v` becomes `v→u`. Defined per *edge*, not per
path. Path reversal is a consequence: `1→2→3` becomes `3→2→1` (same vertices, read backwards).

> A cycle is the misleading case: `1→2→3→1` reversed still reads `1→3→2→1` starting from 1, which
> makes it look like the path "stayed". It didn't — the edges flipped, the cycle just happens to
> return to its start either way.

**SCC** — maximal set where every pair `u, v` satisfies `u ⇝ v` and `v ⇝ u`.

**Reversing preserves SCCs.** If `u ⇝ v` and `v ⇝ u` in G, both still hold in G^R. So G and G^R
have *identical* components. This is exactly what makes `G.reverse()` a legal move — you are
allowed to compute the ordering on a different graph because the answer you're after is the same
in both.

**Kernel DAG** (condensation, component graph, `G/~`) — collapse each SCC to one node; draw
`C → C'` when G has any edge from `C` to `C'`. Never explicitly constructed; it exists only in the
proof.

*It is always acyclic*: a cycle `C → C' → … → C` would give `u ⇝ v` and `v ⇝ u` for `u ∈ C`,
`v ∈ C'` — so they'd be the same component. Contradiction. SCCs are precisely the maximal cyclic
chunks; quotient them out and only an acyclic skeleton remains.

## 2. Running example

```
G:   1 ⇄ 2 ──→ 3 ⇄ 4          edges: 1→2, 2→1, 3→4, 4→3, 2→3
     └─ A ─┘   └─ B ─┘        SCCs:  A = {1,2},  B = {3,4}

kernel DAG:  [A] ──→ [B]      A is the source, B is the sink
```

## 3. The problem plain DFS has

DFS from `v` collects everything **reachable** from `v` — that is `SCC(v) ∪ everything downstream`.

| start | reaches | verdict |
|---|---|---|
| 1 | 1,2,3,4 | over-collects, merges A and B ✗ |
| 3 | 3,4 | exactly B ✓ |

`B` is a **sink** in the kernel DAG — no out-edges, so "reachable from 3" has nowhere to escape to.

> **DFS yields exactly one SCC iff it starts in a sink component of the remaining graph.**

Peel that component off (leave it marked), and some other component becomes the new sink. Removing
a sink from a DAG leaves a DAG, which always has another sink — so the induction never stalls.
That is precisely what the outer loop's repeated `dfs(G, s)` calls are doing.

So the whole algorithm reduces to: **find an order that always hands me a sink next.**

---

## 4. Confusion #1 — the finish-time fact, and why it forces a *reverse*

> For SCCs `C → C'` in the kernel DAG: `max finish(C) > max finish(C')`.

Proof by the only two cases (`C → C'` means there is no path back `C' ⇝ C`, else they'd be one
component):

- **DFS enters `C` first.** From `C` it can reach `C'`, so it recurses into `C'` and finishes all
  of `C'` before backing out and finishing the entry vertex of `C`. → `max finish(C)` is larger.
- **DFS enters `C'` first.** `C'` cannot reach `C` at all, so `C'` is entirely finished before any
  vertex of `C` is even touched. → `max finish(C)` is larger.

Either way the **upstream** component wins. Therefore:

> The globally highest finish time always lands in a **source** component.

And `reversePost` = decreasing finish time, so **`reversePost(G)` starts in a source of G** — the
single worst place to start a DFS, since a source reaches everything downstream.

Confirm on the example:

```
DFS on G from 1:   1 → 2 → 3 → 4
postorder:         4, 3, 2, 1
reversePost:       1, 2, 3, 4     ← starts at 1 ∈ A, a source. dfs(1) engulfs all four. ✗
```

**This is why the reverse is needed.** Finish times hand you sources; you need sinks. Reversing
every edge reverses the kernel DAG too, so sources and sinks swap:

```
kernel DAG of G:    [A] → [B]      source A, sink B
kernel DAG of G^R:  [B] → [A]      source B, sink A
```

`reversePost(G^R)` starts in a source of G^R = **a sink of G**. Exactly what section 3 asked for.

## 5. Confusion #2 — the G^R trace, step by step

Build `G^R` by flipping each edge of G one at a time:

| G | G^R |
|---|---|
| 1→2 | 2→1 |
| 2→1 | 1→2 |
| 3→4 | 4→3 |
| 4→3 | 3→4 |
| 2→3 | **3→2** |

Adjacency lists of G^R: `adj(1)={2}`, `adj(2)={1}`, `adj(3)={4,2}`, `adj(4)={3}`.
Note the only cross-component edge now points **B → A** (`3→2`), which is the kernel reversal.

`DepthFirstOrder`'s outer loop walks vertices `1..V` and calls `dfs` on unmarked ones:

```
v=1  dfs(1): mark 1; adj(1)={2} → dfs(2): mark 2; adj(2)={1} marked, return
                                          post ← 2
             post ← 1
v=2  marked, skip
v=3  dfs(3): mark 3; adj(3)={4,2}
             → dfs(4): mark 4; adj(4)={3} marked, return
                       post ← 4
             → 2 already marked, skip          ← the 3→2 edge dies here
             post ← 3
v=4  marked, skip

postorder:    2, 1, 4, 3        (finish order; 3 finished last)
reversePost:  3, 4, 1, 2        (that stack, popped)
```

`3 ∈ B`, and B is the sink of G. Now the **second pass, on G** (`adj(1)={2}, adj(2)={1,3},
adj(3)={4}, adj(4)={3}`), visiting roots in `3, 4, 1, 2`:

```
s=3  dfs(3) → {3, 4}          id 0  = B ✓   (nothing leads out of B)
s=4  marked, skip
s=1  dfs(1) → {1, 2}          id 1  = A ✓   (2→3 dies on a marked vertex)
s=2  marked, skip
count = 2
```

The `2→3` edge is what *would* have merged the components — it is neutralised because B was
already consumed. That is the "delete the sink and repeat" step, implemented as nothing more than
the shared `marked[]` array.

## 6. Non-uniqueness of `reversePost` is not a problem

`reversePost` depends on the outer-loop start vertex and on adjacency order. Restart the G^R pass
at 3:

```
dfs(3): mark 3; adj(3)={4,2} → dfs(4) post←4 ; dfs(2) → dfs(1) post←1, post←2
        post ← 3
postorder:    4, 1, 2, 3
reversePost:  3, 2, 1, 4        ← different order than section 5
```

Second pass on G with `3,2,1,4`: `dfs(3)={3,4}` ✓, `dfs(2)={2,1}` ✓. **Same components.**

The guarantee was never "reversePost is unique". It is the *component-level* statement implied by
section 4's finish-time fact:

> For SCCs `C → C'`, **every** vertex of `C` precedes **every** vertex of `C'` in `reversePost`.

Vertices *within* a component may shuffle freely — that's the observed non-determinism — but
components never interleave. So whatever `reversePost` you get is always **some** topological order
of the kernel DAG, and any topological order works.

Same situation as `TopSort.ts`: a DAG generally has many valid topological orders, and which one
you get depends on the `for (let vtx = 1; vtx <= G.V; vtx++)` loop. Not a defect — the spec is
"some order respecting all edges", not "the order". Kosaraju applies that same guarantee at the
granularity of components rather than vertices.

`TopSort` rejects cyclic input outright; Kosaraju instead *finds* the cycles, quotients them away,
and topologically sorts what's left. Hence the shared `reversePost` machinery.

## 7. Orientation variants (don't mix halves)

Both are correct, and they are mirror images:

| | pass 1 | pass 2 |
|---|---|---|
| Sedgewick | `reversePost` of **G^R** | DFS on **G** |
| CLRS | `reversePost` of **G** (decreasing finish) | DFS on **G^R** |

`reversePost(G^R)` is **not** the reverse of `reversePost(G)` — you genuinely have to run DFS on
the reversed graph. Pick one row and keep both halves.

## 8. Implementation notes for `SCC.ts`

- This repo's `Digraph` is **1-indexed** (see `TopSort.ts`: `for (let vtx = 1; vtx <= G.V; vtx++)`),
  unlike Sedgewick's 0-indexed Java. Size arrays `G.V + 1`.
- `TopSort` already computes reverse postorder — postorder pushed onto a `Stack`, so popping
  yields `reversePost`. Either factor that out into a `DepthFirstOrder` class or duplicate the
  DFS locally; `TopSort` itself can't be reused directly because it throws on cyclic input.
- `G.reverse()` needs to exist on `Digraph` — check `src/data-structures/graphs/Digraph.ts`.
- Recursion depth: both passes are recursive DFS; deep graphs can blow the JS stack.
- Runtime: two DFS passes plus building the reverse graph — **Θ(V + E)**, same as one DFS.
- The `id[]` array gives O(1) `stronglyConnected(v, w)` afterwards, which is the real payoff.
- `stronglyConnected()` answers *mutual* reachability only. One-way reachability ("is there a path
  v ⇝ w?") is a different, much harder problem — see `etc/transitive-closure-reachability.md`.

## Resources

- Sedgewick & Wayne, *Algorithms, 4th ed.* §4.2 Directed Graphs — https://algs4.cs.princeton.edu/42digraph/
  - `KosarajuSharirSCC.java` — https://algs4.cs.princeton.edu/42digraph/KosarajuSharirSCC.java.html
  - `DepthFirstOrder.java` — https://algs4.cs.princeton.edu/42digraph/DepthFirstOrder.java.html
  - `Digraph.java` (incl. `reverse()`) — https://algs4.cs.princeton.edu/42digraph/Digraph.java.html
  - Princeton lecture slides, Directed Graphs — https://algs4.cs.princeton.edu/lectures/keynote/42DirectedGraphs.pdf
- CLRS, *Introduction to Algorithms* §20.5 (§22.5 in the 3rd ed.), "Strongly connected components" —
  the formal proof of the finish-time lemma in section 4 above.
- Wikipedia, Kosaraju's algorithm — https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
- Wikipedia, Strongly connected component / condensation — https://en.wikipedia.org/wiki/Strongly_connected_component
- Alternatives worth knowing: **Tarjan's SCC** (single pass, lowlink) —
  https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm — and the
  **path-based** algorithm — https://en.wikipedia.org/wiki/Path-based_strong_component_algorithm
