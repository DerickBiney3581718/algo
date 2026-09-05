import { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { WDigraph } from "../../data-structures/graphs/WDigraph";
import { AcyclicLP } from "./AcyclicLP";

export class CPM {
  V: number;
  G: WDigraph;
  _cp: number[];

  constructor(V: number, jobs: number[][]) {
    this.V = V * 2 + 1; // add ending vertices, start and stop
    this.G = new WDigraph(this.V);
    const startVtx = V * 2;
    const endVtx = this.V;

    for (let jobStart = 0; jobStart < jobs.length; jobStart++) {
      const jobEnd = jobStart + V;
      const weight = jobs[jobStart][0];
      const nextJobs = jobs[jobStart].slice(1);

      const jobEdge = new DiWEdge(jobStart, jobEnd, weight);
      const startEdge = new DiWEdge(startVtx, jobStart, 0);
      const endEdge = new DiWEdge(jobEnd, endVtx, 0);
      this.G.addEdge(jobEdge);
      this.G.addEdge(startEdge);
      this.G.addEdge(endEdge);

      for (const nextJob of nextJobs) {
        this.G.addEdge(new DiWEdge(jobEnd, nextJob, 0));
      }
    }

    const lp = new AcyclicLP(this.G, startVtx);
    this._cp = lp.pathTo(endVtx);
  }

  get cp(): number[] {
    return this._cp;
  }
}
