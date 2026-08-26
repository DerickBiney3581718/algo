import { assert, describe, expect, it } from "vitest";
import tinyDGText from "../../data/graphs/tinyDG.txt?raw";
import tinyDAGText from "../../data/graphs/tinyDAG.txt?raw";
import tinyChainText from "../../data/graphs/tinyChain.txt?raw";
import { parseGraph } from "../../data/graphs/parse";
import { Digraph } from "../../data-structures/graphs/Digraph";
import { DirectedCycle } from "./DirectedCycle";

describe("Directed Cycles", () => {
  // tinyDG: 13 vertices (1..13), 22 edges — has cycles
  const tinyDG = parseGraph(tinyDGText);
  const G = new Digraph(tinyDG.V, tinyDG.edges);
  const dd = new DirectedCycle(G);

  // tinyDAG: 13 vertices, 15 edges — acyclic
  const tinyDAG = parseGraph(tinyDAGText);
  const DAG = new Digraph(tinyDAG.V, tinyDAG.edges);
  const dc = new DirectedCycle(DAG);

  // tinyChain: 1,2 -> 3 -> 4,5 — acyclic
  const tinyChain = parseGraph(tinyChainText);
  const DAG2 = new Digraph(tinyChain.V, tinyChain.edges);
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
