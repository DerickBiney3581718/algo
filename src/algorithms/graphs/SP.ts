import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";
import { Stack } from "../../data-structures/stacks/Stack";

export class SP {
  G: WDigraph;
  src: number;
  distTo: number[];
  edgeTo: DiWEdge[];

  constructor(G: WDigraph, src: number) {
    this.G = G;
    this.src = src;
    this.distTo = Array.from({ length: G.V }, () => Number.POSITIVE_INFINITY);
    this.edgeTo = Array.from({ length: G.V });

    this.distTo[src] = 0;
    this.dfs();
  }

  dfs(vtx: number = this.src) {
    const adj = this.G.adj(vtx);
    if (adj == null) return; // sink: no outgoing edges

    for (const neighbor of adj) {
      if (neighbor == null || neighbor.to == vtx) continue;

      const shouldChange = this.relax(neighbor);

      if (shouldChange) this.dfs(neighbor.to);
    }
  }

  relax(edge: DiWEdge): boolean {
    const toDist = this.distTo[edge.to];
    const newDist = this.distTo[edge.from] + edge.weight;
    const shouldChange = toDist > newDist;
    if (shouldChange) {
      this.edgeTo[edge.to] = edge;
      this.distTo[edge.to] = newDist;
    }

    return shouldChange;
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
