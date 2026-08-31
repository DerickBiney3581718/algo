import type { Digraph } from "../../data-structures/graphs/Digraph";
import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import type { WDigraph } from "../../data-structures/graphs/WDigraph";

import { DirectedCycle } from "./DirectedCycle";

export class TopSort {
  G: Digraph | WDigraph;
  marked: boolean[];
  _sorted: number[] = [];
  _edges: DiWEdge[];

  constructor(G: Digraph | WDigraph) {
    this.G = G;
    this.marked = Array.from({ length: G.V + 1 });
    this._edges = Array.from({ length: G.V + 1 });

    const hasCycle = new DirectedCycle(G).hasCycle;
    if (hasCycle) throw new Error("G has to be a DAG");

    for (let vtx = 1; vtx <= G.V; vtx++) {
      if (this.marked[vtx]) continue;
      this.dfs(vtx);
    }
  }

  dfs(src: number) {
    this.marked[src] = true;

    for (let edge of this.G.adj(src)) {
      if (edge == null) continue; // no cycles
      const adjVtx = edge instanceof DiWEdge ? edge.to : edge;
      if (this.marked[adjVtx]) continue;

      if (edge instanceof DiWEdge) this._edges[adjVtx] = edge;
      this.dfs(adjVtx);
    }

    this._sorted.push(src);
  }

  get sorted(): number[] {
    return this._sorted;
  }
}
