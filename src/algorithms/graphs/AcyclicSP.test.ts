import { describe, expect, it } from "vitest";
import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { WDigraph } from "../../data-structures/graphs/WDigraph";
import type { Stack } from "../../data-structures/stacks/Stack";
import { AcyclicSP } from "./AcyclicSP";

/** Drains the stack returned by pathTo into edges ordered source -> target. */
function drain(path: Stack<DiWEdge> | null): DiWEdge[] {
  const edges: DiWEdge[] = [];
  if (path == null) return edges;
  while (path.size > 0) {
    const edge = path.pop();
    if (edge == null) break;
    edges.push(edge);
  }
  return edges;
}

function names(path: Stack<DiWEdge> | null): string[] {
  return drain(path).map((edge) => `${edge.from}->${edge.to}`);
}

/**
 * Vertices are 1..V here, matching TopSort and the booksite fixtures.
 *
 * A diamond DAG where the two-hop route beats the direct edge:
 *
 *   1 -(5)-> 2        1 -(1)-> 3 -(1)-> 2
 *   2 -(2)-> 4        3 -(7)-> 4
 *
 * shortest paths from 1: 2 = 2, 3 = 1, 4 = 4 (via 1->3->2->4)
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

describe("AcyclicSP", () => {
  it("seeds the source at zero and everything else at infinity", () => {
    const G = new WDigraph(3, [new DiWEdge(1, 2, 4)]);
    const sp = new AcyclicSP(G, 3);

    expect(sp.src).toBe(3);
    expect(sp.G).toBe(G);
    expect(sp.distTo[3]).toBe(0);
    expect(sp.distTo[1]).toBe(Infinity);
    expect(sp.edgeTo[3]).toBeUndefined();
  });

  it("computes the shortest distance to every reachable vertex", () => {
    const sp = new AcyclicSP(diamond(), 1);

    expect(sp.distTo[1]).toBe(0);
    expect(sp.distTo[2]).toBe(2);
    expect(sp.distTo[3]).toBe(1);
    expect(sp.distTo[4]).toBe(4);
  });

  it("prefers the cheaper multi-hop route over the direct edge", () => {
    const sp = new AcyclicSP(diamond(), 1);

    expect(sp.distTo[2]).toBeLessThan(5);
    expect(names(sp.pathTo(2))).toEqual(["1->3", "3->2"]);
  });

  it("records the last edge on the shortest path in edgeTo", () => {
    const sp = new AcyclicSP(diamond(), 1);

    expect(sp.edgeTo[2]).toMatchObject({ from: 3, to: 2, weight: 1 });
    expect(sp.edgeTo[3]).toMatchObject({ from: 1, to: 3, weight: 1 });
    expect(sp.edgeTo[4]).toMatchObject({ from: 2, to: 4, weight: 2 });
  });

  it("returns the full path, in source-to-target order", () => {
    const sp = new AcyclicSP(diamond(), 1);

    expect(names(sp.pathTo(4))).toEqual(["1->3", "3->2", "2->4"]);
    expect(drain(sp.pathTo(4)).reduce((sum, e) => sum + e.weight, 0)).toBe(
      sp.distTo[4],
    );
  });

  it("returns an empty path for the source itself", () => {
    const sp = new AcyclicSP(diamond(), 1);
    const path = sp.pathTo(1);

    expect(path).not.toBeNull();
    expect(path?.size).toBe(0);
  });

  it("reports no path to a vertex the source cannot reach", () => {
    // 3 -> 1 exists, but 1 has no way back to 3.
    const G = new WDigraph(3, [new DiWEdge(1, 2, 4), new DiWEdge(3, 1, 1)]);
    const sp = new AcyclicSP(G, 1);

    expect(sp.hasPathTo(2)).toBe(true);
    expect(sp.hasPathTo(3)).toBe(false);
    expect(sp.distTo[3]).toBe(Infinity);
    expect(sp.pathTo(3)).toBeNull();
  });

  it("starts from any source, not just the first vertex", () => {
    const sp = new AcyclicSP(diamond(), 3);

    expect(sp.distTo[3]).toBe(0);
    expect(sp.distTo[2]).toBe(1);
    expect(sp.distTo[4]).toBe(3);
    expect(sp.hasPathTo(1)).toBe(false);
    expect(names(sp.pathTo(4))).toEqual(["3->2", "2->4"]);
  });

  it("handles negative weights, which Dijkstra cannot", () => {
    // 1->2 direct costs 5; 1->3->2 costs 1 + (-4) = -3.
    const G = new WDigraph(4, [
      new DiWEdge(1, 2, 5),
      new DiWEdge(1, 3, 1),
      new DiWEdge(3, 2, -4),
      new DiWEdge(2, 4, 1),
    ]);
    const sp = new AcyclicSP(G, 1);

    expect(sp.distTo[2]).toBe(-3);
    expect(sp.distTo[4]).toBe(-2);
    expect(names(sp.pathTo(4))).toEqual(["1->3", "3->2", "2->4"]);
  });

  it("handles zero-weight edges", () => {
    const G = new WDigraph(3, [
      new DiWEdge(1, 2, 0),
      new DiWEdge(2, 3, 0),
      new DiWEdge(1, 3, 3),
    ]);
    const sp = new AcyclicSP(G, 1);

    expect(sp.distTo[2]).toBe(0);
    expect(sp.distTo[3]).toBe(0);
    expect(names(sp.pathTo(3))).toEqual(["1->2", "2->3"]);
  });

  it("keeps the cheapest of parallel edges", () => {
    const G = new WDigraph(2, [
      new DiWEdge(1, 2, 9),
      new DiWEdge(1, 2, 2),
      new DiWEdge(1, 2, 6),
    ]);
    const sp = new AcyclicSP(G, 1);

    expect(sp.distTo[2]).toBe(2);
    expect(sp.edgeTo[2].weight).toBe(2);
  });

  it("accumulates weight along a chain", () => {
    const G = new WDigraph(5, [
      new DiWEdge(1, 2, 1.5),
      new DiWEdge(2, 3, 2.25),
      new DiWEdge(3, 4, 0.25),
      new DiWEdge(4, 5, 4),
    ]);
    const sp = new AcyclicSP(G, 1);

    expect(sp.distTo[5]).toBeCloseTo(8, 5);
    expect(names(sp.pathTo(5))).toEqual(["1->2", "2->3", "3->4", "4->5"]);
  });

  it("relaxes in topological order, not adjacency order", () => {
    // 1->5 is the direct edge and the last vertex in topological order; the
    // 1->2->3->4->5 route only wins if every vertex is settled before 5 is.
    const G = new WDigraph(5, [
      new DiWEdge(1, 5, 100),
      new DiWEdge(1, 2, 1),
      new DiWEdge(2, 3, 1),
      new DiWEdge(3, 4, 1),
      new DiWEdge(4, 5, 1),
    ]);
    const sp = new AcyclicSP(G, 1);

    expect(sp.distTo[5]).toBe(4);
    expect(names(sp.pathTo(5))).toEqual(["1->2", "2->3", "3->4", "4->5"]);
  });

  it("refuses a graph with a cycle", () => {
    const G = new WDigraph(3, [
      new DiWEdge(1, 2, 1),
      new DiWEdge(2, 3, 1),
      new DiWEdge(3, 1, 1),
    ]);

    expect(() => new AcyclicSP(G, 1)).toThrow("G has to be a DAG");
  });

  describe("relax", () => {
    it("takes the edge when it shortens the known distance", () => {
      const sp = new AcyclicSP(new WDigraph(3, [new DiWEdge(1, 2, 4)]), 1);
      const shortcut = new DiWEdge(1, 2, 1);

      expect(sp.relax(shortcut)).toBe(true);
      expect(sp.distTo[2]).toBe(1);
      expect(sp.edgeTo[2]).toBe(shortcut);
    });

    it("leaves everything alone when the edge is no improvement", () => {
      const sp = new AcyclicSP(new WDigraph(3, [new DiWEdge(1, 2, 4)]), 1);
      const before = sp.edgeTo[2];

      expect(sp.relax(new DiWEdge(1, 2, 4))).toBe(false);
      expect(sp.relax(new DiWEdge(1, 2, 10))).toBe(false);
      expect(sp.distTo[2]).toBe(4);
      expect(sp.edgeTo[2]).toBe(before);
    });

    it("cannot relax an edge leaving an unreached vertex", () => {
      const sp = new AcyclicSP(new WDigraph(3, []), 1);

      expect(sp.relax(new DiWEdge(2, 3, 1))).toBe(false);
      expect(sp.distTo[3]).toBe(Infinity);
      expect(sp.edgeTo[3]).toBeUndefined();
    });
  });
});
