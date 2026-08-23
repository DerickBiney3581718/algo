import { LinkedList } from "../linked-lists/LinkedLists";
import type { Edge } from "./UndirectedGraph";

/**
 * public class Digraph
 *Digraph(int V) create a V-vertex digraph with no edges
 *Digraph(In in) read a digraph from input stream in
 *nt V() number of vertices
 *int E() number of edges
 *void addEdge(int v, int w) add edge v->w to this digraph
 *Iterable<Integer> adj(int v) vertices connected to v by edges
 *pointing from v
 *Digraph reverse() reverse of this digraph
 *String toString()
 */
export class Digraph {
  V: number = 0;
  E: number = 0;
  private _adj: Array<LinkedList<number>>;

  constructor(V: number, edges?: Edge[]) {
    this.V = V;
    this._adj = Array.from({ length: V + 1 }).map(() => {
      return new LinkedList<number>();
    }); // zero unused

    if (edges && edges.length) {
      for (const [vtxA, vtxB] of edges) this.addEdge(vtxA, vtxB);
    }
  }

  addEdge(vtxA: number, vtxB: number) {
    this.joinVtx(vtxA, vtxB);
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

  reverse(): Digraph {
    const R = new Digraph(this.V);
    for (let idx = 1; idx <= this.V; idx++) {
      for (const vtx of this.adj(idx)) {
        if (vtx == null) continue;
        R.addEdge(idx, vtx);
      }
    }
    return R;
  }

  toString() {
    let str = "";
    for (let index = 1; index <= this.V; index++) {
      str += `${index}: ${this.adj(index)?.toString() ?? ""}\n`;
    }
    return str;
  }
}
