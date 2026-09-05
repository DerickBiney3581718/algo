import { describe, expect, it } from "vitest";
import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { WDigraph } from "../../data-structures/graphs/WDigraph";
import { AcyclicLP } from "./AcyclicLP";

/**
 * Vertices are 1..V here, matching TopSort and the booksite fixtures.
 *
 * The same diamond DAG used by the AcyclicSP tests, so the two suites can be
 * read side by side - longest paths take the routes shortest paths reject:
 *
 *   1 -(5)-> 2        1 -(1)-> 3 -(1)-> 2
 *   2 -(2)-> 4        3 -(7)-> 4
 *
 * longest paths from 1: 2 = 5 (direct), 3 = 1, 4 = 8 (via 1->3->4)
 * (shortest were: 2 = 2, 3 = 1, 4 = 4)
 */
function diamond(): WDigraph {
  return new WDigraph(4, [
    new DiWEdge(1, 2, 5),
    new DiWEdge(1, 3, 1),
    new DiWEdge(3, 2, 1),
    new DiWEdge(2, 4, 2),
    new DiWEdge(3, 4, 7),
  ]);
}

/** Walks edgeTo backwards, yielding the edges of the path source -> target. */
function names(lp: AcyclicLP, vtx: number): string[] {
  const edges: string[] = [];

  while (lp.edgeTo[vtx] != null) {
    const edge = lp.edgeTo[vtx];
    edges.push(`${edge.from}->${edge.to}`);
    vtx = edge.from;
  }

  return edges.reverse();
}

