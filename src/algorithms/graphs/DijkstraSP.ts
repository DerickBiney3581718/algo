import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";
import { IndexedPriorityQueue } from "../../data-structures/priority-queues/IndexedPriorityQueue";
import { Stack } from "../../data-structures/stacks/Stack";

/**
 * Single-source shortest paths -- a faithful port of Sedgewick & Wayne,
 * *Algorithms* 4ed, Algorithm 4.9 (p.655). Deliberately 1:1 with the book,
 * including what the book leaves to its precondition rather than its code.
 *
 * Java -> TS name mapping:
 *   IndexMinPQ<Double>  ->  IndexedPriorityQueue(V, isMin = true)
 *   pq.delMin()         ->  idxMinPQ.delTop()
 *   pq.change(w, k)     ->  idxMinPQ.update(w, k)     // decrease-key
 *   relax(G, v)         ->  visit(v)                  // G is a field here
 *
 * Correct and O(E log V) on non-negative weights -- the book's precondition.
 * Nothing here enforces it, and there is no settled set (delTop nulls the qp
 * slot, so contains() reads false for a popped vertex exactly as for an unseen
 * one), so an improvement re-inserts a settled vertex. Three consequences:
 *
 * - Negative weights, no negative cycle: distances are still correct -- the
 *   re-insertion degrades this into SPFA. More capable than Dijkstra.
 * - But the O(E log V) bound is gone with them. A chain of n gadgets
 *   (h -0-> h', h -w-> c, c -(-2w)-> h') doubles the pops per gadget:
 *   3*2^n - 2 pops on 2n+2 vertices.
 * - A negative cycle never terminates. Every lap lowers every distance, so the
 *   relaxation guard always passes and the queue never drains.
 *
 * Want the guarantee instead of the generality? Use `DijkstraOG`: same
 * algorithm plus a `marked` set and an up-front non-negative check.
 */
export class DijkstraSP {
  G: WDigraph;
  src: number;

  distTo: number[];
  edgeTo: DiWEdge[];

  idxMinPQ: IndexedPriorityQueue;

  constructor(G: WDigraph, src: number) {
    this.G = G;
    this.src = src;
    this.distTo = Array.from({ length: G.V }, () => Number.POSITIVE_INFINITY);
    this.edgeTo = Array.from({ length: G.V });
    this.idxMinPQ = new IndexedPriorityQueue(G.V, true);

    this.distTo[src] = 0.0;
    this.idxMinPQ.insert(src, 0.0);

    while (!this.idxMinPQ.isEmpty) {
      this.visit(this.idxMinPQ.delTop());
    }
  }

  visit(vtx: number | null) {
    if (vtx == null) return null;

    for (const edge of this.G.adj(vtx)) {
      if (edge == null) continue;

      const newDist = this.distTo[vtx] + edge.weight;

      if (this.distTo[edge.to] <= newDist) continue;

      this.distTo[edge.to] = newDist;
      this.edgeTo[edge.to] = edge;

      if (this.idxMinPQ.contains(edge.to))
        this.idxMinPQ.update(edge.to, newDist);
      else this.idxMinPQ.insert(edge.to, newDist);
    }
  }

  hasPathTo(vtx: number): boolean {
    return this.distTo[vtx] < Number.POSITIVE_INFINITY;
  }

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
