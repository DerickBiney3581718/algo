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

function bfs(graph) {
  const root = graph.root;
  const queue = new Queue();

  console.log("graph root", root);
  queue.enqueue(root);

  while (!queue.isEmpty()) {
    console.log("printing q...", queue);
    const currNode = queue.dequeue();
    if (!currNode) break;

    graph.updateVertexStatus(currNode, "discovered");
    const currNodeNeighbors = graph.getAdjacencyList(currNode);

    for (let neighbor of currNodeNeighbors) {
      const status = graph.getVertexStatus(neighbor);
      if (status !== "undiscovered") continue;
      graph.updateVertexStatus(neighbor, "discovered");
      queue.enqueue(neighbor);
    }

    graph.updateVertexStatus(currNode, "processed");

    console.log("processed...", currNode);
  }
}

const graph1 = new Graph();
await graph1.initGraph();
graph1.printGraph();

bfs(graph1);
