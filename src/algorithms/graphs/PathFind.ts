import type { SymbolGraph } from "../../data-structures/graphs/SymbolGraph";
import { UndirectedGraph } from "../../data-structures/graphs/UndirectedGraph";
import { Queue } from "../../data-structures/queues/Queue";
import { Stack } from "../../data-structures/stacks/Stack";

/**
 *
 */
export class DFSPathFind {
  marked: boolean[];
  edgeTo: number[];
  G: UndirectedGraph;
  src: number; //source vertex

  constructor(G: UndirectedGraph, source: number) {
    this.G = G;
    this.src = source;

    this.marked = Array.from({ length: G.V + 1 });
    this.edgeTo = Array.from({ length: G.V + 1 });
    this.dfs(this.src);
  }

  dfs(src: number) {
    for (const vtx of this.G.adj(src)) {
      if (vtx == null || this.marked[vtx]) continue;
      this.marked[vtx] = true;
      this.edgeTo[vtx] = src;
      this.dfs(vtx);
    }
  }

  findPathTo(target: number): Stack<number> {
    let end = target;

    const stack = new Stack<number>();
    const set = new Set();

    while (this.edgeTo[end] != null && !set.has(end)) {
      set.add(end);
      stack.push(end);

      if (end === this.src) break;
      end = this.edgeTo[end];
    }

    return stack;
  }

  hasPathTo(target: number): boolean {
    return !!this.marked[target];
  }
}

export class BFSPathFind {
  marked: boolean[];
  edgeTo: number[];
  src: number;
  G: UndirectedGraph | SymbolGraph;
  q: Queue<number>;

  constructor(G: UndirectedGraph | SymbolGraph, src: number) {
    this.G = G;
    this.src = src;

    this.marked = Array.from({ length: G.V + 1 });
    this.edgeTo = Array.from({ length: G.V + 1 });
    this.q = new Queue<number>([src]);
    this.bfs();
  }

  bfs(): void {
    const vtx = this.q.dequeue();
    if (vtx == null) return;

    this.marked[vtx] = true;

    for (const adjVtx of this.G.adj(vtx)) {
      if (adjVtx == null || this.marked[adjVtx]) continue;
      this.q.enqueue(adjVtx);
      this.edgeTo[adjVtx] = vtx;
    }

    this.bfs();
  }

  hasPathTo(tar: number): boolean {
    return !!this.marked[tar];
  }

  findPathTo(tar: number): Stack<number> {
    const seen = new Set();
    const stack = new Stack<number>();

    while (tar != null) {
      if (seen.has(tar)) break;
      seen.add(tar);
      stack.push(tar);

      if (tar === this.src) break;

      tar = this.edgeTo[tar];
    }
    return stack;
  }
}

// const edges: [number, number][] = [
//   [5, 1],
//   [1, 2],
//   [2, 3],
//   [3, 4],
//   [5, 4],
// ];

// const G = new UndirectedGraph(5, edges);
// console.log(`G:\n${G}`);

// console.log("DFS path is here:");
// const pathFind = new DFSPathFind(G, 5);
// console.log(`has path: ${pathFind.hasPathTo(3)}`);
// console.log(`Path: ${pathFind.findPathTo(3)} `);

// console.log("BFS path is here");
// const pathFindShort = new BFSPathFind(G, 5);
// console.log(`Has path: ${pathFindShort.hasPathTo(3)}`);
// console.log(`Path: ${pathFindShort.findPathTo(3)} `);
