# Indexed priority queues: what actually goes in the heap?

Working notes for `src/data-structures/priority-queues/IndexedPriorityQueue.ts` and its first real
client, `src/algorithms/graphs/PrimMST.ts`.

Companion docs: `etc/priority-queue-review.md` (bugs and inheritance issues),
`etc/indexed-pq-init-order.md` (a construction-order bug).

This one is about a **design** question, not a bug: when a priority queue is indexed by a key, which
of the three moving parts do you *store*, and which do you *compute*?

---

## 1. Start with the plain priority queue

A priority queue (PQ) is a waiting room where you can only ever ask one question:

> "Who's next?"

Give it items, and it hands them back in priority order. Internally it's a **binary heap**: an array
where the item at position `p` always outranks the items at `2p` and `2p+1`.

```
chair:    1     2     3     4     5
        ┌────┬─────┬─────┬─────┬─────┐
        │  2 │  5  │  3  │  9  │  7  │      (min-heap: parent <= children)
        └────┴─────┴─────┴─────┴─────┘
           └──┬──┘  │
        1's children are 2 and 3
        2's children are 4 and 5
```

That's the whole trick. Nobody is fully sorted — only the *parent-beats-children* rule holds, which
is enough to make "who's next?" always chair 1, and cheap to restore after a change (`swim` / `sink`,
`_bubbleUp` / `_bubbleDown` in our code).

### What a plain PQ cannot do

You cannot walk up to it and say *"patient #47 just got worse, move them up."* There's no way to find
#47. Scanning the array is `O(n)`, and even then you'd have to fix the heap by hand.

That limitation is the entire reason indexed PQs exist.

---

## 2. The indexed priority queue, as a coat check

Picture the same waiting room, but now:

- every patient wears a **badge number** (the *key*) — `#47`, `#12`, `#3`
- the front desk keeps a **board**: *"badge #47 is currently sitting in chair 3."*

Now "patient #47 got worse" is: read the board (chair 3), change their score, then let them swim up.
`O(log n)`, no scanning.

The board is `keyHeapPos` in our code. **The single rule that makes it work:**

> Every time two people swap chairs, the board must be updated for *both* of them.

Forget that once and the board points at the wrong chair — silently. No exception, no crash, just
wrong answers later.

```
   heap (chairs)                board (keyHeapPos)
   ┌───┬────┬────┬────┐         #3  -> chair 1
 1 │#3 │ #47│ #12│ #9 │         #47 -> chair 2
   └───┴────┴────┴────┘         #12 -> chair 3
                                #9  -> chair 4

   swap chairs 1 and 2  ──────► board MUST become #47 -> 1, #3 -> 2
```

---

## 3. The three questions

Any indexed PQ has to be able to answer three things. This framing is the whole doc:

| # | Question | Direction |
|---|----------|-----------|
| **Q1** | Which badge is in chair `p`? | position → key |
| **Q2** | Which chair is badge `k` in? | key → position |
| **Q3** | What is badge `k`'s priority? | key → priority |

**Q1** is what *swap maintenance* needs: to fix the board after two people change chairs, you must know
whose badges just moved (§2). It's also what `delMin` hands back. **Q2** is what makes the queue
*indexed* — the whole point. **Q3** is what a comparison reads; comparing chair 3 against chair 6 is
Q1 then Q3, composed.

Note Q1 and Q2 are inverses of each other. Storing both is deliberate redundancy — it buys `O(1)` in
both directions, which is what keeps `swap` and `decreaseKey` cheap.

**Different designs differ only in which of these are stored in an array and which are derived.**
That's it. Everything below is a re-shuffling of those three.

---

## 4. Layout A — the textbook one (Sedgewick's `IndexMinPQ`)

```java
int[]  pq;    // pq[pos] = key        Q1
int[]  qp;    // qp[key] = pos        Q2   (inverse of pq)
Key[]  keys;  // keys[key] = priority Q3
```

The heap array holds **badge numbers**, not people. To compare chair 3 with chair 6:

```
keys[ pq[3] ]   vs   keys[ pq[6] ]
      └── badge in chair 3
```

