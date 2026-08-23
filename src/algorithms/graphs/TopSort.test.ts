import { describe, expect, it } from "vitest";
import type { Edge } from "../../data-structures/graphs/UndirectedGraph";
import { Digraph } from "../../data-structures/graphs/Digraph";
import { TopSort } from "./TopSort";

describe("TopSort", () => {
  // tiny DAG for hand-checking topological order: 1,2 -> 3
  //   -> 4,5
  const tinyChain: Edge[] = [
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
  ];

  const vertices = 5;
  const DAG = new Digraph(vertices, tinyChain);
  const ts = new TopSort(DAG);

  it("sorts", () => {
    console.log(`${ts.sorted}`);
    expect(ts.sorted.size).toBe(vertices);
  });
});
