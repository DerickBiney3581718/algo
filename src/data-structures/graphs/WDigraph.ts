import { LinkedList } from "../linked-lists/LinkedLists";
import type { DiWEdge } from "./DiWEdge";

export class WDigraph {
  V: number = 0;
  E: number = 0;
  _adj: LinkedList<DiWEdge>[];
  _edges: DiWEdge[] = [];

  constructor(V: number, edges: DiWEdge[]) {
    this.V = V;
    this._adj = Array.from({ length: V + 1 }, () => new LinkedList());

    if (edges && edges.length) {
      for (const edge of edges) {
        this.addEdge(edge);
      }
    }
  }

  addEdge(e: DiWEdge) {
    const vtx = e.from;
    this.joinVtx(vtx, e);
    this._edges.push(e);
    this.E++;
  }

  private joinVtx(vtx: number, e: DiWEdge): void {
    if (this._adj.length - 1 < vtx)
      throw new Error("New vertex cannot be inserted");

    if (this._adj[vtx] == null) this._adj[vtx] = new LinkedList([e]);
    else this._adj[vtx].insert(e); //?dedup parallel edgess
  }

  adj(vtx: number): LinkedList<DiWEdge> {
    return this._adj[vtx];
  }

  get edges(): DiWEdge[] {
    return this._edges;
  }
}
