# Reachability and transitive closure: why undirected is easy and directed is not

> **Query to support:** *given a digraph, is there a directed path from `v` to `w`?*

Companion to `etc/kosaraju-scc.md`. Reference implementations in this repo:
`src/algorithms/graphs/CC.ts` (undirected, solved), `src/algorithms/graphs/SCC.ts` (directed,
solves the *symmetric* version), `src/algorithms/graphs/PathFind.ts` (single-source).

---

## 1. What transitive closure is

Treat the edge set as a **relation**. `v R w` means "G has an edge `v→w`".

A relation is **transitive** when `v R x` and `x R w` always imply `v R w`. Edge sets usually
aren't. The **transitive closure** `R*` is the *smallest* transitive relation containing `R` — keep
adding the implied pairs until the property holds, and add nothing else.

In graph terms:

> **G\*** is a digraph on the same vertices with an edge `v→w` **iff `w` is reachable from `v` in
> G**. Normally the *reflexive*-transitive closure is meant, so `v→v` for every `v` as well.

```
G:    1 → 2 → 3 → 4

G*:   1 → 2   1 → 3   1 → 4
              2 → 3   2 → 4
                      3 → 4        (+ 1→1, 2→2, 3→3, 4→4 if reflexive)
```

3 edges become 6 (or 10 with self-loops). A path of length V produces ~V²/2 closure edges — the
closure is generally **much denser** than the graph, which is the whole source of the difficulty.

So the query *"is there a path `v ⇝ w`?"* is literally *"is `v→w` an edge of G\*?"*. Reachability
and transitive closure are the same problem wearing two names.

**Standard representation:** a `V × V` boolean matrix, row `v` = the set of vertices reachable
from `v`. Query = one array lookup.

### Related closures (for vocabulary)

| closure | adds pairs until | graph meaning |
|---|---|---|
| reflexive | `v R v` for all `v` | every vertex reaches itself (path of length 0) |
| symmetric | `v R w ⟹ w R v` | undirected version of the graph |
| transitive | `v R x, x R w ⟹ v R w` | reachability |
| **equivalence** (all three) | — | **connected components** |

That last row is the punchline of section 3.

---

## 2. One DFS answers one query — in either case

Worth getting out of the way first, because the instinct is correct:

```
reachable(v, w):  run DFS from v on G;  return marked[w]
```

Θ(V + E) time, Θ(V) space, and it works **identically for directed and undirected graphs**. DFS
follows `adj()`; whether those edges are one-way changes nothing about the traversal. `PathFind.ts`
already does this (single-source reachability plus the path itself).

The directed/undirected split is **not** about whether DFS can answer the question. It is about
whether you can **preprocess once** and then answer *every* query in O(1).

---

## 3. Undirected: reachability is an equivalence relation

In an undirected graph every edge goes both ways, so reachability is:

- **reflexive** — `v ⇝ v` (empty path)
- **transitive** — `v ⇝ x`, `x ⇝ w` ⟹ `v ⇝ w` (concatenate)
- **symmetric** — `v ⇝ w` ⟹ `w ⇝ v` ← **this one is free only here**

All three ⟹ an **equivalence relation** ⟹ it **partitions** the vertex set into disjoint classes.

A partition is encodable as *one integer per vertex*. That is exactly `CC.ts`:

```ts
for (let vtx = 1; vtx < G.V + 1; vtx++)
  if (!this.marked[vtx]) { this._count++; this.dfs(vtx); }   // CC.ts:14-19

dfs(vtx) { this.marked[vtx] = true; this._id[vtx] = this._count; ... }   // CC.ts:22-24

connected(a, b) { return this.id(a) === this.id(b); }         // CC.ts:38
```

- preprocessing: **one** DFS pass total, Θ(V + E)
- space: Θ(V) — the `_id[]` array
- query: O(1)

The closure itself still contains up to V² pairs. You never store them because the partition
*determines* every one of them. That compression is the entire trick, and it is available only
because of symmetry.

---

## 4. Directed: reachability is a preorder, not an equivalence

In a digraph reachability keeps reflexivity and transitivity but **loses symmetry**. In the chain
above, `1 ⇝ 4` yet `4 ⇝̸ 1`.

