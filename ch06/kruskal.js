import { HashMap } from "../ch03/hash-map.js";
import { SetUnion } from "./set-union.js";
/**
 *priority queue for edges using weight
 * a common connected component arr
 */

function kruskal(graph) {
  const N_VERTICES = graph.nVertices;
  const mst = [];

  const hashMap = new HashMap();
  const commonSet = new SetUnion(graph.vertices);
  const priorityQ = new PriorityQueue();

  for (let vtx = 0; vtx < N_VERTICES; vtx++) {
    const allEdges = graph.getAdjacencyListEdges(vtx);
    for (let edge of allEdges) {
      const hashKey =
        vtx > edge ? `${vtx}_${edge.value}` : `${edge.value}_${vtx}`;
    }
    const alreadyInQ = hashMap.search(hashKey);
    if (alreadyInQ) continue;
    priorityQ.insert(edge, edge.weight);
  }

  while (priorityQ.length) {
    const minEdge = priorityQ.pop();
    const [vtxA, vtxB] = minEdge.split("_");
    if (commonSet.same_component(vtxA, vtxB)) continue;
    commonSet.union(vtxA, vtxB);
  }
  return treeCompArr;
}

// kruskal(graph *g)
// {
// int i; /* counter */
// set_union s; /* set union data structure */
// edge_pair e[MAXV+1]; /* array of edges data structure */
// bool weight_compare();
// set_union_init(&s, g->nvertices);
// to_edge_array(g, e); /* sort edges by increasing cost */
// qsort(&e,g->nedges,sizeof(edge_pair),weight_compare);
// for (i=0; i<(g->nedges); i++) {
// if (!same_component(s,e[i].x,e[i].y)) {
// printf("edge (%d,%d) in MST\n",e[i].x,e[i].y);
// union_sets(&s,e[i].x,e[i].y);
// }
// }
// }
