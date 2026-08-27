/**
 * sort all edges
 * put all in union find
 * build an mst from U forests of trees
 */

import { WEdge } from "../../data-structures/graphs/WEdge";
import type { WUndirectedGraph } from "../../data-structures/graphs/WUndirectedGraph";
import { PriorityQueue } from "../../data-structures/priority-queues/PriorityQueue";
import { Queue } from "../../data-structures/queues/Queue";
import { UnionFind } from "../../data-structures/union-find/UnionFind";

export class KruskalMST {
  G: WUndirectedGraph;
  q: Queue<WEdge> = new Queue();
  UF: UnionFind;
  pq: PriorityQueue<WEdge>;
  _weight: number = 0;
  constructor(G: WUndirectedGraph) {
    this.G = G;
    this.UF = new UnionFind(G.V + 1);
    this.pq = new PriorityQueue<WEdge>({
      entries: G.edges,
      valueOf: (entry) => entry?.weight ?? null,
      isMin: true,
      max: G.E + 1,
    });

    while (!this.pq.isEmpty && this.q.size <= G.E) {
      const e = this.pq.delTop();
      if (e == null) break;
      if (this.UF.isSame(e.v, e.w)) continue;
      this.UF.unionize(e.v, e.w);
      this._weight += e.weight;
      this.q.enqueue(e);
    }
  }

  get weight(): number {
    return this._weight;
  }
}
