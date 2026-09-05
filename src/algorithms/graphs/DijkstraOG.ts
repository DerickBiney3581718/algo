import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";
import { IndexedPriorityQueue } from "../../data-structures/priority-queues/IndexedPriorityQueue";
import { Stack } from "../../data-structures/stacks/Stack";

/**
 * Textbook Dijkstra: Sedgewick & Wayne, *Algorithms* 4ed, Algorithm 4.9 (p.655),
 * plus the one guard the book leaves implicit in its precondition.
 *
 * THIS CLASS IS THE NON-NEGATIVE-WEIGHT ONE. It rejects negative edges up front
 * and, in exchange, holds Dijkstra's actual guarantee: every vertex is settled
 * exactly once, total work O(E log V). `DijkstraSP` is the faithful port of the
 * book; it takes the opposite trade -- negative weights welcome, no polynomial
 * bound, and a negative cycle hangs it.
 *
 * Java -> TS name mapping:
 *   IndexMinPQ<Double>  ->  IndexedPriorityQueue(V, isMin = true)
 *   pq.delMin()         ->  idxMinPQ.delTop()
 *   pq.change(w, k)     ->  idxMinPQ.update(w, k)     // decrease-key
 *   relax(G, v)         ->  relax(v)                  // G is a field here
 *
 * Vertices are 0..V-1, matching `DijkstraSP` so the two are directly
 * comparable. (The rest of this folder uses 1..V -- see pending item 5.)
 */
export class DijkstraOG {
  G: WDigraph;
  src: number;

  /** edgeTo[v] = last edge on the best known path src -> v */
  edgeTo: DiWEdge[];
  /** distTo[v] = length of that path; POSITIVE_INFINITY until v is discovered */
  distTo: number[];

  /**
   * marked[v] = v has been popped, so distTo[v] is final.
   *
   * This is the piece Sedgewick's Java does not have, and the reason that code
   * is only correct under its stated precondition. `IndexedPriorityQueue`
   * cannot answer "was this settled?" -- delTop nulls the qp slot, so
   * contains() reads false for a popped vertex exactly as it does for one never
   * seen. Asking the queue conflates the two; a separate array does not.
   */
  marked: boolean[];

  /**
   * Holds *vertices*, keyed by their current distTo estimate. Not edges --
   * one slot per vertex is what makes decrease-key possible at all.
   * Invariant: v is in the PQ iff v is discovered and not yet settled.
   */
  idxMinPQ: IndexedPriorityQueue;

  constructor(G: WDigraph, src: number) {
    // Dijkstra's correctness rests entirely on this. Without it the failure is
    // silent -- wrong distances, or an exponential number of pops -- so pay
    // O(E) to turn it into a loud one.
    for (const edge of G.edges) {
      if (edge != null && edge.weight < 0)
        throw new Error(
          `DijkstraOG requires non-negative weights, got ${edge.toString()}. Use DijkstraSP.`,
        );
    }

    this.G = G;
    this.src = src;

    this.edgeTo = Array.from({ length: G.V });
    this.distTo = Array.from({ length: G.V }, () => Number.POSITIVE_INFINITY);
    this.marked = Array.from({ length: G.V }, () => false);
    this.idxMinPQ = new IndexedPriorityQueue(G.V, true);

    // Only the source starts discovered; everything else enters the PQ the
    // first time an edge reaches it. (CLRS instead seeds all V vertices at
    // INFINITY up front, which makes the insert branch in relax() dead code but
    // costs O(V) slots however little of the graph is reachable.)
    this.distTo[src] = 0.0;
    this.idxMinPQ.insert(src, 0.0);

    // Each iteration settles exactly one vertex: the nearest one not yet
    // settled. Non-negative weights mean no route discovered later can be
    // shorter, so distTo is final at the moment of the pop -- which is why
    // marking here is sound. The loop therefore runs at most V times.
    while (!this.idxMinPQ.isEmpty) {
      const vtx = this.idxMinPQ.delTop();
      if (vtx == null) continue;
      this.marked[vtx] = true;
      this.relax(vtx);
    }
  }

  private relax(vtx: number): void {
    for (const edge of this.G.adj(vtx)) {
      if (edge == null) continue;
      const w = edge.to;

      // Settled means finished. Skipping here (rather than at pop time) keeps
      // a settled vertex out of the queue entirely, so the PQ invariant above
      // stays literally true and no vertex is ever popped twice.
      if (this.marked[w]) continue;

      // Compare against the *current best* estimate, not against INFINITY.
      // INFINITY is not a special case -- it is just the seed that any real
      // distance beats, so this one test covers both "never seen w" and "seen
      // w, but this route is no better".
      if (this.distTo[w] <= this.distTo[vtx] + edge.weight) continue;

      this.distTo[w] = this.distTo[vtx] + edge.weight;
      this.edgeTo[w] = edge;

      // w is on the frontier -> its key just dropped, sift it up.
      // w is brand new       -> put it on the frontier.
      if (this.idxMinPQ.contains(w)) this.idxMinPQ.update(w, this.distTo[w]);
      else this.idxMinPQ.insert(w, this.distTo[w]);
    }
  }

  distanceTo(vtx: number): number {
    return this.distTo[vtx];
  }

  hasPathTo(vtx: number): boolean {
    return this.distTo[vtx] < Number.POSITIVE_INFINITY;
  }

  /** Walks edgeTo backwards from vtx to src; the Stack reverses it for us. */
  pathTo(vtx: number): Stack<DiWEdge> | null {
    if (!this.hasPathTo(vtx)) return null;
    const st: Stack<DiWEdge> = new Stack();

    while (this.edgeTo[vtx] != null) {
      const edge = this.edgeTo[vtx];
      st.push(edge);
      vtx = edge.from;
    }

    return st;
  }
}
