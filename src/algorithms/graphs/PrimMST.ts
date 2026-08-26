import type { WEdge } from "../../data-structures/graphs/WEdge";
import type { WUndirectedGraph } from "../../data-structures/graphs/WUndirectedGraph";
import { IndexedPriorityQueue } from "../../data-structures/priority-queues/IndexedPriorityQueue";
import { Queue } from "../../data-structures/queues/Queue";

/**
 * public class MST
 * MST(EdgeWeightedGraph G) constructor
 * Iterable<Edge> edges() all of the MST edges
 * double weight() weight of MST
 */
export class PrimMST {
  G: WUndirectedGraph;
  _weight: number = 0;
  pq: IndexedPriorityQueue;
  dist: number[]; //last shortest weight recorded for the vertex
  edgeTo: WEdge[]; //current edge for vtx
  q: Queue<WEdge> = new Queue();
  marked: boolean[];

  constructor(G: WUndirectedGraph, source: number = 1) {
    this.G = G;
    this.dist = Array.from({ length: G.V + 1 }, () => Number.MAX_SAFE_INTEGER);
    this.edgeTo = Array.from({ length: G.V + 1 });
    this.marked = Array.from({ length: G.V + 1 }, () => false);
    this.pq = new IndexedPriorityQueue(G.V + 1, true); // only non-tree min crossing edges

    this._addEdges(source); //!disconnected components
    this.buildTree();
  }

  get weight(): number {
    return this._weight;
  }

  buildTree(): void {
    while (!this.pq.isEmpty) {
      const min = this.pq.delTop();
      if (min == null) return;

      const minEdge = this.edgeTo[min];
      this.q.enqueue(minEdge);
      this._weight += minEdge.weight;

      if (this.marked[min] != true) this._addEdges(min);
    }
  }

  _addEdges(vtx: number): void {
    for (const edge of this.G.adj(vtx)) {
      if (edge == null) continue;

      const other = edge.other(vtx);
      if (this.marked[other]) continue;

      if (!this.pq.contains(other)) {
        this.pq.insert(other, edge.weight);
        this.dist[other] = edge.weight;
        this.edgeTo[other] = edge;
      } else {
        if (this.dist[other] <= edge.weight) continue;
        else {
          this.pq.update(other, edge.weight);
          this.dist[other] = edge.weight;
          this.edgeTo[other] = edge;
        }
      }
    }
    this.marked[vtx] = true;
  }
}
