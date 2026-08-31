import type { Digraph } from "../../data-structures/graphs/Digraph";
import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { WDigraph } from "../../data-structures/graphs/WDigraph";
import { Stack } from "../../data-structures/stacks/Stack";

export class DirectedCycle {
  G: Digraph | WDigraph;
  _hasCycle: boolean = false;
  marked: boolean[];
  cycle: Stack<number> = new Stack<number>();
  edgeTo: number[] = [];

  constructor(G: Digraph | WDigraph) {
    this.G = G;

    this.marked = Array.from({ length: this.G.V + 1 });

    for (let vtx = 1; vtx < this.G.V; vtx++) {
      if (this.marked[vtx] == true) continue;
      this.dfs(vtx);
    }
  }

  dfs(src: number): void {
    if (this._hasCycle) return;
    this.marked[src] = true;

    for (let adjVtx of this.G.adj(src)) {
      if (adjVtx == null) continue;

      if (adjVtx instanceof DiWEdge) adjVtx = adjVtx.to;
      if (this.marked[adjVtx] !== true) {
        this.edgeTo[adjVtx] = src;
        this.dfs(adjVtx);
      } else {
        const cycle = new Stack<number>();
        cycle.push(adjVtx);

        for (let index = src; index != null; index = this.edgeTo[index]) {
          cycle.push(index);
          if (index === adjVtx) {
            this._hasCycle = true;
            break;
          }
        }

        if (this._hasCycle) {
          this.cycle = cycle;
        }
      }
    }
  }

  get hasCycle(): boolean {
    return this._hasCycle;
  }

  get showCycle(): Stack<number> {
    return this.cycle;
  }
}
