/**
 * Indexed Priority Queue add methods to easily get, update and delete other elements besides max or min
 * example: Patient triage. Patients have unique ids that should be mapped to heap positions. naive implementation assuming ids are sequential 1...N - 1
 * Key -> heap position
 * key -> value
 * original: heap position -> value
 */

import { TArray } from "../arrays/Array";
import type { CompareFn, ValueOfFn } from "../Base";
import { PriorityQueue } from "./PriorityQueue";

export class IndexedPriorityQueue<V> {
  keyHeapPos: TArray<number> = new TArray([]);
  keyValues: TArray<V> = new TArray([]);
  pq: PriorityQueue<number>;

  get size(): number {
    return this.pq.size;
  }

  constructor(
    max?: number,
    isMin?: boolean,
    compare?: CompareFn<number>,
    valueOf?: ValueOfFn<number>,
  ) {
    this.pq = new PriorityQueue(max, isMin, valueOf, compare);
    this.keyHeapPos = new TArray([], false, false, this.size);
    this.keyValues = new TArray([], false, false, this.size);
  }

  insertWithKey(keyValue: number, value: V): number | null {
    const keyValueNum = Number(keyValue);
    if (keyValueNum > this.size - 1) throw new Error("key value exceeds limit");

    if (this.keyValues[keyValueNum] != null) {
      this.updateItem(keyValueNum, value);
      return null;
    }

    const currIdx = this.pq.insert(keyValue, value);

    return currIdx;
  }

  swap(left: number, right: number): void {
    this.pq.swap(left, right);
    const leftKey = Number(this.pq._valueOf(left));
    const rightKey = Number(this.pq._valueOf(right));

    this.keyHeapPos.update(leftKey, left);
    this.keyHeapPos.update(rightKey, right);
  }

  delMax(): V | null {
    return this.deleteItem(undefined, 1);
  }

  deleteItem(key?: number, idx?: number): V | null {
    if (key == null && idx == null) throw new Error("idx or key must be valid");

    const heapIdx = key ? this.keyHeapPos[key] : idx;

    if (heapIdx == null) throw new Error("null idx cannot be accessed");

    const deletedValue = this._valueOf(heapIdx);
    console.log(`dlele val: ${deletedValue}`);
    this.pq._delete(heapIdx);

    if (key) {
      this.keyValues.update(key, null);
      this.keyHeapPos.update(key, null);
    }
    return deletedValue;
  }

  deleteSideEffects(deletedIdx: number): void {
    const key = Number(this.pq._valueOf(deletedIdx));
    this.keyHeapPos.update(key, null);
    this.keyValues.update(key, null);
  }

  insertSideEffects(currIdx: number, keyValue: number, value: V): void {
    const keyValueNum = Number(keyValue);
    this.keyValues.update(keyValueNum, value);
    this.keyHeapPos.update(keyValueNum, currIdx);
  }

  updateItem(key: number, value: V) {
    this.keyValues[key] = value;
    const idx = this.keyHeapPos[key];

    if (idx != null) this.pq.update(idx, key);
  }

  _valueOf(idx: number): V | null {
    const key = Number(this.pq._valueOf(idx));
    return this.keyValues[key];
  }

  get isEmpty(): boolean {
    return this.pq.isEmpty;
  }

  toString(): string {
    return this.pq.toString();
  }
}
