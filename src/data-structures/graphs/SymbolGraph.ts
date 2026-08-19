import { LinkedList } from "../linked-lists/LinkedLists";
import { RBBst } from "../symbol-tables/RedBlackTree";

/**
 * Graph that takes string vertices
 */

export class SymbolGraph {
  st: RBBst<string> = new RBBst();
  indices: string[] = [];

  V: number = 0;
  E: number = 0;
  _adj: LinkedList<number>[] = [];

  constructor(edges: string[], sep = " ") {
    // loop edges, create vertices and edges using sep
    this.indices.length = 1;
    this._adj.length = 1;

    for (const line of edges) {
      if (line.length === 0) continue;
      const vertices = line.split(sep);
      const startVertex = vertices[0];
      for (const adjVtx of vertices.slice(1)) {
        this.addEdge(startVertex, adjVtx);
      }
    }

    this.V = this._adj.length - 1;
  }

  contains(vtx: string): boolean {
    return this.st.contains(vtx);
  }

  addEdge(vtxA: string, vtxB: string): void {
    // ensure indices exist
    for (const arg of arguments) {
      if (!this.contains(arg)) {
        let argIdx = this.indices.length;
        this.indices[argIdx] = arg;
        this.st.put(arg, String(argIdx));
        this._adj[argIdx] = new LinkedList();
      }
    }

    this._adj[this.index(vtxA)].insert(this.index(vtxB));
    this._adj[this.index(vtxB)].insert(this.index(vtxA));
    this.E++;
  }

  index(vtx: string): number {
    return Number(this.st.get(vtx));
  }

  name(idx: number): string {
    return this.indices[idx];
  }

  adj(vtx: number): LinkedList<number> {
    return this._adj[vtx];
  }

  toString() {
    let str = "";
    for (let index = 1; index <= this.V; index++) {
      str += `${this.name(index)}: ${this._strNamedLine(this.adj(index)) ?? ""}\n`;
    }
    return str;
  }

  _strNamedLine(list: LinkedList<number>) {
    if (list == null) return;
    const names = [];
    for (const value of list)
      if (typeof value === "number") names.push(this.name(value));

    return names.join("->");
  }
}
