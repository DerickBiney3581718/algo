import { Graph } from "../ch05/graph.js";

/**
 * intree arr: to monitor all tree vertices
 * edgesDist arr: to get the min distances for all intree vertices
 * TODO: imp with priority queue
 */
function prim(graph) {
  const intree = Array.from({ length: graph.nVertices });
  const edgesDist = Array.from({ length: graph.nVertices });
  const parents = Array.from({ length: graph.nVertices });

  function updateNeighborEdgesDist(currNode) {
    let allEdges = graph.getAdjacencyListEdges(currNode);

    if (!allEdges) return;
    allEdges.forEach((edge) => {
      if (edgesDist[edge.value] > edge.weight) {
        edgesDist[edge.value] = edge.weight;
        parents[edge.value] = currNode;
      }
    });
  }

  let currNode = graph.root;

  while (!intree[currNode]) {
    intree[currNode] = true;
    updateNeighborEdgesDist(currNode);

    let minDist = Number.MAX_SAFE_INTEGER;

    for (let vertex = 0; vertex < edgesDist.length; vertex++) {
      if (intree[vertex]) continue;

      const vtxDist = edgesDist[vertex];
      if (vtxDist < minDist) {
        currNode = vertex;
        minDist = vtxDist;
      }
    }
  }

  return intree;
}

const g = new Graph();
g.initGraph();
prim(g);
g.printGraph();
