/**
 * Indexed Priority Queue add methods to easily get, update and delete other elements besides max or min
 * example: Patient triage. Patients have unique ids that should be mapped to heap positions. naive implementation assuming ids are sequential 1...N - 1
 */

import type { Comparable } from "../../types/dsa";
import { TArray } from "../arrays/Array";
import { PriorityQueue } from "./PriorityQueue";

export class IndexedPriorityQueue<
  T extends Comparable,
> extends PriorityQueue<T> {
  keyHeapPos: TArray<number> = new TArray([]);
  keyValues: TArray<T> = new TArray([]);

  constructor(max?: number) {
    super(max);
    this.keyHeapPos = new TArray([], false, false, this.size);
    this.keyValues = new TArray([], false, false, this.size);
  }

  insertWithKey(value: T, keyValue: T): number | null {
    const keyValueNum = Number(keyValue);
    if (keyValueNum > this.size - 1) throw new Error("key value exceeds limit");

    if (this.keyValues[keyValueNum] != null) {
      this.updateItem(keyValueNum, value);
      return null;
    }

    const currIdx = this.insert(keyValue, value);

    return currIdx;
  }

  swap(left: number, right: number): void {
    super.swap(left, right);
    const leftKey = Number(this.array[left]);
    const rightKey = Number(this.array[right]);

    this.keyHeapPos.update(leftKey, left);
    this.keyHeapPos.update(rightKey, right);
  }

  delMax(): T | null {
    return this.deleteItem(undefined, 1);
  }

  deleteItem(key?: number, idx?: number): T | null {
    if (key == null && idx == null) throw new Error("idx or key must be valid");

    const heapIdx = key ? this.keyHeapPos[key] : idx;

    if (heapIdx == null) throw new Error("null idx cannot be accessed");

    const deletedValue = this.keyValues[Number(this.array[heapIdx])];
    this._delete(heapIdx);
    if (key) {
      this.keyValues.update(key, null);
      this.keyHeapPos.update(key, null);
    }
    return deletedValue;
  }

  deleteSideEffects(deletedIdx: number): void {
    const key = Number(this.array[deletedIdx]);
    this.keyHeapPos.update(key, null);
    this.keyValues.update(key, null);
  }

  insertSideEffects(currIdx: number, keyValue: T, value: T): void {
    const keyValueNum = Number(keyValue);
    this.keyValues.update(keyValueNum, value);
    this.keyHeapPos.update(keyValueNum, currIdx);
  }

  updateItem(key: number, value: T) {
    const idx = this.keyHeapPos[key];
    this.array.update(idx, value);
    this._bubbleDown(idx);
    this._bubbleUp(idx);
  }

  _valueOf(idx: number): T | null {
    const key = Number(this.array[idx]);
    return this.keyValues[key];
  }

  toString(): string {
    return this.array.toString();
  }
}

const pq = new IndexedPriorityQueue<number>(21);
const entries = new Map(
  Array.from({ length: 20 }, (_, i) => [
    i + 1,
    Math.trunc(Math.random() * 100),
  ]),
);

for (const [key, value] of entries) {
  pq.insertWithKey(value, key);
}

console.log(`${pq}`);
console.log(pq.delMax());
console.log(`${pq}`);

console.log(pq.deleteItem(5));
console.log(`${pq}`);

console.log(pq.insertWithKey(89, 2));
console.log(pq.insertWithKey(99, 1));

console.log(`${pq}`);

console.log(pq.delMax());
console.log(`${pq}`);
