import type { UndirectedGraph } from "../../data-structures/graphs/UndirectedGraph";

export class TwoColor {
  marked: boolean[];
  colored: boolean[];
  G: UndirectedGraph;
  _twoColored: boolean = true;

  constructor(G: UndirectedGraph) {
    this.G = G;

    this.marked = Array.from({ length: G.V + 1 });
    this.colored = Array.from({ length: G.V + 1 });

    for (let vtx = 1; vtx < G.V + 1; vtx++) {
      this.dfs(vtx, vtx);
    }
  }

  dfs(vtx: number, src: number): void {
    this.marked[vtx] = true;
    if (src === vtx) this.colored[vtx] = true;
    else this.colored[vtx] = !this.colored[src];

    for (const newVtx of this.G.adj(vtx)) {
      if (newVtx == null) continue;
      if (this.marked[newVtx] && newVtx !== src) {
        // loops
        if (this.colored[vtx] === this.colored[newVtx]) {
          this._twoColored = false;
          break;
        }
        continue;
      }

      this.dfs(newVtx, vtx);
    }
  }

  get IsTwoColored(): boolean {
    return this._twoColored;
  }
}
