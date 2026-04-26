// typedef struct {
// int v; /* neighboring vertex */
// int capacity; /* capacity of edge */
// int flow; /* flow through edge */
// int residual; /* residual capacity of edge */
// struct edgenode *next; /* next edge in list */
// } edgenode;

// netflow(flow_graph *g, int source, int sink)
// {
// int volume; /* weight of the augmenting path */
// add_residual_edges(g);
// initialize_search(g);
// bfs(g,source);
// volume = path_volume(g, source, sink, parent); // getBottleNeckCap
// while (volume > 0) {
// augment_path(g,source,sink,parent,volume);
// initialize_search(g); // reinit edge statuses since g is passed by ref
// bfs(g,source);
// volume = path_volume(g, source, sink, parent);
// }
// }

// bool valid_edge(edgenode *e)
// {
// if (e->residual > 0) return (TRUE);
// else return(FALSE);
// }
