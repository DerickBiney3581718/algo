import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";
import { IndexedPriorityQueue } from "../../data-structures/priority-queues/IndexedPriorityQueue";
import { Stack } from "../../data-structures/stacks/Stack";

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

    this.distTo[src] = 0;
    this.idxMinPQ.insert(src, 0);

    while (!this.idxMinPQ.isEmpty) {
      this.visit(this.idxMinPQ.delTop());
    }
  }

  visit(vtx: number | null) {
    if (vtx == null) return null;

    for (const edge of this.G.adj(vtx)) {
      if (edge == null || edge.to == vtx) continue;

      const newDist = this.distTo[edge.from] + edge.weight;
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
