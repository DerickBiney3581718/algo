// BFS(G,s)
// for each vertex u ∈ V [G] − {s} do
// state[u] = “undiscovered”
// p[u] = nil, i.e. no parent is in the BFS tree
// state[s] = “discovered”
// p[s] = nil
// Q = {s}
// while Q = ∅ do
// u = dequeue[Q]
// process vertex u as desired
// for each v ∈ Adj[u] do
// process edge (u,v) as desired
// if state[v] = “undiscovered” then
// state[v] = “discovered”
// p[v] = u
// enqueue[Q,v]
// state[u] = “processed”

import { Queue } from "../ch03/queue.js";
import { Graph } from "./graph.js";

function bfs(graph, root, process_vertex_early, process_edge) {
  const queue = new Queue();

  console.log("graph root", root);
  queue.enqueue(root);

  while (!queue.isEmpty()) {
    console.log("printing q...", queue);
    const currNode = queue.dequeue();
    if (!currNode) break;

    graph.updateVertexStatus(currNode, "discovered");
    if (process_vertex_early) process_vertex_early(currNode);
    const currNodeNeighbors = graph.getAdjacencyListValues(currNode);

    for (let neighbor of currNodeNeighbors) {
      const status = graph.getVertexStatus(neighbor);
      if (status !== "processed" || graph.isDirected) {
        if (process_edge) process_edge(neighbor);
      }
      if (status === "undiscovered") {
        queue.enqueue(neighbor);
        graph.updateVertexStatus(neighbor, "discovered");
        graph.setParent(neighbor, currNode);
      }
    }

    graph.updateVertexStatus(currNode, "processed");
    console.log("processed...", currNode);
  }
}

// finding the shortest path
function findPath(graph, start, end) {
  if (start === end || end === undefined) {
    console.log("start...", end);
    return;
  }

  findPath(graph, start, graph.verticesParents[end]);
  console.log(end);
}

// counting connected components
function countConnectedComponents(graph) {
  let count = 0;

  for (let idx = 0; idx < graph.edgesList.length; idx++) {
    const status = graph.getVertexStatus(idx);
    if (status === "undiscovered") {
      const adjacencyList = graph.getAdjacencyListValues(idx);

      if (adjacencyList) {
        console.log("idx :", idx, "with list: ", adjacencyList);
        bfs(graph, idx);
        count++;
      }
    }
  }
  return count;
}

/**
 *TODO:
 * @param {*} graph
 */
function twoColor(graph) {
  const colors = Array.from({ length: graph.MAX_V + 1 });
  let isBipartite = true;

  function process_edge(start, next) {
    if (colors[start] === colors[next]) isBipartite = false;
    colors[next] = complement(start);
  }

  function complement(idx) {
    return colors[idx] === "WHITE" ? "BLACK" : "WHITE";
  }

  for (let idx = 0; idx < graph.edgesList.length; idx++) {
    const status = graph.getVertexStatus(idx);
    if (status === "undiscovered") {
      colors[idx] = "WHITE";
      bfs(graph, 1, null, process_edge);
    }
  }
  return isBipartite;
}

const graph1 = new Graph();
await graph1.initGraph();
graph1.printGraph();

bfs(graph1, 1);
findPath(graph1, 1, 9);

const graph2 = new Graph();
await graph2.initGraph();
console.log("counting...", countConnectedComponents(graph2));
console.log("is bipartite: ", twoColor(graph2));
