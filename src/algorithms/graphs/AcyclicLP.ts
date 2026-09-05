import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";
import { TopSort } from "./TopSort";

export class AcyclicLP {
  distTo: number[];
  edgeTo: DiWEdge[];
  G: WDigraph;
  src: number;

  constructor(G: WDigraph, src: number) {
    this.G = G;
    this.src = src;

    this.distTo = Array.from(
      { length: G.V + 1 },
      () => Number.NEGATIVE_INFINITY,
    );
    this.edgeTo = Array.from({ length: G.V + 1 });

    // set src to allow updates from inf
    this.distTo[src] = 0.0;

    const ts = new TopSort(G);

    // in rev topsort, processing source first
    for (let idx = ts.sorted.length - 1; idx >= 0; idx--) {
      const vtx = ts.sorted[idx];
      for (const edge of G.adj(vtx)) {
        if (!edge) continue;
        this.relax(edge);
      }
    }
  }

  relax(edge: DiWEdge): void {
    const oldDist = this.distTo[edge.to];
    const newDist = this.distTo[edge.from] + edge.weight;

    if (newDist > oldDist) {
      this.edgeTo[edge.to] = edge;
      this.distTo[edge.to] = newDist;
    }
  }

  hasPathTo(tar: number): boolean {
    return this.distTo[tar] > Number.NEGATIVE_INFINITY; //-inf should be hold under +& -
  }

  pathTo(tar: number): number[] {
    const q = [];
    while (tar != null) {
      q.push(tar);
      const e = this.edgeTo[tar];
      tar = e?.from ?? null;
    }
    return q;
  }
}
