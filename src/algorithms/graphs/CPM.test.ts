import { describe, expect, it } from "vitest";
import type { DiWEdge } from "../../data-structures/graphs/DiWEdge";
import { CPM } from "./CPM";

/**
 *
 * A job list is `[duration, ...successors]` per job, jobs indexed from 0.
 * CPM builds the edge-weighted DAG the book describes: job `i` becomes the
 * pair of vertices `i` (start) and `i + V` (finish) joined by an edge of
 * weight `duration`, a source vertex `2V` feeds every job start with a
 * 0-weight edge, every job finish feeds a sink `2V + 1` the same way, and
 * each precedence constraint is a 0-weight edge from `i + V` to its successor.
 * The longest path from source to sink is then the critical path.
 */

/** Vertex numbering, derived the same way CPM does it. */
const startVtx = (V: number) => V * 2;
const endVtx = (V: number) => V * 2 + 1;

/**
 * `cp` is the raw vertex path out of AcyclicLP.pathTo, which walks edgeTo
 * backwards -- sink first, source last. Job *start* vertices are the ones
 * below V, so keeping those and reversing gives the jobs in schedule order.
 */
function criticalJobs(cpm: CPM, V: number): number[] {
  return cpm.cp.filter((vtx) => vtx < V).reverse();
}

function findEdge(
  edges: DiWEdge[],
  from: number,
  to: number,
): DiWEdge | undefined {
  return edges.find((e) => e.from === from && e.to === to);
}

/**
 * The booksite's jobsPC.txt, 10 jobs. Its published answer is a finish time
 * of 173.0, along the critical path 0 -> 9 -> 6 -> 8 -> 2:
 *
 *   job 0 runs 0..41, job 9 runs 41..70, job 6 runs 70..91,
 *   job 8 runs 91..123, job 2 runs 123..173
 */
const JOBS_PC: number[][] = [
  [41, 1, 7, 9],
  [51, 2],
  [50],
  [36],
  [38],
  [45],
  [21, 3, 8],
  [32, 3, 8],
  [32, 2],
  [29, 4, 6],
];

const DURATIONS = JOBS_PC.map((job) => job[0]);

describe("CPM", () => {
  describe("graph construction", () => {
    it("adds a start and a stop vertex to the two per job", () => {
      const cpm = new CPM(3, [[5], [7], [2]]);

      // 3 jobs -> vertices 0..2 (starts), 3..5 (finishes), 6 (start), 7 (stop)
      expect(cpm.V).toBe(7);
      expect(cpm.G.V).toBe(7);
    });

    it("joins each job's start to its finish by an edge of its duration", () => {
      const cpm = new CPM(3, [[5], [7], [2]]);

      expect(findEdge(cpm.G.edges, 0, 3)).toMatchObject({ weight: 5 });
      expect(findEdge(cpm.G.edges, 1, 4)).toMatchObject({ weight: 7 });
      expect(findEdge(cpm.G.edges, 2, 5)).toMatchObject({ weight: 2 });
    });

    it("feeds every job start from the source with a zero-weight edge", () => {
      const cpm = new CPM(3, [[5], [7], [2]]);
      const src = startVtx(3);

      for (let job = 0; job < 3; job++) {
        expect(findEdge(cpm.G.edges, src, job)).toMatchObject({ weight: 0 });
      }
    });

    it("drains every job finish into the sink with a zero-weight edge", () => {
      const cpm = new CPM(3, [[5], [7], [2]]);
      const sink = endVtx(3);

      for (let job = 0; job < 3; job++) {
        expect(findEdge(cpm.G.edges, job + 3, sink)).toMatchObject({
          weight: 0,
        });
      }
    });

    it("turns each precedence constraint into a zero-weight edge", () => {
      // job 0 must precede jobs 1 and 2; job 1 must precede job 2.
      const cpm = new CPM(3, [[5, 1, 2], [7, 2], [2]]);

      expect(findEdge(cpm.G.edges, 3, 1)).toMatchObject({ weight: 0 });
      expect(findEdge(cpm.G.edges, 3, 2)).toMatchObject({ weight: 0 });
      expect(findEdge(cpm.G.edges, 4, 2)).toMatchObject({ weight: 0 });
    });

    it("adds three edges per job plus one per constraint", () => {
      const constraints = JOBS_PC.reduce((n, job) => n + job.length - 1, 0);
      const cpm = new CPM(10, JOBS_PC);

      expect(constraints).toBe(11);
      expect(cpm.G.E).toBe(3 * 10 + constraints);
    });
  });

  describe("critical path", () => {
    it("runs the only job there is", () => {
      const cpm = new CPM(1, [[5]]);

      expect(criticalJobs(cpm, 1)).toEqual([0]);
    });

    it("picks the longest of several independent jobs", () => {
      // nothing constrains anything, so the critical path is one job: the
      // longest, which is job 1.
      const cpm = new CPM(3, [[5], [9], [2]]);

      expect(criticalJobs(cpm, 3)).toEqual([1]);
    });

    it("follows a chain of constrained jobs end to end", () => {
      const cpm = new CPM(3, [[5, 1], [7, 2], [2]]);

      expect(criticalJobs(cpm, 3)).toEqual([0, 1, 2]);
    });

    it("takes the slower branch when a job waits on two others", () => {
      // job 2 waits on both 0 and 1; 1 is the slower predecessor.
      const cpm = new CPM(3, [[5, 2], [9, 2], [2]]);

      expect(criticalJobs(cpm, 3)).toEqual([1, 2]);
    });

    it("solves the booksite's 10-job schedule", () => {
      const cpm = new CPM(10, JOBS_PC);

      expect(criticalJobs(cpm, 10)).toEqual([0, 9, 6, 8, 2]);
    });

    it("finishes the booksite's schedule at 173", () => {
      const cpm = new CPM(10, JOBS_PC);
      const total = criticalJobs(cpm, 10).reduce(
        (sum, job) => sum + DURATIONS[job],
        0,
      );

      expect(total).toBe(173);
    });

    it("returns a path running from the source to the sink", () => {
      const cpm = new CPM(10, JOBS_PC);

      // pathTo walks edgeTo backwards, so the sink leads and the source trails.
      expect(cpm.cp[0]).toBe(endVtx(10));
      expect(cpm.cp[cpm.cp.length - 1]).toBe(startVtx(10));
    });

    it("alternates job start and finish vertices along the path", () => {
      const cpm = new CPM(10, JOBS_PC);
      // strip the source and sink, then read the interior source -> sink.
      const interior = cpm.cp.slice(1, -1).reverse();

      expect(interior).toEqual([0, 10, 9, 19, 6, 16, 8, 18, 2, 12]);
    });

    it("exposes the same path through cp as it stored", () => {
      const cpm = new CPM(1, [[5]]);

      expect(cpm.cp).toBe(cpm._cp);
    });
  });
});
