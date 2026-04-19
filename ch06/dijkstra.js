/**
 * start,end
 * priority queue by dist
 * iterating lowest dist and updating any worthy neighbors
 * stop when we get to end
 */

import { Heap } from "../ch04/heap.js";

function dijkstra(graph, start, end) {
  const path = [];
  const distMap = new Map();
  let currNode = start;
  let currNodeDist = 0;
  const priorityQ = new Heap();

  while (currNode !== end) {
    path.push(currNode);
    distMap.set(currNode, [currNodeDist, true]);

    const neighbors = graph.getAdjacencyList(currNode);
    for (const neighbor of neighbors) {
      const neighborVal = neighbor.value;
      let newNeighborDist = currNodeDist + neighbor.weight;

      const [currNeighborDist, isFinished] = distMap.get(neighborVal) || [
        Number.POSITIVE_INFINITY,
        false,
      ];

      if (isFinished) continue;
      if (!currNeighborDist) {
        priorityQ.insert(newNeighborDist, neighborVal);
      } else if (currNeighborDist > newNeighborDist) {
        priorityQ.delete(neighborVal);
        priorityQ.insert(newNeighborDist, neighborVal);
      }
      distMap.set(neighborVal, [newNeighborDist, false]);
    }

    const newNoden = priorityQ.peek();
    if (!newNode) break;
    [currNode, currNodeDist] = newNode;

    priorityQ.delete(currNode);
  }
  return path;
}