Two hops: chair → badge → priority.

**Why it's shaped that way:** because `pq[pos] = key` is stored, `swap(i, j)` can fix the board with
no lookup at all — it already knows both badges, they're the values being swapped:

```java
swap(i, j) { exch(pq[i], pq[j]); qp[pq[i]] = i; qp[pq[j]] = j; }
```

Three arrays, but every operation is index arithmetic on ints. Nothing is searched.

---

## 5. Layout B — your proposal: put the real items in the heap

> "If the PQ took a `compare` function, the heap could hold edges directly and order them by weight.
> Then `keyValues` is redundant — use `keyHeapPos` to reach the edge in the heap array."

Restated in the table:

```
heap[pos]        = item       stores neither Q1 nor Q3 — but yields both
keyHeapPos[key]  = pos        Q2 stored
                              Q1 derived: keyOf(heap[pos])
                              Q3 derived: compare(heap[i], heap[j]) reads item.weight
```

Two arrays instead of three. **B's entire saving is "don't store Q1, compute it."** That's the
definition of the layout, not a footnote — which is why the next section is about whether Q1 *can* be
computed.

### The hidden requirement

Go back to the rule from §2: on every swap, update the board for both movers. To do that you must
answer *"which badge is this item?"*:

```ts
swap(i, j) {
  [heap[i], heap[j]] = [heap[j], heap[i]];
  keyHeapPos[ keyOf(heap[i]) ] = i;   // <-- keyOf
  keyHeapPos[ keyOf(heap[j]) ] = j;
}
```

Layout A gets `keyOf` **free**, because the thing in the heap *is* the badge. Layout B needs a
`keyOf(item)` function.

So the saving is conditional:

- **`keyOf` exists** → 2 arrays. Real win.
- **`keyOf` doesn't exist** → you must store `keyAtPos[pos] = key` alongside. That array is `pq[]`
  from Layout A wearing a hat. **You're back to three.** The redundancy didn't vanish, it moved.

### Triage: `keyOf` exists

Your class doc uses patient triage as the example, and it's the case that flatters Layout B most:

```ts
keyOf = (patient) => patient.id     // intrinsic to the object
compare = (a, b) => a.severity - b.severity
```

A patient's id is a property *of the patient*. Two arrays, clean.

### Prim: `keyOf` exists, but it isn't free

The tempting objection is that Prim breaks Layout B. In `PrimMST` the key for an edge is
*"the endpoint that isn't in the tree yet"*:

```ts
this.pq.insertWithKey(other, edge);   // other = edge.other(vtx)
```

`other` depends on which endpoint is already in the tree — a fact about the *tree*, not about the
edge. So `keyOf(edge)` is not pure in the strict sense: `2—3` has key `3` when discovered from vertex
2, and key `2` if it had been discovered from vertex 3.

**But strict purity isn't what swap maintenance needs.** It needs the key to be *unambiguous and
stable for as long as the item sits in the heap*. In **eager** Prim it is:

1. Edges are only inserted while scanning outward from a tree vertex `v`, so at insert time
   **exactly one endpoint is in the tree**.
2. Edges with both endpoints already in the tree are skipped — never inserted.
3. A vertex `w` joins the tree only when its entry is **popped**. So for the entire time an edge sits
   in the heap keyed by `w`, `w` is outside the tree.

So `keyOf` is well-defined at every moment it's called:

```ts
keyOf = (e) => inTree[e.either()] ? e.other(e.either()) : e.either()
```

And the same edge can never be in the heap under two different keys: "candidate for `v`" requires `w`
in the tree, "candidate for `w`" requires `v` in the tree, and those are mutually exclusive.

**Layout B works for eager Prim.** The caveat is not correctness-in-principle but *timing*:

> `keyOf` closes over the tree-membership array, so **when you mark a vertex matters.**

In `PrimMST` today the marking is `edgeTo[newVtx] = treeVtx` (line 51), and it lands *after* the pop.
Move any marking write to before a sift and every `keyOf` call inside that sift flips — the board
silently points at the wrong chairs. That's the same class of temporal coupling as the bug recorded in
`etc/indexed-pq-init-order.md`.

