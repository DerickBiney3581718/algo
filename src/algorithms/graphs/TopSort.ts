import type { Digraph } from "../../data-structures/graphs/Digraph";
import { Stack } from "../../data-structures/stacks/Stack";
import { DirectedCycle } from "./DirectedCycle";

export class TopSort {
  G: Digraph;
  marked: boolean[];
  _sorted: Stack<number> = new Stack<number>();

  constructor(G: Digraph) {
    this.G = G;
    this.marked = Array.from({ length: G.V + 1 });

    const hasCycle = new DirectedCycle(G).hasCycle;
    if (hasCycle) throw new Error("G has to be a DAG");

    for (let vtx = 1; vtx <= G.V; vtx++) {
      if (this.marked[vtx]) continue;
      this.dfs(vtx);
    }
  }

  dfs(src: number) {
    this.marked[src] = true;

    for (const adjVtx of this.G.adj(src)) {
      if (adjVtx == null || this.marked[adjVtx]) continue; // no cycles
      this.dfs(adjVtx);
    }

    this._sorted.push(src);
  }

  get sorted(): Stack<number> {
    return this._sorted;
  }
}
