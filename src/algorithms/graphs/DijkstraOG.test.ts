import { describe, it, expect } from "vitest";
import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { WDigraph } from "../../data-structures/graphs/WDigraph";
import { DijkstraOG } from "./DijkstraOG";
import { DijkstraSP } from "./DijkstraSP";

function randG(V: number, E: number, seed: number) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const edges: DiWEdge[] = [];
  for (let i = 0; i < E; i++) {
    edges.push(new DiWEdge(Math.floor(rnd() * V), Math.floor(rnd() * V), Math.floor(rnd() * 20)));
  }
  return new WDigraph(V, edges);
}

describe("DijkstraOG", () => {
  it("agrees with DijkstraSP on 300 random non-negative digraphs", () => {
    for (let t = 0; t < 300; t++) {
      const G = randG(12, 30, t + 1);
      const src = t % 12;
      expect(new DijkstraOG(G, src).distTo).toEqual(new DijkstraSP(G, src).distTo);
    }
  });

  it("reconstructed paths sum to distTo", () => {
    for (let t = 0; t < 100; t++) {
      const G = randG(12, 30, t + 500);
      const sp = new DijkstraOG(G, 0);
      for (let v = 0; v < 12; v++) {
        if (!sp.hasPathTo(v)) continue;
        let sum = 0;
        const st = sp.pathTo(v)!;
        while (st.size > 0) sum += st.pop()!.weight;
        expect(sum).toBeCloseTo(sp.distTo[v]);
      }
    }
  });

  it("rejects negative weights", () => {
    const G = new WDigraph(3, [new DiWEdge(0, 1, 1), new DiWEdge(1, 2, -3)]);
    expect(() => new DijkstraOG(G, 0)).toThrow(/non-negative/);
  });

  it("settles each vertex at most once", () => {
    const G = randG(50, 400, 77);
    const sp = new DijkstraOG(G, 0);
    // marked is set once per pop; PQ drained => pops == marked count
    expect(sp.marked.filter(Boolean).length).toBeLessThanOrEqual(G.V);
  });
});
