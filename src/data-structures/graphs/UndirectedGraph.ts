import { LinkedList } from "../linked-lists/LinkedLists";

type Edge = [number, number];
/**
 * tremaux exploration using adjacency list
 * other possible implementations:
 * 1. list of edges 2. adjacency matrix 3. adjacency sets
 * Can consider using STs if API needs a vertex insertion and deletion
 */
export class UndirectedGraph {
  V: number = 0;
  E: number = 0;
  private _adj: Array<LinkedList<number>>;

  constructor(V: number, edges?: Edge[]) {
    this.V = V;
    this._adj = Array.from({ length: V + 1 }); // zero unused

    if (edges && edges.length) {
      for (const [vtxA, vtxB] of edges) this.addEdge(vtxA, vtxB);
    }
  }

  addEdge(vtxA: number, vtxB: number) {
    this.joinVtx(vtxA, vtxB);
    this.joinVtx(vtxB, vtxA);
    this.E++;
  }

  private joinVtx(vtxA: number, vtxB: number): void {
    if (this._adj.length < vtxA)
      throw new Error("New vertex cannot be inserted");

    if (this._adj[vtxA] == null) this._adj[vtxA] = new LinkedList([vtxB]);
    else this._adj[vtxA].insert(vtxB); //?dedup
  }

  adj(vtx: number): LinkedList<number> {
    return this._adj[vtx];
  }

  toString() {
    let str = "";
    for (let index = 1; index <= this.V; index++) {
      str += `${index}: ${this.adj(index)?.toString() ?? ""}\n`;
    }
    return str;
  }
}