So the real trade is:

| | cost |
|---|---|
| store `keyAtPos[pos]` at insert | one extra array — and it's just Layout A's `pq[]` |
| derive it with `keyOf` | one temporal invariant you must never violate |

Boring beats clever here unless the array actually hurts. And note what this costs B rhetorically: a
`keyOf` that reads client state gives the queue the **same** external-state dependence that §6 flags as
Layout C's one weakness. B doesn't escape it; it just hides it inside a closure.

*(Lazy Prim is different — it inserts every crossing edge, allows stale entries, and needs no index at
all. This whole discussion only applies to the eager variant.)*

---

## 6. Layout C — let the client own the priorities

There's a third factoring, and for Prim it's the best of the three:

```
heap[pos]        = key                Q1 stored (vertex ids — back to Layout A's heap)
keyHeapPos[key]  = pos                Q2 stored
                                      Q3 derived: read the CLIENT's array
```

```ts
const pq = new IndexedPQ({ compare: (u, v) => dist[u] - dist[v] });
```

The queue owns **no values at all**. It orders integers, and the comparator reaches into `dist[]`,
which belongs to `PrimMST`.

Two arrays. No `keyOf` needed (the heap holds badges, so Q1 *is* the badge). No duplicated priority.

### Why this fits Prim specifically

Look at `_addEdges` today:

```ts
this.pq.insertWithKey(other, edge);
this.dist[other] = edge.weight;        // <-- same number, second home
...
this.dist[other] = edge.weight;        // <-- hand-syncing again
this.pq.updateItem(other, edge);
```

`dist[other]` and `edge.weight` are **two copies of one number**, kept in step by hand. Layout C
deletes the second copy. `dist[]` is the priority; there is nowhere else for it to drift.

Same argument for `edgeTo`: "the best candidate edge for vertex v" is client bookkeeping, not queue
bookkeeping. Let the client hold it.

### Worked example

```
        2
   1 ─────── 2
   │       / │
  6│    3/   │5
   │   /     │
   3 ─────── 4
        1
```

| step | pop | `dist[]` after relaxing | heap contents (as keys) |
|------|-----|-------------------------|--------------------------|
| init | — | `dist[2]=2, dist[3]=6` | `{2, 3}` |
| 1 | `2` (dist 2) | `3`: 6 → **3** via edge 2—3; `dist[4]=5` | `{3, 4}` |
| 2 | `3` (dist 3) | `4`: 5 → **1** via edge 3—4 | `{4}` |
| 3 | `4` (dist 1) | — | `{}` |

MST = `1—2`, `2—3`, `3—4`, weight `2 + 3 + 1 = 6`.

Notice steps 1 and 2 each contain a *decrease*: a vertex already in the queue got a better price. That
operation — `decreaseKey` — is the only reason we need an indexed PQ here at all.

### The one danger of Layout C

The comparator reads state the queue doesn't control. If a client writes `dist[v] = 3` without telling
the queue, `v` is now sitting in the wrong chair and the heap invariant is quietly broken.

That is precisely why the classic API is `decreaseKey(v, newPriority)` and not "mutate then hope": it
makes *write the new priority* and *restore the heap* a single atomic step.

> **Rule:** with Layout C, never expose the priority array for writing. Every change goes through
> `decreaseKey` / `update`.

The same danger exists in Layout B in a sneakier form. If `itemOf(key)` hands out a live reference
into the heap array and the caller does `edge.weight = 3`, the ordering is corrupt with no error. Reads
may return the item; **changes go through the queue.**

---

## 7. Side by side

| | A: textbook | B: items in heap | C: client owns values |
|---|---|---|---|
| heap holds | keys | items | keys |
| Q1 (pos → key) | stored | **derived** (`keyOf`) | stored |
| Q3 (priority) | `keys[]` | inside the item | client's array |
| arrays | 3 | 2 (or 3 without `keyOf`) | 2 |
| duplicated priority | no | no | no |
| reads external state | no | only if `keyOf` does | **yes** (comparator) |
| good for | general case, reuse | triage, tasks-with-ids | graph algorithms |
| watch out for | nothing — it's the safe one | `keyOf` timing invariants | client mutating priorities |

