// tinyDG: 13 vertices (1..13), 22 edges — has cycles +

import { assert, describe, expect, it } from "vitest";
import { Digraph } from "../../data-structures/graphs/Digraph";
import type { Edge } from "../../data-structures/graphs/UndirectedGraph";
import { DirectedCycle } from "./DirectedCycle";

describe("Directed Cycles", () => {
  const tinyDG: Edge[] = [
    [5, 3],
    [3, 4],
    [4, 3],
    [7, 1],
    [1, 2],
    [3, 1],
    [12, 13],
    [13, 10],
    [10, 11],
    [10, 12],
    [8, 10],
    [11, 13],
    [12, 5],
    [5, 4],
    [4, 6],
    [7, 9],
    [9, 7],
    [6, 5],
    [1, 6],
    [7, 5],
    [7, 10],
    [8, 7],
  ];
  const G = new Digraph(13, tinyDG);
  const dd = new DirectedCycle(G);

  const tinyDAG: Edge[] = [
    [3, 4],
    [1, 7],
    [1, 2],
    [3, 1],
    [12, 13],
    [10, 13],
    [10, 11],
    [10, 12],
    [4, 6],
    [9, 8],
    [6, 5],
    [1, 6],
    [7, 5],
    [7, 10],
    [8, 7],
  ];
  const DAG = new Digraph(13, tinyDAG);
  const dc = new DirectedCycle(DAG);

  const tinyChain: Edge[] = [
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
  ];
  const DAG2 = new Digraph(5, tinyChain);
  const tc = new DirectedCycle(DAG2);

  it("has cycles", () => {
    expect(dd.hasCycle).toBe(true);
  });

  it("has no cycles", () => {
    expect(dc.hasCycle).toBe(false);
    expect(tc.hasCycle).toBe(false);
  });

  it("shows cycles", () => {
    const ddCycle = dd.showCycle;
    assert(ddCycle.size > 2);
  });

  it("shows no cycles", () => {
    const cycle = dc.showCycle;
    assert(cycle.size == 0, "DAG should not have a cycles");

    const tcCycle = tc.showCycle;
    assert(tcCycle.size == 0);
  });
});

// // tinyDAG: 13 vertices, 15 edges — acyclic, use for
// //   TopSort
// const tinyDAG: Edge[] = [
//   [3, 4],
//   [1, 7],
//   [1, 2],
//   [3, 1],
//   [12, 13],
//   [10, 13],
//   [10, 11],
//   [10, 12],
//   [4, 6],
//   [9, 8],
//   [6, 5],
//   [1, 6],
//   [7, 5],
//   [7, 10],
//   [8, 7],
// ];
// const DAG = new Digraph(13, tinyDAG);

// // tiny cyclic — smallest useful DirectedCycle case:
// //   1->2->3->1, plus tail 4
// const tinyCycle: Edge[] = [
//   [1, 2],
//   [2, 3],
//   [3, 1],
//   [3, 4],
// ];
