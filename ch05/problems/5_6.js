// In breadth-first and depth-first search, an undiscovered node is marked discovered when it is first encountered, and marked processed when it has been completely
// searched. At any given moment, several nodes might be simultaneously in the discovered state.
// (a) Describe a graph on n vertices and a particular starting vertex v such that
// Θ(n) nodes are simultaneously in the discovered state during a breadth-first search
// starting from v.
// (b) Describe a graph on n vertices and a particular starting vertex v such that Θ(n)
// nodes are simultaneously in the discovered state during a depth-first search starting
// from v.
// (c) Describe a graph on n vertices and a particular starting vertex v such that at
// some point Θ(n) nodes remain undiscovered, while Θ(n) nodes have been processed
// during a depth-first search starting from v. (Note, there may also be discovered
// nodes.)

// undiscovered is marked discovered on first encounter
// a. a star graph, wide graph, such that all the children nodes are placed in queue, right after the root is processed, all n-1 nodes are discovered.
// b. a path graph, line graph, at the end of the tree(the last node), we have all n nodes in discovered state
// c. a V graph, two lines from the root, by the end of the left line, n/2 nodes are processed and n/2 are undiscovered and root is in discovered state