---

## 8. Reusability, in two different senses

The word gets used for two unrelated things here. Both are worth separating out.

### 8a. Reuse of the *class* — can other algorithms use it?

A is the **most** reused of the three — it's the textbook `IndexMinPQ` that Dijkstra, eager Prim, and
A* all share without modification.

What A gives up isn't reusability. It's being a **container**.

> Layout A is a *priority index*, not a *collection*. It orders keys. Your payloads stay in your own
> arrays, and `delMin()` hands you a key to look them up with.

That's a feature: one non-generic class, no payload type parameter, no opinion about what your items
are.

### The constraint A really does have

`qp[key]` and `keys[key]` are arrays, so keys must be **dense integers `0..N-1`**. Patient ids that are
UUIDs need an `id → int` symbol table in front.

But notice: that's a property of the *backing store*, not of the layout. Swap the arrays for `Map`s and
it's gone. And **B and C have exactly the same constraint** on `keyHeapPos`. It isn't a reason to
prefer one layout over another.

### What actually hurts reuse in our class

The opposite of A. `IndexedPriorityQueue<V>` tries to be an index **and** a payload container at the
same time:

```ts
keyHeapPos: TArray<number>;   // the index    (job 1)
keyValues:  TArray<V>;        // the container (job 2)
```

Two jobs in one class, and the `<V>` generic exists only for job 2. Drop job 2 — Layout A or C — and
the generic disappears with it.

### 8b. Reuse of the *code* — how much of `PriorityQueue` does `IndexedPriorityQueue` actually use?

Tracing every call into `this.pq`:

| `PriorityQueue` member | status in `IndexedPriorityQueue` |
|---|---|
| `insert` | **delegated** (`pq.insert`, line 42) |
| `_delete` | **delegated** (line 69) |
| `update` | **delegated** (line 94) |
| `_bubbleUp`, `_bubbleDown` | reused transitively — the actual algorithm |
| `getParentIdx`, `getLeftChildIdx`, `getRightChildIdx` | reused transitively |
| `_isLess` | reused transitively — **but reads the wrong values** |
| `swap` | re-declared as a wrapper (line 47) — **never invoked by the heap** |
| `_valueOf` | re-declared with new meaning (line 97) — **never invoked by the heap** |
| `insertSideEffects` / `deleteSideEffects` | re-declared (lines 78, 84) — **never invoked** |
| `delMax` | reimplemented (line 56) |
| `size`, `isEmpty`, `toString` | pure forwarders |
| `insertBulk` | unused |

By line count the heap engine *is* reused — roughly 45 of `PriorityQueue`'s ~100 substantive lines, and
they're the 45 worth reusing. So "the base class is barely used" isn't quite it. The two real costs are
structural to composition:

**1. Forwarding boilerplate.** Six of IPQ's twelve members exist only to pass a call through.
Inheritance gives that free; composition makes you hand-write it, and the list is never complete —
there's no `peek`, no `insertBulk`, and `size` forwards a getter that means *capacity*
(`TArray.length` is `arr.length`), not element count. `insertWithKey`'s bounds check
(`keyValueNum > this.size - 1`) silently depends on that reading.

**2. Orphaned hooks — reuse that looks like reuse.** `insert`, `_delete` and `update` are delegated,
and inside them the base calls `this.swap`, `this.insertSideEffects`, `this._valueOf`. Those are
exactly the four members IPQ customized.

> IPQ reuses the skeleton, and the skeleton refuses to call IPQ's parts.
>
> **A method you delegate to is a method whose hooks you have lost.**

---

## 9. Was is-a → has-a the right move?

Half right. Worth writing down, because this refactor is what produced the symptom in §10.

### Warranted in intent

`etc/priority-queue-review.md` §1.3 and §3 made the case, and it's sound:

- `IndexedPriorityQueue` changes what the base's core field `array` *means* — values in the base, keys
  in the subclass. Same field, same declared type, different semantics.
