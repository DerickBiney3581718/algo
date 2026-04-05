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
    Array.from({ length: this.MAX_V + 1 }).map((_, idx) => [
      idx,
      "undiscovered",
    ]),
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
        this._insertEdges(vtx, edge, this.isDirected),
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
        this._insertEdges(x, y, this.isDirected);
      }
    } catch (error) {
      endStream = false;
    }

    rl.close();

    //? this._insertEdges(); //? Event emitters // not needing await means they don't use promises and maybe don't even involve the queue
  }

  get root() {
    return this.edgesList.findIndex((value) => value?.next);
  }

  setParent(vtx, parentIdx) {
    this.verticesParents[vtx] = parentIdx;
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

  _insertEdges(vtx, edge, isDirected) {
    this._attachEdge(vtx, edge);

    if (!isDirected) {
      this._insertEdges(edge, vtx, true);
    } else this.nEdges += 1;
  }

  updateVertexStatus(vtx, status) {
    this.verticesStatusMap[vtx] = status;
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
    console.log("printing lines");
    const lines = [];

    this.edgesList.forEach((node, vtx) => {
      let currNode = node;
      if (!node) return;
      let line = `${vtx}->`;

      //   todo: add early stopping
      while (currNode) {
        console.log("c node", currNode);
        line += currNode.value + "->";
        if (!currNode.next) {
          line += "|";
          break;
        }

        currNode = currNode.next;
      }
      console.log("---", line);
      lines.push(line);
    });

    console.log(lines);
  }
}

// const graph1 = new Graph();
// await graph1.initGraph();
// graph1.printGraph();
// console.log(JSON.stringify(graph1));
