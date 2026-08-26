// public class Edge implements Comparable<Edge>
// Edge(int v, int w, double weight) initializing constructor
// double weight() weight of this edge
// int either() either of this edge’s vertices
// int other(int v) the other vertex
// int compareTo(Edge that) compare this edge to e
// String toString()

export class WEdge {
  v: number;
  w: number;
  weight: number;
  constructor(v: number, w: number, weight: number) {
    this.v = v;
    this.w = w;
    this.weight = weight;
  }

  either(): number {
    return this.v;
  }

  other(v: number): number {
    return v === this.v ? this.w : this.v;
  }

  compareTo(that: WEdge): number {
    if (this.weight > that.weight) return 1;
    else if (this.weight === that.weight) return 0;
    else return -1;
  }

  toString() {
    return `E: (${this.v} -> ${this.w}), w: ${this.weight}`;
  }
}