describe("AcyclicLP", () => {
  it("seeds the source at zero and everything else at -infinity", () => {
    const G = new WDigraph(3, [new DiWEdge(1, 2, 4)]);
    const lp = new AcyclicLP(G, 3);

    expect(lp.src).toBe(3);
    expect(lp.G).toBe(G);
    expect(lp.distTo[3]).toBe(0);
    expect(lp.distTo[1]).toBe(-Infinity);
    expect(lp.edgeTo[3]).toBeUndefined();
  });

  it("computes the longest distance to every reachable vertex", () => {
    const lp = new AcyclicLP(diamond(), 1);

    expect(lp.distTo[1]).toBe(0);
    expect(lp.distTo[2]).toBe(5);
    expect(lp.distTo[3]).toBe(1);
    expect(lp.distTo[4]).toBe(8);
  });

  it("prefers the heavier multi-hop route over the direct edge", () => {
    const lp = new AcyclicLP(diamond(), 1);

    // 1->2->4 costs 7; the winner goes the long way round through 3.
    expect(lp.distTo[4]).toBeGreaterThan(7);
    expect(names(lp, 4)).toEqual(["1->3", "3->4"]);
  });

  it("records the last edge on the longest path in edgeTo", () => {
    const lp = new AcyclicLP(diamond(), 1);

    expect(lp.edgeTo[2]).toMatchObject({ from: 1, to: 2, weight: 5 });
    expect(lp.edgeTo[3]).toMatchObject({ from: 1, to: 3, weight: 1 });
    expect(lp.edgeTo[4]).toMatchObject({ from: 3, to: 4, weight: 7 });
  });

  it("leaves the source itself with no incoming edge", () => {
    const lp = new AcyclicLP(diamond(), 1);

    expect(lp.edgeTo[1]).toBeUndefined();
    expect(names(lp, 1)).toEqual([]);
  });

  it("reports no path to a vertex the source cannot reach", () => {
    // 3 -> 1 exists, but 1 has no way back to 3.
    const G = new WDigraph(3, [new DiWEdge(1, 2, 4), new DiWEdge(3, 1, 1)]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.hasPathTo(2)).toBe(true);
    expect(lp.hasPathTo(3)).toBe(false);
    expect(lp.distTo[3]).toBe(-Infinity);
  });

  it("counts the source as reachable from itself", () => {
    const lp = new AcyclicLP(diamond(), 1);

    expect(lp.hasPathTo(1)).toBe(true);
  });

  it("starts from any source, not just the first vertex", () => {
    const lp = new AcyclicLP(diamond(), 3);

    expect(lp.distTo[3]).toBe(0);
    expect(lp.distTo[2]).toBe(1);
    expect(lp.distTo[4]).toBe(7);
    expect(lp.hasPathTo(1)).toBe(false);
    expect(names(lp, 4)).toEqual(["3->4"]);
  });

  it("handles negative weights", () => {
    // 1->2 direct pays 5; 1->3->2 pays 1 + (-4) = -3, so direct wins.
    const G = new WDigraph(4, [
      new DiWEdge(1, 2, 5),
      new DiWEdge(1, 3, 1),
      new DiWEdge(3, 2, -4),
      new DiWEdge(2, 4, 1),
    ]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.distTo[2]).toBe(5);
    expect(lp.distTo[4]).toBe(6);
    expect(names(lp, 4)).toEqual(["1->2", "2->4"]);
  });

  it("handles zero-weight edges", () => {
    const G = new WDigraph(3, [
      new DiWEdge(1, 2, 0),
      new DiWEdge(2, 3, 0),
      new DiWEdge(1, 3, 3),
    ]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.distTo[2]).toBe(0);
    expect(lp.distTo[3]).toBe(3);
    expect(names(lp, 3)).toEqual(["1->3"]);
  });

  it("keeps the heaviest of parallel edges", () => {
    const G = new WDigraph(2, [
      new DiWEdge(1, 2, 9),
      new DiWEdge(1, 2, 2),
      new DiWEdge(1, 2, 6),
    ]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.distTo[2]).toBe(9);
    expect(lp.edgeTo[2].weight).toBe(9);
  });

  it("accumulates weight along a chain", () => {
    const G = new WDigraph(5, [
      new DiWEdge(1, 2, 1.5),
      new DiWEdge(2, 3, 2.25),
      new DiWEdge(3, 4, 0.25),
      new DiWEdge(4, 5, 4),
    ]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.distTo[5]).toBeCloseTo(8, 5);
    expect(names(lp, 5)).toEqual(["1->2", "2->3", "3->4", "4->5"]);
  });

  it("relaxes in topological order, not adjacency order", () => {
    // 1->5 is the direct edge and the last vertex in topological order; the
    // 1->2->3->4->5 route only wins if every vertex is settled before 5 is.
    const G = new WDigraph(5, [
      new DiWEdge(1, 5, 2),
      new DiWEdge(1, 2, 1),
      new DiWEdge(2, 3, 1),
      new DiWEdge(3, 4, 1),
      new DiWEdge(4, 5, 1),
    ]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.distTo[5]).toBe(4);
    expect(names(lp, 5)).toEqual(["1->2", "2->3", "3->4", "4->5"]);
  });

  it("reaches the highest-numbered vertex", () => {
    // vertices run 1..V, so distTo/edgeTo need V+1 slots to hold vertex V.
    const G = new WDigraph(3, [new DiWEdge(1, 2, 1), new DiWEdge(2, 3, 1)]);
    const lp = new AcyclicLP(G, 1);

    expect(lp.distTo[3]).toBe(2);
    expect(lp.hasPathTo(3)).toBe(true);
  });

  it("refuses a graph with a cycle", () => {
    const G = new WDigraph(3, [
      new DiWEdge(1, 2, 1),
      new DiWEdge(2, 3, 1),
      new DiWEdge(3, 1, 1),
    ]);

    expect(() => new AcyclicLP(G, 1)).toThrow("G has to be a DAG");
  });

  describe("relax", () => {
    it("takes the edge when it lengthens the known distance", () => {
      const lp = new AcyclicLP(new WDigraph(3, [new DiWEdge(1, 2, 4)]), 1);
      const longer = new DiWEdge(1, 2, 9);

      lp.relax(longer);

      expect(lp.distTo[2]).toBe(9);
      expect(lp.edgeTo[2]).toBe(longer);
    });

    it("leaves everything alone when the edge is no improvement", () => {
      const lp = new AcyclicLP(new WDigraph(3, [new DiWEdge(1, 2, 4)]), 1);
      const before = lp.edgeTo[2];

      lp.relax(new DiWEdge(1, 2, 4));
      lp.relax(new DiWEdge(1, 2, 1));

      expect(lp.distTo[2]).toBe(4);
      expect(lp.edgeTo[2]).toBe(before);
    });

    it("cannot relax an edge leaving an unreached vertex", () => {
      const lp = new AcyclicLP(new WDigraph(3, []), 1);

      lp.relax(new DiWEdge(2, 3, 1));

      expect(lp.distTo[3]).toBe(-Infinity);
      expect(lp.edgeTo[3]).toBeUndefined();
    });
  });
});
