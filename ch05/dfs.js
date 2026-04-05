// DFS(G,u)
// state[u] = “discovered”
// process vertex u if desired
// entry[u] = time
// time = time + 1
// for each v ∈ Adj[u] do
// process edge (u,v) if desired
// if state[v] = “undiscovered” then
// p[v] = u
// DFS(G,v)
// state[u] = “processed”
// exit[u] = time
// time = time + 1