Reflexive + transitive without symmetry = a **preorder** (quasi-order). A preorder does **not**
partition anything — the "classes" overlap and nest. There is no assignment of integers to
vertices for which `id[v] === id[w]` decides one-way reachability, so the `CC` trick is not merely
slow here, it is **structurally unavailable**.

### Where SCC sits

`SCC.ts` recovers symmetry by force: **mutual** reachability (`v ⇝ w` **and** `w ⇝ v`) *is* an
equivalence relation. That's why `KosarajuSCC` can have the exact shape of `CC` —
`stronglyConnected(v, w)` is an `id[v] === id[w]` comparison, and it's O(1) after Θ(V + E)
preprocessing.

But it answers a **strictly weaker question**: "are `v` and `w` on a common cycle?", not "is there
a path from `v` to `w`?".

### SCC is a partial answer, not a failure

It is worth being precise about *how* SCC falls short, because it is not useless across
components — it is a correct fast path in one direction:

| test | verdict |
|---|---|
| `id[v] === id[w]` | **yes**, `v ⇝ w` — decided in O(1) |
| `id[v] !== id[w]` | **unknown** — may be reachable (downstream) or not |

So the same-component case is decided for free. What remains is reachability *between* components.

That residue is not hopeless either. Reachability lifts cleanly to the kernel DAG (see `etc/kosaraju-scc.md` §1):

```
v ⇝ w  in G   ⟺   id[v] ⇝ id[w]  in the kernel DAG
```

So SCC **reduces** the problem to transitive closure of a **DAG** on possibly far fewer nodes —
worth doing as a preprocessing step when the graph is cycle-heavy. It does not eliminate the
problem: a DAG's transitive closure is still the same computation, just on a smaller graph.

And the reduction is not what's expensive. See §6 — the residual cross-component problem is hard
for an information-theoretic reason, not because SCC happens to miss it.

---

## 5. What it actually costs

| approach | preprocess | space | query | when |
|---|---|---|---|---|
| DFS per query (`PathFind`) | — | Θ(V) | Θ(V + E) | few queries |
| V separate DFS's | Θ(V(V + E)) | **Θ(V²)** | O(1) | many queries, small V |
| Warshall (matrix) | Θ(V³) | Θ(V²) | O(1) | dense, matrix already on hand |
| SCC + closure of kernel DAG | Θ(V + E) + closure of kernel | depends | O(1) | cycle-heavy digraphs |
| `CC` — **undirected only** | Θ(V + E) | Θ(V) | O(1) | undirected |

### The blunt standard solution

Sedgewick's `TransitiveClosure` is disarmingly simple: **run a full DFS from every vertex** and
keep all V `marked[]` arrays as the rows of the matrix.

```ts
// sketch — one DirectedDFS per source vertex
class TransitiveClosure {
  private all: DirectedDFS[];             // all[v].marked(w) === (v ⇝ w)
  constructor(G: Digraph) {
    this.all = [];
    for (let v = 1; v <= G.V; v++) this.all[v] = new DirectedDFS(G, v);
  }
  reachable(v: number, w: number) { return this.all[v].marked(w); }
}
```

Θ(V(V + E)) time and **Θ(V²) space**. Note these differ: the *space* is quadratic, but the
*preprocessing time* is only ~quadratic on a sparse graph and becomes Θ(V³) on a dense one. The
space is what usually kills it: 10⁶ vertices needs 10¹² bits (~125 GB) regardless of how sparse
the graph is.

**The matrix is not required — it buys O(1) queries, nothing else.** Per-query DFS is Θ(V + E)
time and Θ(V) space and is frequently the better trade. For Q queries:

```
per-query DFS:   Q · (V + E)
precomputed:     V · (V + E)  once, then O(1) each
```

Break-even is around **Q ≈ V** queries — and only if V² bits actually fit in memory. Below that,
or on any large sparse digraph, just run the DFS.

### Warshall's algorithm

The matrix formulation, for when V is small and E is large:

```
for x in V:                       # intermediate vertex — MUST be the outer loop
  for v in V:
    if reach[v][x]:
      for w in V:
        reach[v][w] |= reach[x][w]
```

