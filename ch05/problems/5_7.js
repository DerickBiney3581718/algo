// [4] Given pre-order and in-order traversals of a binary tree,
//  is it possible to reconstruct the tree? If so, sketch an algorithm to do it.
//  If not, give a counterexample.
// Repeat the problem if you are given the pre-order and post-order traversals

import { Graph } from "../graph.js";

// root, left, right
// !the position of the root
// pre-order: root,left, right
// in-order:  left,root, right
// post-order: left, right, root

// 1 -> 2,3
// 2 -> 4,5
// 3 -> 6,7

// inorder = [4,2,5, 1, 6, 3, 7]
// preorder = [1,2,4,5, 3, 6, 7]

//question did not say it is balanced
// trivial case, n=3:
//preorder [1,2,3]
//inorder [2,1,3]

// building
// root = preorder[0]
// if there are nodes before the root in the inorder, then
// left= preorder[1]
// right = preorder[2]
// 1 -> 2,3

// recurrence
// preprocessing
// kth root = preorder[k]
// if there are nodes before inorder[k]
// left = inorder[k-1]

// postprocessing
// if no more nodes before the inorder[k]
//  right = preorder[k+1]

function recreateGraph(
  graph,
  preorder,
  inorder,
  preIdx = 0,
  start = 0,
  end = inorder.length - 1,
  parent,
) {
  const currNode = preorder[preIdx];
  graph.insertEdges(currNode, parent, true);

  if (start === end) return { graph, preIdx: preIdx + 1, currNode };

  const parentIdx = inorder
    .slice(start, end + 1)
    .findIndex((el) => el === currNode);

  if (parentIdx < 0) return { graph, preIdx: preIdx + 1 };
  console.log(
    "in order: ",
    inorder,
    "preorder: ",
    preorder,
    "pre idx: ",
    preIdx,
    "currNode: ",
    currNode,
    "curr Node idx",
    parentIdx,
    "start: ",
    start,
    "end: ",
    end,
  );

  const leftReturn = recreateGraph(
    graph,
    preorder,
    inorder,
    preIdx + 1,
    start,
    parentIdx - 1,
    currNode,
  );

  preIdx = leftReturn.preIdx;
  const altoNode = leftReturn.currNode;
  console.log("returned pre idx: ", preIdx, "from after inserting: ", altoNode);
  recreateGraph(
    graph,
    preorder,
    inorder,
    preIdx + 1,
    parentIdx + 1,
    end,
    currNode,
  );
  return { graph, preIdx };
}

const inorder = [4, 2, 5, 1, 6, 3, 7];
const preorder = [1, 2, 4, 5, 3, 6, 7];
let g1 = new Graph();
recreateGraph(g1, preorder, inorder);
console.log("recreating graph");
g1.printGraph();
