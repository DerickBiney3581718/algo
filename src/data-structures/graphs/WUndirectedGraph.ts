import { LinkedList } from "../linked-lists/LinkedLists";
import { WEdge } from "./WEdge";

export type WEdgeParam = [number, number, number];

export class WUndirectedGraph {
  V: number = 0;
  E: number = 0;
  _adj: Array<LinkedList<WEdge>>;
  _edges: Array<WEdge> = [];

  constructor(V: number, edges?: WEdgeParam[]) {
    this.V = V;
    this._adj = Array.from({ length: V + 1 });

    if (edges && edges.length) {
      for (const [vtxA, vtxB, weight] of edges) {
        const newEdge = new WEdge(vtxA, vtxB, weight);
        this.addEdge(newEdge);
      }
    }
  }

  addEdge(e: WEdge) {
    const vtxA = e.either();
    const vtxB = e.other(vtxA);

    this.joinVtx(vtxA, e);
    this.joinVtx(vtxB, e);

    this._edges.push(e);
    this.E++;
  }

  private joinVtx(vtx: number, e: WEdge): void {
    if (this._adj.length - 1 < vtx)
      throw new Error("New vertex cannot be inserted");

    if (this._adj[vtx] == null) this._adj[vtx] = new LinkedList([e]);
    else this._adj[vtx].insert(e); //?dedup parallel edgess
  }

  adj(vtx: number): LinkedList<WEdge> {
    return this._adj[vtx];
  }

  get edges(): WEdge[] {
    return this._edges;
  }

  toString() {
    let str = "";
    for (let index = 0; index <= this.V; index++) {
      str += `${index}: ${this.adj(index)?.toString() ?? ""}\n`;
    }
    return str;
  }
}

// Multiple source reachability, given multiple source vertices, does any have a path to the target q?