Θ(V³), independent of E. It's Floyd–Warshall with `min/+` replaced by `or/and`. The loop order
matters: `x` outermost is what makes the induction ("paths using only intermediates seen so far")
valid.

---

## 6. Why there is no better answer

### The Ω(V²) counting argument

The tempting summary is *"we need the matrix because SCC can't answer cross-component queries."*
That gets cause and effect backwards. If SCC merely *happened* to miss that case, you would expect
some other clever linear-size structure to finish the job. There isn't one, and the reason is
information-theoretic rather than algorithmic:

- Reachability in a digraph can be **any preorder** on V vertices, and there are **2^Θ(V²)** of them.
- Any structure answering every query correctly must distinguish all of them.
- Therefore it needs **Ω(V²) bits** in the worst case — no algorithm can beat this.

Contrast §3. Undirected reachability is an *equivalence* relation, and there are only
**2^Θ(V log V)** partitions of V elements — which fits in Θ(V) integers, i.e. `CC.ts`'s `_id[]`.
The compression isn't cleverness; the information simply isn't there to begin with.

> **The matrix is Θ(V²) because the answer is Θ(V²).** SCC's inability to settle cross-component
> queries is a *symptom* of the relation being a preorder, not the cause of the cost.

(The bound is worst-case over all digraphs. Restricted classes — planar, bounded treewidth, trees,
interval graphs — carry less information and do admit compact reachability labelings.)

### The open problem

Beyond that lower bound, no algorithm is known that achieves both near-linear preprocessing *and*
constant-time queries for reachability on general digraphs. Sedgewick flags this explicitly.

Fischer & Meyer (1971) proved transitive closure is **computationally equivalent to boolean matrix
multiplication** — each reduces to the other within a constant factor. So the closure inherits
that problem's difficulty: sub-cubic is achievable via fast matrix multiplication
(Strassen/Coppersmith–Winograd style), but linear time with O(1) queries is not known and would be
a major result.

**Practical guidance:**

- few queries → DFS each time (Θ(V + E) per query, Θ(V) space)
- many queries, V small enough that V² bits fit → precompute the matrix
- large sparse digraph → compute SCCs first, work on the kernel DAG, accept per-query DFS if the
  kernel is still large
- undirected → `CC`, and stop thinking about it

---

## Resources

- Sedgewick & Wayne, *Algorithms, 4th ed.* §4.2 Directed Graphs — https://algs4.cs.princeton.edu/42digraph/
  - `TransitiveClosure.java` (the V-DFS's solution) — https://algs4.cs.princeton.edu/42digraph/TransitiveClosure.java.html
  - `DirectedDFS.java` (single-source reachability) — https://algs4.cs.princeton.edu/42digraph/DirectedDFS.java.html
  - `CC.java` (undirected connected components) — https://algs4.cs.princeton.edu/41graph/CC.java.html
  - Princeton lecture slides, Directed Graphs — https://algs4.cs.princeton.edu/lectures/keynote/42DirectedGraphs.pdf
- CLRS, *Introduction to Algorithms*
  - Transitive closure via Floyd–Warshall — §25.2 (3rd ed.) / §23.2 (4th ed.)
  - Strongly connected components — §22.5 (3rd ed.) / §20.5 (4th ed.)
- Wikipedia, Transitive closure — https://en.wikipedia.org/wiki/Transitive_closure
- Wikipedia, Floyd–Warshall algorithm — https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
- Wikipedia, Reachability (incl. the Thorup and Kameda approaches for planar/special cases) —
  https://en.wikipedia.org/wiki/Reachability
- Wikipedia, Preorder (the reflexive-transitive-but-not-symmetric structure of §4) —
  https://en.wikipedia.org/wiki/Preorder
- Fischer & Meyer, "Boolean matrix multiplication and transitive closure" (1971), *12th SWAT* —
  the equivalence result — https://doi.org/10.1109/SWAT.1971.4
- Purdom's algorithm (transitive closure via SCC condensation + topological order) —
  https://en.wikipedia.org/wiki/Transitive_closure#Algorithms
- Compact labelings for restricted graph classes (the escape hatch noted in §6) —
  Cohen, Halperin, Kaplan & Zwick, "Reachability and distance queries via 2-hop labels" (2002) —
  https://doi.org/10.1137/S0097539702403098
