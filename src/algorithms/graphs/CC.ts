import type { UndirectedGraph } from "../../data-structures/graphs/UndirectedGraph";

export class CC {
  marked: boolean[];
  G: UndirectedGraph;
  _id: number[];
  _count: number = 0;

  constructor(G: UndirectedGraph) {
    this.G = G;
    this.marked = Array.from({ length: G.V + 1 });
    this._id = Array.from({ length: G.V + 1 });

    for (let vtx = 1; vtx < G.V + 1; vtx++) {
      if (!this.marked[vtx]) {
        this._count++;
        this.dfs(vtx);
      }
    }
  }

  dfs(vtx: number): void {
    this.marked[vtx] = true;
    this._id[vtx] = this._count;
    for (const newVtx of this.G.adj(vtx)) {
      if (newVtx == null || this.marked[newVtx]) continue;
      this.dfs(newVtx);
    }
  }

  get count(): number {
    return this._count;
  }

  id(vtx: number): number {
    return this._id[vtx];
  }

  connected(vtxA: number, vtxB: number): boolean {
    return this.id(vtxA) === this.id(vtxB);
  }
}