- `insert(value)` vs `insertWithKey(key, value)` is a signature mismatch, not a specialization.

Both are Liskov violations. It genuinely is not an is-a.

### What does Sedgewick do? Neither.

Worth answering directly, because it's the obvious place to look for an authority — and it declines to
be one. algs4 ships **four independent classes with no relationship between them**:

```
MinPQ.java        swim / sink / exch / less
MaxPQ.java        swim / sink / exch / less    ← same code, comparison flipped
IndexMinPQ.java   swim / sink / exch / less    ← same code + pq / qp / keys
IndexMaxPQ.java   swim / sink / exch / less    ← same code again
```

Four copies of the sift logic. `IndexMinPQ` does not extend `MinPQ`, does not hold one, and shares no
base. `MinPQ` and `MaxPQ` are near-verbatim copies and the book says so without apology.

That's deliberate: **algs4 optimizes for a class you can read top to bottom in one sitting**, because
it's a teaching artifact. Abstraction spanning files is a cost against that goal, not a benefit. Java's
own library goes further — `java.util.PriorityQueue` is a leaf class with no indexed variant at all.

So the textbook is evidence for neither side. It's evidence that it simply doesn't answer the question.
This repo has different goals — a shared `Base`, a shared `TArray`, shared `CompareFn` / `ValueOfFn` —
so "just duplicate it" is a legitimate option here but a worse fit than it is for him.

### Not warranted as executed

`PriorityQueue` is a **Template Method** class. `insert`, `_delete`, `_bubbleUp`, `_bubbleDown` are the
fixed algorithm skeleton; `swap`, `insertSideEffects`, `deleteSideEffects`, `_valueOf` are extension
hooks with no-op defaults, put there deliberately (review doc §2.1 calls them out as the *correct* fix
at the time).

**That pattern extends through inheritance only** — the hooks are reached by dynamic dispatch on
`this`. Composition doesn't dispatch:

```ts
this.pq.insert(x)      // enters the INNER PriorityQueue
  └─ this.swap(i, j)   // `this` is the inner PQ — your override isn't on its prototype chain
```

The overrides didn't break. They were **orphaned**.

> The change removed inheritance without replacing the extension mechanism the base class depended on.

### The actual standard

Not "composition over inheritance" as a blanket rule. The operative principle is narrower:

> **Composition requires *injected* hooks, not *overridden* ones.**

An inheritance-designed base (protected hooks, no-op defaults) cannot be composed as-is. You must first
convert the hooks into constructor-injected callbacks — which is precisely what review doc §3 proposed
and what the refactor skipped:

```ts
new PriorityQueue({ compare, onSwap, onInsert, onDelete })
```

`IndexedPriorityQueue` then passes `onSwap: (i, j) => { /* fix keyHeapPos */ }`. Now has-a works,
`PriorityQueue` becomes a leaf class with no protected surface, and Layout C's
`compare: (u, v) => dist[u] - dist[v]` arrives through the same door — one mechanism covering both
customizations.

This also kills the forwarding boilerplate from §8b, for a reason worth stating plainly:

> The IPQ stops trying to **be** a priority queue and becomes a **key index sitting beside one.**

It then owns only what's genuinely new — `insert(key)`, `decreaseKey(key)`, `contains(key)`,
`delete(key)` — and has nothing to forward, because callers who want heap behaviour talk to the heap.

### Three legitimate endings, ranked

| | approach | trade |
|---|---|---|
| 1 | **composition + injected callbacks** | the review's recommendation; real work, right shape |
| 2 | **Sedgewick's**: separate class, duplicate ~60 lines of sift | zero coupling, some duplication |
| 3 | **revert to inheritance** | cheapest patch, restores the hooks, keeps the LSP problems |

Half-composition — has-a plus overrides — is the one option that is strictly wrong, because it
type-checks and silently does nothing.

---

## 10. Two API notes that fall out of this

### `valueOf` **or** `compare`, not both

`PriorityQueue` currently takes both:

```ts
constructor(max?, isMin = false, valueOfFn?, compareFn?)
```

`valueOf` is just a special case of `compare`:

