/**
 * priority queue: an adt that removes the top priority(largest or smallest) key
 * naive implementation using an array
 */

import type { Comparable } from "../../types/dsa";
import { TArray } from "../arrays/Array";
import { Base, type ValueOfFn } from "../Base";

export interface OnDelete {
  (_meta: { heapIdx: number; value: Comparable }): void;
}

export interface OnInsert {
  (_meta: { heapIdx: number; value: Comparable }): void;
}

export interface OnSwap {
  (_meta: { left: number; right: number }): void;
}

export class PriorityQueue<T extends Comparable> extends Base<T> {
  protected array: TArray<T>; // stays structurally, changes semantically in indexed pq, avoid external errors
  isMin: boolean = false;
  private onDelete: OnDelete = () => {};
  private onInsert: OnInsert = () => {};
  private onSwap: OnSwap = () => {};

  constructor(params: {
    max?: number;
    isMin: boolean;
    valueOf?: ValueOfFn<T | null>;
    onDelete?: OnDelete;
    onInsert?: OnInsert;
    onSwap?: OnSwap;
  }) {
    const { valueOf, max, isMin = false, onDelete, onInsert, onSwap } = params;
    super(valueOf);

    if (onDelete) this.onDelete = onDelete;
    if (onInsert) this.onInsert = onInsert;
    if (onSwap) this.onSwap = onSwap;

    if (max) this.array = new TArray<T>([], false, false, max);
    else this.array = new TArray<T>([], false, true, 1);
    this.array.insert(null);
    this.isMin = isMin;
  }

  get isEmpty(): boolean {
    return this.array.isEmpty;
  }

  get size(): number {
    return this.array.validLen;
  }

  delTop(): T | null {
    if (this.isEmpty) return null;
    const max = this.array[1];
    this.delete(1);
    return max;
  }

  delete(idx: number): void {
    const heapIdx = this.array.validLen - 1;

    this.swap(idx, heapIdx);

    const value = this.array.delete(heapIdx);
    this.onDelete({ heapIdx, value });

    this._bubbleDown(idx);
  }

  insert(value: T): number | null {
    this.array.insert(value);
    const heapIdx = this.array.validLen - 1;
    this.onInsert({ heapIdx, value });
    return this._bubbleUp(heapIdx);
  }

  insertBulk(entries: TArray<T>) {
    for (const value of entries) {
      if (value == null) continue;
      this.insert(value);
    }
  }

  update(idx: number, value: T): number {
    this.array.update(idx, value);
    this.reheapify(idx);
    return idx;
  }

  reheapify(idx: number): void {
    this._bubbleDown(idx);
    this._bubbleUp(idx);
  }

  peek(): T | null {
    if (this.isEmpty) return null;
    return this.array[1];
  }

  /**
   * bubbling up or swimming to get the item higher
   * @param childIdx
   * @returns
   */
  private _bubbleUp(childIdx: number | null): number | null {
    if (childIdx == null) return null;
    const parentIdx = PriorityQueue.getParentIdx(childIdx);
    if (parentIdx < 1) return childIdx;

    if (this._shouldSink(parentIdx, childIdx)) {
      this.swap(parentIdx, childIdx);
      return this._bubbleUp(parentIdx);
    }
    return childIdx;
  }

  /**
   * swap
   */
  private swap(left: number, right: number): void {
    this.array._swap(left, right);
    this.onSwap({ left, right });
  }

  /**
   * bubbling down or sinking to get item down
   * @param idx
   * @returns
   */
  private _bubbleDown(parentIdx: number | null): void {
    if (parentIdx == null || parentIdx >= this.size) return;
    const leftChildIdx = PriorityQueue.getLeftChildIdx(parentIdx);
    const rightChildIdx = PriorityQueue.getRightChildIdx(parentIdx);

    const lastIdx = this.size - 1;

    let selectedChildIdx = parentIdx;
    if (
      leftChildIdx <= lastIdx &&
      this.heapVal(leftChildIdx) != null &&
      this._shouldSink(selectedChildIdx, leftChildIdx)
    )
      selectedChildIdx = leftChildIdx;
    if (
      rightChildIdx <= lastIdx &&
      this.heapVal(rightChildIdx) != null &&
      this._shouldSink(selectedChildIdx, rightChildIdx)
    )
      selectedChildIdx = rightChildIdx;

    if (parentIdx === selectedChildIdx) return;
    this.swap(parentIdx, selectedChildIdx);
    this._bubbleDown(selectedChildIdx);
  }

  // when bubbling down, for max: is left less, for min: is left greater. then switch
  private _shouldSink(left: number, right: number): boolean {
    const leftVal = this.heapVal(left);
    const rightVal = this.heapVal(right);

    let dir = null;
    if (this.isMin) dir = this.compare(leftVal, rightVal);
    else dir = this.compare(rightVal, leftVal);

    return dir === 1;
  }

  heapVal(idx: number): T | null {
    return this.array[idx];
  }

  private static getParentIdx(idx: number): number {
    return Math.trunc(idx / 2);
  }

  private static getLeftChildIdx(idx: number): number {
    return idx * 2;
  }

  private static getRightChildIdx(idx: number): number {
    return PriorityQueue.getLeftChildIdx(idx) + 1;
  }

  toString() {
    return this.array.toString();
  }
}
