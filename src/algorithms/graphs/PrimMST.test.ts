import { describe, expect, it } from "vitest";
import tinyEWGText from "../../data/graphs/tinyEWG.txt?raw";
import mediumEWGText from "../../data/graphs/mediumEWG.txt?raw";
import { parseWeightedGraph } from "../../data/graphs/parse";
import { WUndirectedGraph } from "../../data-structures/graphs/WUndirectedGraph";
import { PrimMST } from "./PrimMST";

describe("PrimMST", () => {
  it("builds the MST of tinyEWG (8 vertices, 16 edges)", () => {
    const { V, edges } = parseWeightedGraph(tinyEWGText);

    const G = new WUndirectedGraph(V, edges);

    expect(G.V).toBe(8);
    expect(G.E).toBe(16);

    const mst = new PrimMST(G);
    console.log(mst);

    expect(mst.q.size).toBe(G.V - 1);
    expect(mst.weight).toBeCloseTo(1.81, 5);
  });

  it("builds the MST of mediumEWG (250 vertices, 1273 edges)", () => {
    const { V, edges } = parseWeightedGraph(mediumEWGText);
    const G = new WUndirectedGraph(V, edges);
    expect(G.V).toBe(250);
    expect(G.E).toBe(1273);

    const mst = new PrimMST(G);

    expect(mst.q.size).toBe(G.V - 1);
    expect(mst.weight).toBeCloseTo(10.46351, 5);
  });
});
