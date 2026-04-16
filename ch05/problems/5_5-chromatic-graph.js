// Give a linear algorithm to compute the chromatic number of graphs where each
// vertex has degree at most 2. Must such graphs be bipartite?
// such a graph would have between 1 to 3 max colors
// cond1:  only one vertex; cond2: has no loops or loops consist of even number of vertices, cond3: has a loop with odd number of vertices.

import { Graph } from "../graph.js";

// dfs is great for finding cycles using back edges
// edge classifications: tree , back, cross, forward
// vertex can be undiscovered, discovered, processed

const UNDISCOVERED = "undiscovered";
const DISCOVERED = "discovered";
const PROCESSED = "processed";

const TREE = "t";
const BACK = "b";
const FORWARD = "f";
const CROSS = "c";

function dfs(graph, root = 1, entry = {}, exit = {}, time = 0, options = {}) {
  if (root === undefined) return;
  entry[root] = ++time;

  //   preprocessing
  graph.updateVertexStatus(root, DISCOVERED);

  if (
    options.processVtxEarly &&
    typeof options.processVtxEarly === "function"
  ) {
    options.processVtxEarly({ graph, root, entry, exit, time, options });
  }

  function edgeClass(edge, startVtx) {
    const status = graph.getVertexStatus(edge);
    if (status === UNDISCOVERED) return TREE;
    if (status === DISCOVERED && graph.getParent(startVtx) !== edge)
      return BACK;
    if (status === PROCESSED) {
      if (graph.checkIsAncestor(edge, startVtx)) return FORWARD;
      else return CROSS;
    }
  }

  const neighbors = graph.getAdjacencyList(root);

  if (Array.isArray(neighbors)) {
    for (let neighbor of neighbors) {
      const status = graph.getVertexStatus(neighbor);
      if (status === UNDISCOVERED) {
        graph.setParent(neighbor, root);

        const dfsLoad = dfs(graph, neighbor, entry, exit, time, options);
        if (dfsLoad && dfsLoad.time) time = dfsLoad?.time;
      } else if (status === DISCOVERED) {
        const edgeCls = edgeClass(neighbor, root);
        if (edgeCls === BACK) {
          if (
            options.processBackEdges &&
            typeof options.processBackEdges === "function"
          ) {
            options.processBackEdges({
              graph,
              root,
              entry,
              exit,
              time,
              options,
              neighbor,
            });
          }
        }
      }
    }
  }

  exit[root] = ++time;
  graph.updateVertexStatus(root, PROCESSED);
  if (options.processVtxLate && typeof options.processVtxLate === "function")
    options.processVtxLate({ graph, entry, exit, time });
  return { exit, entry, time, options };
}

function findChromeGraphs(graph) {
  function processBackEdges({ options, root, neighbor }) {
    if (!options || !options.depth) {
      console.log("depth missing in options", options.depth);
      return;
    }
    const { depth, maxChromes } = options;
    if (maxChromes === 3) return;
    const tempChromes = depth[root] - depth[neighbor] + 1;
    options.maxChromes = tempChromes % 2 ? 2 : 3;
  }

  function processVtxEarly({ graph, root, options }) {
    let depth = options.depth;
    if (!depth) depth = {};
    depth[root] = graph.getVertexDepth(root);
  }

  let maxChromes = 1;

  for (let idx = 1; idx < graph.edgesList.length; idx++) {
    if (graph.getVertexStatus(idx) === UNDISCOVERED) {
      const { options } = dfs(graph, idx, undefined, undefined, 0, {
        processBackEdges,
        processVtxEarly,
        maxChromes,
        depth: {},
      });

      if (options.maxChromes > 2) {
        maxChromes = options.maxChromes;
        break;
      }
    }
  }
  return maxChromes;
}

const g = new Graph();
await g.initGraph();
g.printGraph();
console.log("chroming..", findChromeGraphs(g));
