import { SymbolGraph } from "../../data-structures/graphs/SymbolGraph";
import { BFSPathFind } from "./PathFind";

function deg(G: SymbolGraph, src: string, tar: string) {
  const srcVtx = G.index(src);
  const tarVtx = G.index(tar);
  if (srcVtx == null || tarVtx == null) {
    console.log(`paths are not ${srcVtx}, ${tarVtx}`);
    return;
  }
  const path = new BFSPathFind(G, srcVtx);
  if (!path.hasPathTo(tarVtx)) {
    console.log("no path found");
    return;
  }

  const pathStack = path.findPathTo(tarVtx);
  console.log(`${pathStack}`);

  return pathStack.size - 1;
}

const routes = [
  "JFK MCO",
  "ORD DEN",
  "ORD HOU",
  "DFW PHX",
  "JFK ATL",
  "ORD DFW",
  "ORD PHX",
  "ATL HOU",
  "DEN PHX",
  "PHX LAX",
  "JFK ORD",
  "DEN LAS",
  "DFW HOU",
  "ORD ATL",
  "LAS LAX",
  "ATL MCO",
  "HOU MCO",
  "LAS PHX",
];

const sg = new SymbolGraph(routes);
console.log(`${sg}`);

console.log(`deg of sep: ${deg(sg, "JFK", "LAS")} `);
