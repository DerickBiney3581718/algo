import { Graph } from "../ch05/graph.js";

let isFinished = false;

function isSolution(startVtx, endVtx, meta) {
  return startVtx === endVtx;
}

function processSolution(startVtx, endVtx, meta) {
  console.log("***", startVtx, endVtx);
}

function generateCandidates(startVtx, meta) {
  const edges = meta.graph.getAdjacencyListValues(startVtx);
  console.log("startVtx", startVtx, "edges: ", edges);
  return edges.filter((val) => !meta.explored.includes(val));
}

function backtracking(startVtx, endVtx, meta) {
  if (isSolution(startVtx, endVtx, meta))
    processSolution(startVtx, endVtx, meta);
  else {
    const candidates = generateCandidates(startVtx, meta);

    for (let i = 0; i < candidates.length; i++) {
      const newVtx = candidates[i];
      meta.explored.push(newVtx);

      // todo:  make some move
      backtracking(newVtx, endVtx, meta);
      //   todo: unmake some move
      if (isFinished) return;
    }
  }
}

const g1 = new Graph();
g1.initGraph();
g1.printGraph();

backtracking(g1.root, 8, { graph: g1, explored: [] });
