import { UndirectedGraph } from "../../data-structures/graphs/UndirectedGraph";
import { Queue } from "../../data-structures/queues/Queue";

export function dfs(
  G: UndirectedGraph,
  search: number,
  root?: number,
  marked?: boolean[],
  q?: Queue<number>,
): Queue<number> | -1 {
  if (root == null) root = Math.ceil(Math.random() * G.V);
  if (!marked) marked = Array.from({ length: G.V }, () => false);
  if (!q) q = new Queue();

  if (root === search) return q;
  const adj = G.adj(root);

  for (const vtx of adj) {
    if (vtx == null || marked[vtx] == true) continue;
    q.enqueue(vtx);
    marked[vtx] = true;

    const res = dfs(G, search, vtx, marked, q);
    if (res !== -1) return res; // early return
  }
  return -1;
}

const edges: [number, number][] = [
  [5, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [5, 4],
];

const G = new UndirectedGraph(5, edges);
console.log("G: ", G.toString());

const search = dfs(G, 3, 1);
console.log("search", search);
