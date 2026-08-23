import { describe, expect, it } from "vitest";
import type { Edge } from "./UndirectedGraph";
import { Digraph } from "./Digraph";

describe("Digraph", () => {
  // tinyDG: 13 vertices (1..13), 22 edges — has cycles +
  //   strong components
  const vertices = 13;
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
  const G = new Digraph(vertices, tinyDG);
  const edges = tinyDG.length;

  it("get vertices count", () => {
    expect(G.V).toBe(vertices);
  });

  it("get edges count", () => {
    expect(G.E).toBe(edges);
  });

  it("returns adj list", () => {
    const ll = G.adj(5);
    expect(ll.size).toBe(2);
  });

  it("adds an edge", () => {
    G.addEdge(5, 1);
    const ll = G.adj(5);
    const edgeVal = ll.search(1);

    expect(G.E).toBe(edges + 1);
    expect(edgeVal).toBeDefined();
  });

  it("reverses graph", () => {});
});
