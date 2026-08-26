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
  pq: IndexedPriorityQueue<WEdge>;
  dist: number[];
  edgeTo: number[];
  q: Queue<WEdge> = new Queue();

  constructor(G: WUndirectedGraph) {
    this.G = G;
    this.dist = Array.from({ length: G.V + 1 }, () => Number.MAX_SAFE_INTEGER);
    this.edgeTo = Array.from({ length: G.V + 1 });
    this.pq = new IndexedPriorityQueue(G.V + 1, true); // only non-tree min crossing edges

    // insert first vertex
    this._updateDist(1, 0);
    this._addEdges(1);

    this.buildTree();
  }

  get weight(): number {
    return this._weight;
  }

  buildTree(): void {
    console.log(`is empty? ${this.pq.isEmpty} ${this.pq}`);
    while (!this.pq.isEmpty) {
      const min = this.pq.delMax();
      console.log(`min: ${min}`);
      if (min == null) return;

      this.q.enqueue(min);
      this._weight += min.weight;

      let treeVtx = min.either();
      let newVtx = min.other(treeVtx);

      if (this.edgeTo[treeVtx] == null) [treeVtx, newVtx] = [newVtx, treeVtx];
      this.edgeTo[newVtx] = treeVtx;
      this._addEdges(newVtx);
    }
  }

  _updateDist(vtx: number, weight: number): void {
    this.dist[vtx] = weight;
  }

  _addEdges(vtx: number): void {
    for (const edge of this.G.adj(vtx)) {
      console.log(`edge: ${edge}`);

      if (edge == null) continue;
      const other = edge.other(vtx);

      if (this.edgeTo[other]) continue;
      if (this.dist[other] == Number.MAX_SAFE_INTEGER) {
        console.log("inserting...");

        this.pq.insertWithKey(other, edge);
        this.dist[other] = edge.weight;
      } else {
        if (this.dist[other] <= edge.weight) continue;
        else {
          this.dist[other] = edge.weight;
          this.pq.updateItem(other, edge);
        }
      }
    }
  }
}
