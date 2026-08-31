import { describe, expect, it } from "vitest";
import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { WDigraph } from "../../data-structures/graphs/WDigraph";
import type { Stack } from "../../data-structures/stacks/Stack";
import { DijkstraSP } from "./DijkstraSP";

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
 * A diamond DAG where the two-hop route beats the direct edge:
 *
 *   0 -(5)-> 1        0 -(1)-> 2 -(1)-> 1
 *   1 -(2)-> 3        2 -(7)-> 3
 *
 * shortest paths from 0: 1 = 2, 2 = 1, 3 = 4 (via 0->2->1->3)
 * vertex 4 is isolated.
 */
function diamond(): WDigraph {
  return new WDigraph(5, [
    new DiWEdge(0, 1, 5),
    new DiWEdge(0, 2, 1),
    new DiWEdge(2, 1, 1),
    new DiWEdge(1, 3, 2),
    new DiWEdge(2, 3, 7),
  ]);
}

describe("SP", () => {
  it("seeds the source and leaves every other vertex at infinity", () => {
    const G = new WDigraph(3, []);
    const sp = new DijkstraSP(G, 0);

    expect(sp.src).toBe(0);
    expect(sp.G).toBe(G);
    expect(sp.distTo).toEqual([0, Infinity, Infinity]);
    expect(sp.edgeTo[0]).toBeUndefined();
  });

  it("computes the shortest distance to every reachable vertex", () => {
    const sp = new DijkstraSP(diamond(), 0);

    expect(sp.distTo[0]).toBe(0);
    expect(sp.distTo[1]).toBe(2);
    expect(sp.distTo[2]).toBe(1);
    expect(sp.distTo[3]).toBe(4);
  });

  it("prefers the cheaper multi-hop route over the direct edge", () => {
    const sp = new DijkstraSP(diamond(), 0);

    expect(sp.distTo[1]).toBeLessThan(5);
    expect(names(sp.pathTo(1))).toEqual(["0->2", "2->1"]);
  });

  it("records the last edge on the shortest path in edgeTo", () => {
    const sp = new DijkstraSP(diamond(), 0);

    expect(sp.edgeTo[1]).toMatchObject({ from: 2, to: 1, weight: 1 });
    expect(sp.edgeTo[2]).toMatchObject({ from: 0, to: 2, weight: 1 });
    expect(sp.edgeTo[3]).toMatchObject({ from: 1, to: 3, weight: 2 });
  });

  it("returns the full path, in source-to-target order", () => {
    const sp = new DijkstraSP(diamond(), 0);

    expect(names(sp.pathTo(3))).toEqual(["0->2", "2->1", "1->3"]);
    expect(drain(sp.pathTo(3)).reduce((sum, e) => sum + e.weight, 0)).toBe(
      sp.distTo[3],
    );
  });

  it("returns an empty path for the source itself", () => {
    const sp = new DijkstraSP(diamond(), 0);
    const path = sp.pathTo(0);

    expect(path).not.toBeNull();
    expect(path?.size).toBe(0);
  });

  it("reports no path to an unreachable vertex", () => {
    const sp = new DijkstraSP(diamond(), 0);

    expect(sp.hasPathTo(0)).toBe(true);
    expect(sp.hasPathTo(3)).toBe(true);
    expect(sp.hasPathTo(4)).toBe(false);
    expect(sp.distTo[4]).toBe(Infinity);
    expect(sp.pathTo(4)).toBeNull();
  });

  it("only reaches what the source can reach, given the edge directions", () => {
    // 2 -> 0 exists, but 0 has no way back to 2.
    const G = new WDigraph(3, [new DiWEdge(0, 1, 4), new DiWEdge(2, 0, 1)]);
    const sp = new DijkstraSP(G, 0);

    expect(sp.distTo).toEqual([0, 4, Infinity]);
    expect(sp.hasPathTo(2)).toBe(false);
  });

  it("starts from any source, not just vertex 0", () => {
    const sp = new DijkstraSP(diamond(), 2);

    expect(sp.distTo[2]).toBe(0);
    expect(sp.distTo[1]).toBe(1);
    expect(sp.distTo[3]).toBe(3);
    expect(sp.hasPathTo(0)).toBe(false);
    expect(names(sp.pathTo(3))).toEqual(["2->1", "1->3"]);
  });

  it("handles zero-weight edges", () => {
    const G = new WDigraph(3, [
      new DiWEdge(0, 1, 0),
      new DiWEdge(1, 2, 0),
      new DiWEdge(0, 2, 3),
    ]);
    const sp = new DijkstraSP(G, 0);

    expect(sp.distTo).toEqual([0, 0, 0]);
    expect(names(sp.pathTo(2))).toEqual(["0->1", "1->2"]);
  });

  it("keeps the cheapest of parallel edges", () => {
    const G = new WDigraph(2, [
      new DiWEdge(0, 1, 9),
      new DiWEdge(0, 1, 2),
      new DiWEdge(0, 1, 6),
    ]);
    const sp = new DijkstraSP(G, 0);

    expect(sp.distTo[1]).toBe(2);
    expect(sp.edgeTo[1].weight).toBe(2);
  });

  it("ignores self loops", () => {
    const G = new WDigraph(2, [new DiWEdge(0, 0, 1), new DiWEdge(0, 1, 3)]);
    const sp = new DijkstraSP(G, 0);

    expect(sp.distTo).toEqual([0, 3]);
    expect(sp.edgeTo[0]).toBeUndefined();
  });

  it("accumulates weight along a chain", () => {
    const G = new WDigraph(5, [
      new DiWEdge(0, 1, 1.5),
      new DiWEdge(1, 2, 2.25),
      new DiWEdge(2, 3, 0.25),
      new DiWEdge(3, 4, 4),
    ]);
    const sp = new DijkstraSP(G, 0);

    expect(sp.distTo[4]).toBeCloseTo(8, 5);
    expect(names(sp.pathTo(4))).toEqual(["0->1", "1->2", "2->3", "3->4"]);
  });

  it("re-relaxes a vertex when a shorter route turns up later", () => {
    // 0->3 is walked first and sets distTo[3] = 100; the 0->1->2->3 route has
    // to come back and improve it to 3.
    const G = new WDigraph(4, [
      new DiWEdge(0, 1, 1),
      new DiWEdge(0, 3, 100),
      new DiWEdge(1, 2, 1),
      new DiWEdge(2, 3, 1),
    ]);
    const sp = new DijkstraSP(G, 0);

    expect(sp.distTo[3]).toBe(3);
    expect(names(sp.pathTo(3))).toEqual(["0->1", "1->2", "2->3"]);
  });

  describe("cycles", () => {
    it("terminates on a directed cycle and still gets the distances right", () => {
      // 0 -> 1 -> 2 -> 0 is a cycle; 2 -> 3 hangs off it.
      const G = new WDigraph(4, [
        new DiWEdge(0, 1, 1),
        new DiWEdge(1, 2, 2),
        new DiWEdge(2, 0, 3),
        new DiWEdge(2, 3, 1),
      ]);
      const sp = new DijkstraSP(G, 0);
      expect(sp.distTo).toEqual([0, 1, 3, 4]);
      expect(names(sp.pathTo(3))).toEqual(["0->1", "1->2", "2->3"]);
    });
    it("does not walk back into the source around a cycle", () => {
      const G = new WDigraph(3, [
        new DiWEdge(0, 1, 1),
        new DiWEdge(1, 2, 1),
        new DiWEdge(2, 0, 1),
      ]);
      const sp = new DijkstraSP(G, 0);
      // going the whole way round costs 3, which is no improvement on 0.
      expect(sp.distTo[0]).toBe(0);
      expect(sp.edgeTo[0]).toBeUndefined();
      expect(sp.pathTo(0)?.size).toBe(0);
    });
    it("handles a pair of vertices pointing at each other", () => {
      const G = new WDigraph(3, [
        new DiWEdge(0, 1, 10),
        new DiWEdge(0, 2, 1),
        new DiWEdge(2, 1, 1),
        new DiWEdge(1, 2, 1),
      ]);
      const sp = new DijkstraSP(G, 0);
      expect(sp.distTo).toEqual([0, 2, 1]);
      expect(names(sp.pathTo(1))).toEqual(["0->2", "2->1"]);
    });
    it("terminates when every vertex sits on a cycle", () => {
      // two overlapping cycles: 0->1->2->0 and 1->3->1
      const G = new WDigraph(4, [
        new DiWEdge(0, 1, 2),
        new DiWEdge(1, 2, 2),
        new DiWEdge(2, 0, 2),
        new DiWEdge(1, 3, 5),
        new DiWEdge(3, 1, 1),
      ]);
      const sp = new DijkstraSP(G, 0);
      expect(sp.distTo).toEqual([0, 2, 4, 7]);
    });
  });
});
