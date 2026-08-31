import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";
import { Stack } from "../../data-structures/stacks/Stack";
import { TopSort } from "./TopSort";

export class AcyclicSP {
  G: WDigraph;
  distTo: number[];
  edgeTo: DiWEdge[];
  src: number;

  constructor(G: WDigraph, src: number) {
    this.G = G;
    this.src = src;
    // vertices are 1..V, as everywhere else in this repo - vertex 0 is unused.
    this.distTo = Array.from(
      { length: G.V + 1 },
      () => Number.POSITIVE_INFINITY,
    );
    this.edgeTo = Array.from({ length: G.V + 1 });
    this.distTo[src] = 0;

    // TopSort pushes in DFS post-order, so `sorted` is *reverse* topological
    // order - walk it backwards to relax each vertex before its successors.
    const sorted = new TopSort(G).sorted;

    for (let idx = sorted.length - 1; idx >= 0; idx--) {
      for (const edge of G.adj(sorted[idx])) {
        if (edge == null) continue;
        this.relax(edge);
      }
    }
  }

  relax(edge: DiWEdge): boolean {
    const toDist = this.distTo[edge.to];
    const newDist = this.distTo[edge.from] + edge.weight;
    const updated = toDist > newDist;
    if (updated) {
      this.edgeTo[edge.to] = edge;
      this.distTo[edge.to] = newDist;
    }

    return updated;
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
