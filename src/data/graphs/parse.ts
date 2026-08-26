import type { Edge } from "../../data-structures/graphs/UndirectedGraph";
import type { WEdgeParam } from "../../data-structures/graphs/WUndirectedGraph";

/**
 * Loaders for the graph fixtures in this folder.
 *
 * The files are kept byte-for-byte as Sedgewick & Wayne ship them on the
 * Algorithms booksite (https://algs4.cs.princeton.edu), so they can be
 * re-downloaded and diffed. Their format is:
 *
 *   line 1: V, line 2: E, then one "v w [weight]" per line, whitespace separated.
 *
 * Booksite vertices are 0-indexed; our graph structures leave vertex 0 unused,
 * so every vertex is shifted by +1 on load. Weights are unaffected.
 */
export type ParsedGraph<E> = {
  V: number;
  E: number;
  edges: E[];
};

const VERTEX_OFFSET = 1;

function tokenize(text: string): { V: number; E: number; rows: string[][] } {
  const rows = text
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter((row) => row[0].length > 0);

  return {
    V: Number(rows[0][0]),
    E: Number(rows[1][0]),
    rows: rows.slice(2),
  };
}

function assertEdgeCount(expected: number, actual: number): void {
  if (expected !== actual) {
    throw new Error(`expected ${expected} edges, parsed ${actual}`);
  }
}

/** Unweighted graph or digraph, e.g. tinyDG.txt, tinyDAG.txt. */
export function parseGraph(text: string): ParsedGraph<Edge> {
  const { V, E, rows } = tokenize(text);

  const edges: Edge[] = rows.map(([v, w]) => [
    Number(v) + VERTEX_OFFSET,
    Number(w) + VERTEX_OFFSET,
  ]);

  assertEdgeCount(E, edges.length);
  return { V, E, edges };
}

/** Edge-weighted graph, e.g. tinyEWG.txt, mediumEWG.txt. */
export function parseWeightedGraph(text: string): ParsedGraph<WEdgeParam> {
  const { V, E, rows } = tokenize(text);

  const edges: WEdgeParam[] = rows.map(([v, w, weight]) => [
    Number(v) + VERTEX_OFFSET,
    Number(w) + VERTEX_OFFSET,
    Number(weight),
  ]);

  assertEdgeCount(E, edges.length);
  return { V, E, edges };
}
