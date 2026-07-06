/**
 * priority queue: an adt that removes the top priority(largest or smallest) key
 * naive implementation using an array
 */

import { swap, type subscriptable } from "../../algorithms/sorting/shell-sort";
import { TArray } from "../arrays/Array";
import { Base } from "../Base";

export class PriorityQueue<T extends string | number> extends Base {
  array: TArray<T>;
  constructor(max?: number) {
    super();
    if (max) this.array = new TArray([], false, false, max);
    else this.array = new TArray([], false, true, 1);
  }

  delMax(): T {
    const max = this.array[1];
    this._delete(1);
    return max;
  }

  _delete(idx: number): void {
    const lastIdx = this.array.getValidLen() - 1;
    this.swap(this.array, idx, lastIdx);
    this.array.delete(lastIdx);
    this._bubbleDown(idx);
  }

  insertBulk(entries: TArray<T>) {
    for (const value of entries) {
      if (value) this.insert(value);
    }
  }
  insert(value: T) {
    if (this.isEmpty) this.array.insert(value, 1);
    else this.array.insert(value);

    let currentIdx = this.array.getValidLen();
    this._bubbleUp(currentIdx);
  }

  /**
   * bubbling up or swimming to get the item higher
   * @param childIdx
   * @returns
   */
  _bubbleUp(childIdx: number): void {
    if (!childIdx) return;
    const parentIdx = this.getParentIdx(childIdx);

    if (this._isLess(parentIdx, childIdx)) {
      this.swap(this.array, parentIdx, childIdx);
      return this._bubbleUp(parentIdx);
    }
  }

  /**
   * swap
   */
  swap(list: subscriptable<T>, left: number, right: number): void {
    return swap(list, left, right);
  }

  /**
   * bubbling down or sinking to get item down
   * @param idx
   * @returns
   */
  _bubbleDown(parentIdx: number): void {
    if (parentIdx >= this.size) return;
    const leftChildIdx = this.getLeftChildIdx(parentIdx);
    const rightChildIdx = this.getRightChildIdx(parentIdx);

    for (let index = leftChildIdx; index <= rightChildIdx; index++) {
      if (this._isLess(parentIdx, index) && this.array[index]) {
        this.swap(this.array, index, parentIdx);
        return this._bubbleDown(index);
      }
    }
  }

  private _isLess(left: number, right: number): boolean {
    return this.array[left] < this.array[right];
  }

  getParentIdx(idx: number): number {
    return Math.trunc(idx / 2);
  }

  getLeftChildIdx(idx: number): number {
    return idx * 2;
  }

  getRightChildIdx(idx: number): number {
    return this.getLeftChildIdx(idx) + 1;
  }

  get isEmpty(): boolean {
    return this.array.isEmpty;
  }

  get size(): number {
    return this.array.length;
  }
}
