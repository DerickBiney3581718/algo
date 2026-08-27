/**
 * Indexed Priority Queue add methods to easily get, update and delete other elements besides max or min
 * example: Patient triage. Patients have unique *ids that should be mapped to heap positions. *naive implementation assuming ids are *sequential 1...N - 1
 */

import { TArray } from "../arrays/Array";
import type { ValueOfFn } from "../Base";
import { PriorityQueue, type OnDelete, type OnSwap } from "./PriorityQueue";

export class IndexedPriorityQueue {
  pq: PriorityQueue<number>;
  qp: TArray<number>;
  keys: TArray<number>;

  onSwap: OnSwap = ({ left, right }): void => {
    const leftKey = Number(this.pq.heapVal(left));
    const rightKey = Number(this.pq.heapVal(right));

    this.qp.update(leftKey, left);
    this.qp.update(rightKey, right);
  };

  onDelete: OnDelete<number> = ({ value }): void => {
    if (value == null) return;
    this.qp.update(Number(value), null);
    this.keys.update(Number(value), null);
  };

  valueOf: ValueOfFn<number | null> = (key: number | null) => {
    return key == null ? null : this.keys[key];
  };

  constructor(max: number, isMin: boolean = false) {
    this.pq = new PriorityQueue({
      max,
      isMin,
      valueOf: this.valueOf,
      onDelete: this.onDelete,
      onSwap: this.onSwap,
    });

    this.qp = new TArray<number>([], false, false, max);
    this.keys = new TArray<number>([], false, false, max);
  }

  get size(): number {
    return this.pq.size;
  }

  insert(key: number, priority: number): number | null {
    if (this.contains(key)) throw new Error("key already exists");
    this.keys.update(key, priority);
    const currIdx = this.pq.insert(key);
    this.qp.update(key, currIdx);

    return currIdx;
  }

  contains(key: number): boolean {
    return this.qp.length > key && this.qp[key] != null;
  }

  update(key: number, priority: number): number | null {
    this.keys.update(key, priority);
    const idx = this.qp[key];
    if (idx != null) this.pq.reheapify(idx);
    return idx;
  }

  delTop(): number | null {
    return this.pq.delTop();
  }

  get isEmpty(): boolean {
    return this.pq.isEmpty;
  }

  toString(): string {
    return this.pq.toString();
  }
}
