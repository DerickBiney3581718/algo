import { UndirectedGraph } from "../../data-structures/graphs/UndirectedGraph";
import { Stack } from "../../data-structures/stacks/Stack";

export class PathFind {
  marked: boolean[];
  edgeTo: number[];
  G: UndirectedGraph;
  src: number; //source vertex
  tar: number; // target vertex

  constructor(G: UndirectedGraph, source: number, target: number) {
    this.G = G;
    this.src = source;
    this.tar = target;

    this.marked = Array.from({ length: G.V + 1 });
    this.edgeTo = Array.from({ length: G.V + 1 });
  }

  setPaths(src = this.src) {
    for (const vtx of this.G.adj(src)) {
      if (vtx == null || this.marked[vtx]) continue;
      this.marked[vtx] = true;
      this.edgeTo[vtx] = src;
      this.setPaths(vtx);
    }
  }

  run() {
    this.setPaths();
    let end = this.tar;

    const stack = new Stack();
    const set = new Set();

    while (this.edgeTo[end] != null && !set.has(end)) {
      set.add(end);
      stack.push(end);

      if (end === this.src) break;
      end = this.edgeTo[end];
    }

    return stack;
  }
}

const edges: [number, number][] = [
  [5, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [5, 4],
];

const G = new UndirectedGraph(5, edges);
console.log(`G:\n${G}`);

const pathFind = new PathFind(G, 5, 3);
console.log(`${pathFind.run()}`);
