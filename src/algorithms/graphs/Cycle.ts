import type { UndirectedGraph } from "../../data-structures/graphs/UndirectedGraph";
/**
 * Assuming no self loops and parallel edges
 */
export class Cycle {
  marked: boolean[];
  G: UndirectedGraph;
  _hasCycle: boolean = false;

  constructor(G: UndirectedGraph) {
    this.G = G;

    this.marked = Array.from({ length: G.V + 1 });
    for (let vtx = 1; vtx < G.V + 1; vtx++) {
      this.dfs(vtx, vtx);
    }
  }

  dfs(vtx: number, src: number): void {
    this.marked[vtx] = true;

    for (const newVtx of this.G.adj(vtx)) {
      if (newVtx == null) continue;
      if (this.marked[newVtx] && newVtx !== src) {
        this._hasCycle = true;
        break;
      }
      this.dfs(newVtx, vtx);
    }
  }

  get hasCycle(): boolean {
    return this._hasCycle;
  }
}
