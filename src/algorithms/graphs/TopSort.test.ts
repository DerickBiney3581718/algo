import { describe, expect, it } from "vitest";
import tinyChainText from "../../data/graphs/tinyChain.txt?raw";
import { parseGraph } from "../../data/graphs/parse";
import { Digraph } from "../../data-structures/graphs/Digraph";
import { TopSort } from "./TopSort";

describe("TopSort", () => {
  // tiny DAG for hand-checking topological order: 1,2 -> 3 -> 4,5
  const tinyChain = parseGraph(tinyChainText);
  const DAG = new Digraph(tinyChain.V, tinyChain.edges);
  const ts = new TopSort(DAG);

  it("sorts", () => {
    expect(ts.sorted.length).toBe(tinyChain.V);
  });
});
