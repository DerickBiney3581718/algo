export class DiWEdge {
  from: number;
  to: number;
  weight: number;

  constructor(from: number, to: number, weight: number) {
    this.from = from;
    this.to = to;
    this.weight = weight;
  }

  toString() {
    return `${this.from} -(${this.weight})-> ${this.to}`;
  }
}
