import { stdout } from "node:process";
import * as readline from "node:readline/promises";

const SEEDED_EDGES = Math.round(Math.random())
  ? [
      [1, 2],
      [1, 3],
      [2, 4],
      [2, 5],
      [3, 5],
      [3, 6],
      [4, 7],
      [5, 7],
      [5, 8],
      [6, 8],
      [7, 9],
      [8, 9],
    ]
  : [
      [1, 2],
      [1, 3],
      [2, 3],
      [4, 5],
      [4, 6],
      [5, 6],
      [7, 8],
      [8, 9],
      [7, 9],
    ];

const N_EDGES = 12;
const N_VERTICES = 9;

class EdgeNode {
  constructor(value, next, weight) {
    this.value = value;
    this.next = next;
    this.weight = weight;
  }
}

export class Graph {
  MAX_V = 1000;
  edgesList = Array.from({ length: this.MAX_V + 1 });
  degrees = Array.from({ length: this.MAX_V + 1 }).map((_) => 0);
  verticesStatusMap = Object.fromEntries(
    Array.from({ length: this.MAX_V + 1 }).map((_, idx) => [idx, undefined]),
  );
  verticesParents = Array.from({ length: this.MAX_V + 1 });

  nEdges = 0;
  nVertices = 0;
  isDirected;

  //?why can't a constructor be async??
  constructor() {}

  async initGraph(seed = true, isDirected) {
    this.isDirected = isDirected;
    if (seed) {
      this.nVertices = N_VERTICES;
      this.nEdges = N_EDGES;
      const edges = SEEDED_EDGES;
      edges.forEach(([vtx, edge]) =>
        this.insertEdges(vtx, edge, this.isDirected),
      );
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: stdout,
    });

    const nVerticesAnswer = await rl.question("Number of vertices: ");
    this.nVertices = Number(nVerticesAnswer.trim());

    const nEdgesAnswer = await rl.question("Number of edges: ");
    this.nEdges = Number(nEdgesAnswer.trim());
    let endStream = false;

    try {
      while (!endStream) {
        const x_y = await rl.question(
          "enter x,y values in same format or press Ctrl-D to end: ",
        );
        const [x, y] = x_y.split(",").map((val) => val.trim());
        if (!x || !y) return;
        this.insertEdges(x, y, this.isDirected);
      }
    } catch (error) {
      endStream = false;
    }

    rl.close();

    //? this.insertEdges(); //? Event emitters // not needing await means they don't use promises and maybe don't even involve the queue
  }

  checkIsAncestor(vtx, ancestor) {
    let vtxParent = this.getParent(vtx);
    while (vtxParent !== undefined) {
      if (vtxParent === ancestor) return true;
      else vtxParent = this.getParent(vtxParent);
    }
    return false;
  }

  get root() {
    return this.edgesList.findIndex((value) => value?.next);
  }

  setParent(vtx, parentIdx) {
    this.verticesParents[vtx] = parentIdx;
  }
  getVertexDegrees(vtx) {
    return this.degrees[vtx];
  }
  getParent(vtx) {
    return this.verticesParents[vtx];
  }
  _attachEdge(vtx, edge) {
    const xEdgeList = this.edgesList[vtx];
    const nextEdgeNode = new EdgeNode(edge);

    if (!xEdgeList) {
      this.edgesList[vtx] = nextEdgeNode;
    } else {
      nextEdgeNode.next = xEdgeList;
      this.edgesList[vtx] = nextEdgeNode;
    }
    this.degrees[vtx] += 1;
  }

  insertEdges(vtx, edge, isDirected) {
    this.updateVertexStatus(vtx, "undiscovered");
    this._attachEdge(vtx, edge);

    if (!isDirected) {
      this.insertEdges(edge, vtx, true);
    } else this.nEdges += 1;
  }

  updateVertexStatus(vtx, status) {
    this.verticesStatusMap[vtx] = status;
  }

  getVertexDepth(vtx) {
    let depth = 0;
    let vtxParent = this.getParent(vtx);

    while (vtxParent !== undefined) {
      depth++;
      vtxParent = this.getParent(vtxParent);
    }
    return depth;
  }

  getVertexStatus(vtx) {
    return this.verticesStatusMap[vtx];
  }

  getAdjacencyList(vtx) {
    let currEdge = this.edgesList[vtx];
    if (!currEdge) return null;

    const adjacencyList = [];
    while (currEdge) {
      adjacencyList.push(currEdge.value);
      currEdge = currEdge.next;
    }
    return adjacencyList;
  }

  printGraph() {
    // console.log("printing lines");
    const lines = [];

    this.edgesList.forEach((node, vtx) => {
      let currNode = node;
      if (!node) return;
      let line = `${vtx}->`;

      //   todo: add early stopping
      while (currNode) {
        line += currNode.value + "->";
        if (!currNode.next) {
          line += "|";
          break;
        }

        currNode = currNode.next;
      }
      lines.push(line);
    });

    console.log(lines.join("\n"));
  }
}

// const graph1 = new Graph();
// await graph1.initGraph();
// graph1.printGraph();
// console.log(JSON.stringify(graph1));
