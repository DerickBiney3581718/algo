import { Stack } from "../ch03/stack.js";
import { Graph } from "./graph.js";
//todo: a proper traversal algorithm needs to factor in disconnected components

function dfs(
  graph,
  processLateFn,
  root = 1,
  entry = {},
  exit = {},
  time = 0,
  reachable = [],
  stack = new Stack(),
) {
  if (root === undefined) return;

  graph.updateVertexStatus(root, "discovered");
  time += 1;
  entry[root] = time;
  console.log("I'm in: ", root, "@", time); //early_vertex_processing next

  const neighbors = graph.getAdjacencyList(root);
  if (!neighbors?.length) return;

  for (let neighbor of neighbors) {
    const status = graph.getVertexStatus(neighbor);
    if (status === "processed") {
      // if(graph.isDirected) can either be cross or forward
      continue; //already explored edge
    }
    if (status === "discovered" || graph.isDirected) {
      // not processed yet. Pending child nodes
      //? for back and tree edge labelling,  parent[neighbor] !== root
      const parent = graph.getParent(neighbor);
      if (parent !== root) reachable[neighbor] = root; // add_edge processing. for top sort break
    }
    if (status === "undiscovered") {
      graph.setParent(neighbor, root);
      reachable[neighbor] = neighbor; //   add init edge processing too

      const dfsLoad = dfs(
        graph,
        processLateFn,
        neighbor,
        entry,
        exit,
        time,
        reachable,
        stack,
      );
      if (dfsLoad && dfsLoad.hasOwnProperty("time") && dfsLoad.time)
        time = dfsLoad.time;
    }
  }

  graph.updateVertexStatus(root, "processed");
  stack.push(root);
  if (processLateFn) processLateFn(graph, root, reachable, entry); // late_vertex_processing
  console.log("I'm out: ", root, "@", time);

  exit[root] = time;
  time += 1;

  return { exit, entry, time, stack };
}

function findArticulationVertices(graph, vtx, reachable, entry) {
  // three cases: root with children
  const vtxReachableAncestor = reachable[vtx];
  const parent = graph.getParent(vtx);

  if (parent === undefined) {
    if (graph.getVertexDegrees(vtx) > 1) {
      console.log("root articulation vertex : ", vtx);
    }
  } else if (parent === vtxReachableAncestor) {
    const parentIsLeafRoot =
      graph.getVertexDegrees(graph.getParent(parent)) < 2; // a valid root is one that has multiple vertices; removing it would cause a graph break. else: it's just a leaf node.

    if (parentIsLeafRoot) console.log("parent articulation vertex : ", parent); //, parent == your reachable ancestor
  } else if (vtxReachableAncestor === vtx) {
    console.log("bridge parent articulation vertex: ", parent);
    if (graph.getVertexDegrees(vtx) > 1)
      console.log("bridge self articulation vertex ", vtx); //, bridge
  }

  //   update parent's reachable ancestor if necessary
  const vtxReachableAncestorEntry = entry[vtxReachableAncestor];
  const parentReachableAncestorEntry = entry[parent];

  if (vtxReachableAncestorEntry < parentReachableAncestorEntry)
    reachable[parent] = vtxReachableAncestor;
}

/**
 * 
 * @param {*} graph 
 * @param {*} vtx 
 * @param {*} reachable 
 * @param {*} entry 
 * 
 * topsort(graph *g)
{
int i;
init_stack(&sorted);
for (i=1; i<=g->nvertices; i++)
if (discovered[i] == FALSE)
dfs(g,i);
print_stack(&sorted); 
 */
function topSort(graph, vtx, reachable, entry) {}

const graph1 = new Graph();
graph1.initGraph();
graph1.printGraph();

console.log(dfs(graph1, findArticulationVertices));
// 1 - 3 - 6 - 8 - 9 - 7 - 5 - 2 - 4;
