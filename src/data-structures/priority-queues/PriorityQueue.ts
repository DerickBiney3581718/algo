/**
 * priority queue: an adt that removes the top priority(largest or smallest) key
 * naive implementation using an array
 */

import { TArray } from "../arrays/Array";
import { Base } from "../Base";

export class PriorityQueue<T extends string | number | null> extends Base {
  array: TArray<T>;
  isMin: boolean = false;

  constructor(max?: number, isMin: boolean = false) {
    super();
    if (max) this.array = new TArray([], false, false, max);
    else this.array = new TArray([], false, true, 1);
    this.array.insert(null);
    this.isMin = isMin;
  }

  delMax(): T {
    const max = this.array[1];
    this._delete(1);
    return max;
  }

  _delete(idx: number): void {
    const lastIdx = this.array.validLen - 1;

    this.swap(idx, lastIdx);

    this.deleteSideEffects(lastIdx);
    this.array.delete(lastIdx);

    this._bubbleDown(idx);
  }

  deleteSideEffects(deletedIdx: number) {}
  insertSideEffects(insertedIdx: number, value: T, metadata?: T) {}

  insertBulk(entries: TArray<T>) {
    for (const value of entries) {
      if (value) this.insert(value);
    }
  }

  insert(value: T, metadata?: T): number {
    this.array.insert(value);
    let currentIdx = this.array.validLen - 1;
    this.insertSideEffects(currentIdx, value, metadata);
    return this._bubbleUp(currentIdx);
  }

  /**
   * bubbling up or swimming to get the item higher
   * @param childIdx
   * @returns
   */
  _bubbleUp(childIdx: number): number {
    const parentIdx = this.getParentIdx(childIdx);
    if (!parentIdx) return childIdx;

    if (this._isLess(parentIdx, childIdx)) {
      this.swap(parentIdx, childIdx);
      return this._bubbleUp(parentIdx);
    }
    return childIdx;
  }

  /**
   * swap
   */
  swap(left: number, right: number): void {
    this.array._swap(left, right);
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

    for (let childIdx = leftChildIdx; childIdx <= rightChildIdx; childIdx++) {
      const childValue = this.array[childIdx];
      if (childValue == null) continue;

      if (this._isLess(parentIdx, childIdx)) {
        this.swap(parentIdx, childIdx);
        return this._bubbleDown(childIdx);
      }
    }
  }

  _isLess(left: number, right: number): boolean {
    const rightVal = this.array[right];
    const leftVal = this.array[left];
    if (rightVal == null) return false;
    if (leftVal == null) return true;

    return this.isMin ? leftVal > rightVal : leftVal < rightVal;
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

  toString() {
    return this.array.toString();
  }
}

// const pq = new PriorityQueue<number>(20);
// const entries = new TArray<number>([1, 16, 9, 32, 78, 8, 4]);
// pq.insertBulk(entries);
// console.log(`${pq}`);
// console.log(pq.delMax());
// console.log(pq.delMax());
// console.log(pq.delMax());
// console.log(pq.insert(1000));
// console.log(pq.insert(89));

// console.log(`${pq}`);