```ts
compare = (a, b) => Math.sign(f(a) - f(b))    // f being valueOf
```

Two ways to express one idea means a precedence rule ("which wins if both are passed?") that nobody
remembers six months later. Take a comparator; if the numeric-projection form is nicer to write,
make a helper that *builds* a comparator from it:

```ts
byNumber(e => e.weight)   // returns a CompareFn
```

### `isMin` is also a comparator

`isMin` currently feeds a branch inside `_isLess`:

```ts
return this.isMin ? dir === -1 : dir === 1;
```

But min vs. max *is* comparator inversion — `(a, b) => compare(b, a)`. Folding it in removes a flag,
removes a branch from the hottest function in the class, and removes the possibility of `isMin` and
`compare` disagreeing.

---

## 11. What the current code actually does

Worth recording, because it's the symptom that started this discussion — and the concrete evidence for
§9.

`IndexedPriorityQueue` **has-a** `PriorityQueue` (composition), rather than **is-a** (inheritance):

```ts
export class IndexedPriorityQueue<V> {
  pq: PriorityQueue<number>;   // owned, not inherited
```

Inside `PriorityQueue._bubbleUp`, the call is `this.swap(...)` — and `this` is the inner `PriorityQueue`
instance. So:

- `IndexedPriorityQueue.swap` (the override that maintains `keyHeapPos`) is **never called**
- `IndexedPriorityQueue.insertSideEffects` is **never called** — `PQ.insert` calls its own no-op
- therefore `keyHeapPos` and `keyValues` are never populated
- therefore `updateItem` finds `idx == null` and silently does nothing

And the comparison: `PQ._isLess` calls `PriorityQueue._valueOf(idx)`, which returns `array[idx]` — a
**vertex number**. `IndexedPriorityQueue._valueOf`, which dereferences to the edge, is never consulted
by the heap.

> Net effect: `PrimMST` currently orders its frontier **by vertex id, not by edge weight.**

That's the split made concrete — the values live in one object and the ordering happens in another,
and with composition the two never meet. Layout C dissolves it, because once the queue owns no values
there is nothing left to keep in sync.

### Smaller things in `PrimMST.ts`

- `this.pq.delMax()` on a queue built with `isMin = true` — the name lies. `delTop` / `poll`.
- `if (this.edgeTo[other]) continue` (line 67): `edgeTo` holds vertex ids and `0` is falsy. 1-indexing
  hides it today; `!= null` is what's meant. Line 50 already gets this right.
- The `console.log`s in `buildTree` / `_addEdges` are debug leftovers.

---

## 12. Takeaways

1. An indexed PQ answers three questions — **pos→key**, **key→pos**, **key→priority**. Designs differ
   only in which are stored and which are derived.
2. Putting real items in the heap (Layout B) saves an array by **deriving pos→key instead of storing
   it**. That's the whole idea, and it needs `keyOf`.
3. In eager Prim `keyOf` **does** exist — "the endpoint not in the tree" is unambiguous and stable for
   every edge while it's in the heap. The cost is a timing invariant: mark a vertex at the wrong moment
   and every `keyOf` inside that sift flips.
4. Storing the key at insert trades that invariant for one array. Prefer it unless the array hurts.
5. For graph algorithms the cleanest layout is C: a heap of vertex ids with the comparator reading the
   client's `dist[]` — the priority then has exactly one home. Price: all priority writes go through
   `decreaseKey`, never direct mutation.
6. Layout A isn't un-reusable; it's just not a *container*. Its real constraint (dense integer keys) is
   about arrays vs. maps, and applies to all three.
7. The current IPQ *does* reuse most of `PriorityQueue` — the problem is that the delegated methods
   (`insert`, `_delete`, `update`) internally call the very hooks composition orphaned. **A method you
   delegate to is a method whose hooks you have lost.**
8. Sedgewick answers none of this: algs4 has four unrelated PQ classes and four copies of the sift
   code, on purpose. Don't look there for the reuse story.
9. Composition needs **injected** hooks. Swapping is-a for has-a while leaving Template Method
   overrides in place produces code that type-checks and silently does nothing.
