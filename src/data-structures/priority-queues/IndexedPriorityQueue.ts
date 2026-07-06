/**
 * Indexed Priority Queue add methods to easily get, update and delete other elements besides max or min
 * example: Patient triage. Patients have unique ids that should be mapped to heap positions. naive implementation assuming ids are sequential 1...N - 1
 */

import type { subscriptable } from "../../algorithms/sorting/shell-sort";
import { TArray } from "../arrays/Array";
import { PriorityQueue } from "./PriorityQueue";

export class IndexedPriorityQueue<
  T extends string | number,
> extends PriorityQueue<T> {
  itemHeapPos: TArray<number> = new TArray([]);
  heapPosItem: TArray<number> = new TArray([]);

  constructor(max?: number) {
    super(max);
    this.itemHeapPos = new TArray([], false, false, this.size);
  }

  insert(value: T) {
    if (this.isEmpty) this.array.insert(value, 1);
    else this.array.insert(value);

    let currentIdx = this.array.getValidLen();
    if (typeof value === "number") this.itemHeapPos?.insert(value, currentIdx);
    this._bubbleUp(currentIdx);
  }

  _insert(value: T, idx: number) {
    this.array.insert(value, idx);
  }
  insertBulk(entries: TArray<T>): void {}
  swap(list: subscriptable<T>, left: number, right: number) {
    const leftValue = this.array[left];
    const rightValue = this.array[right];

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      this.itemHeapPos.update(leftValue, right);
      this.itemHeapPos.update(rightValue, left);
      super.swap(list, left, right);
    }
  }

  deleteItem(key: number): void {
    const idx = this.itemHeapPos[key];
    this._delete(idx);
  }

  updateItem(key: number, value: T) {
    const idx = this.itemHeapPos[key];
    this.array.update(idx, value);
    this._bubbleDown(idx);
    this._bubbleUp(idx);
  }
}
