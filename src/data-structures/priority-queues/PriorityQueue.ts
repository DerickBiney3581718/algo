/**
 * priority queue: an adt that removes the top priority(largest or smallest) key
 * naive implementation using an array
 */

import { TArray } from "../arrays/Array";
import { Base, type CompareFn, type ValueOfFn } from "../Base";

export class PriorityQueue<T> extends Base<T> {
  protected array: TArray<T>; // stays structurally, changes semantically in indexed pq, avoid external errors
  isMin: boolean = false;

  constructor(
    max?: number,
    isMin: boolean = false,
    valueOfFn?: ValueOfFn<T>,
    compareFn?: CompareFn<T>,
  ) {
    super(compareFn, valueOfFn);

    if (max) this.array = new TArray<T>([], false, false, max);
    else this.array = new TArray<T>([], false, true, 1);
    this.array.insert(null);
    this.isMin = isMin;
  }

  delMax(): T | null {
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

  deleteSideEffects(_deletedIdx: number) {}
  insertSideEffects(_insertedIdx: number, _value: T, _metadata?: T) {}

  insertBulk(entries: TArray<T>) {
    for (const value of entries) {
      if (value) this.insert(value);
    }
  }

  insert(value: T, metadata?: any): number | null {
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
  _bubbleUp(childIdx: number | null): number | null {
    if (childIdx == null) return null;
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
  _bubbleDown(parentIdx: number | null): void {
    if (parentIdx == null || parentIdx >= this.size) return;
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
    const rightVal = this._valueOf(right);
    const leftVal = this._valueOf(left);
    const dir = this.compare(leftVal, rightVal);
    return this.isMin ? dir === -1 : dir === 1;
  }

  _valueOf(idx: number): T | null {
    return this.array[idx];
  }

  update(idx: number, value: T): void {
    this.array.update(idx, value);
    this._bubbleDown(idx);
    this._bubbleUp(idx);
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
