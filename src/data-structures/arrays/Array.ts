import { VISUAL_OPS_TYPES, type NonNullComparable } from "../../types/dsa";
import { Base, type ValueOfFn } from "../Base";

export interface TArray<T> {
  [idx: number]: T | null; //Added this interface to make subscriptable
}

export class TArray<T> extends Base<T> {
  arr: (T | null)[];
  private isSorted: boolean;
  private nextCounter: number = 0;
  private isResizable: boolean = false;
  // factory handles the incoming length

  get length() {
    return this.arr.length;
  }

  constructor(
    initArr: Iterable<T | null>,
    isSorted: boolean = false,
    isResizable: boolean = false,
    length: number = 100,
    valueOf?: ValueOfFn<T | null>,
  ) {
    super(valueOf);

    if (isNonEmptyIterable(initArr)) this.arr = Array.from(initArr);
    else this.arr = Array.from({ length });
    this.isSorted = isSorted;
    this.isResizable = isResizable;

    const state = this.arr;
    this.record({ op: VISUAL_OPS_TYPES.STATE, args: { state } });

    return new Proxy(this, {
      get(target, key, receiver) {
        if (typeof key == "string" && !isNaN(+key)) return target.arr[+key];
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "function") return value.bind(target); //binding for browser event target validation. Proxies don't extend Base themselves.
        return value;
      },
    });
  }

  get validLen() {
    return this.arr.findLastIndex((value) => value !== undefined) + 1;
  }

  get isEmpty() {
    return this.validLen === 0;
  }

  delete(idx: number): T | null {
    const value = this.arr[idx];
    const newArr = this.arr.slice(0, idx).concat(this.arr.slice(idx + 1));
    newArr.length = this.length;
    this.arr = newArr;

    const state = this.arr;
    this.recordDelete(idx, state);
    return value;
  }

  update(idx: number | null, val: T | null) {
    // add validation
    if (idx == null) return;
    this.arr[idx] = val;
    this.record({ op: VISUAL_OPS_TYPES.UPT, args: { initIdx: idx, val } });
  }

  search(searchVal: T): number {
    this.recordSearch(searchVal);

    let foundIdx = -1;
    if (this.isSorted) {
      foundIdx = this.binarySearch(searchVal);
    } else
      foundIdx = this.arr.findIndex((val, idx) => {
        this.record({
          op: VISUAL_OPS_TYPES.MOVE_PTRS,
          args: { idx },
        });
        return this.compare(val, searchVal) === 0;
      });

    // RECORD STATE
    this.recordSearchEnd(foundIdx);
    return foundIdx;
  }

  insert(val: T | null, idx?: number) {
    const currentLen = this.length;
    if (currentLen === this.validLen) {
      if (!this.isResizable)
        throw new Error(
          `Array is full ; valid: ${this.validLen}, total length: ${this.length}`,
        );
      const newLen = currentLen * 2;
      this.arr.length = newLen;
      this.record({
        op: VISUAL_OPS_TYPES.RESIZE,
        args: { newLen, currentLen },
      });
    }

    const isValidIdx = typeof idx === "number" && idx >= 0;
    const targetIdx = this.isSorted
      ? undefined
      : isValidIdx
        ? idx
        : this.validLen; //insert at first empty slot

    this.insertAndSwap(val, targetIdx);

    // RECORD STATE
    const state = this.arr;
    this.record({ op: VISUAL_OPS_TYPES.DONE, args: { state } });
  }

  private recordSearch(searchVal: T) {
    const initState = this.arr;
    this.record({
      op: VISUAL_OPS_TYPES.SEARCH,
      args: {
        state: initState,
        searchVal,
      },
    });
  }

  private insertAndSwap(val: T | null, targetIdx?: number) {
    const initIdx = this.validLen;

    this.arr[initIdx] = val;
    const state = this.arr;
    this.record({
      op: VISUAL_OPS_TYPES.INS,
      args: { state, val, initIdx },
    }); //START INSERTION

    for (let idx = initIdx; idx > 0; idx--) {
      const leftIdx = idx - 1;

      if (targetIdx !== undefined) {
        if (idx === targetIdx) break;
        this._swap(leftIdx, idx);
      } else {
        // this is isSorted
        const leftVal = this.arr[leftIdx];
        const rightVal = this.arr[idx];
        if (
          (leftVal && rightVal && leftVal > rightVal) ||
          leftVal == null ||
          rightVal == null
        )
          this._swap(leftIdx, idx);
        else break;
      }
    }
  }

  private recordDelete(idx: number, state: (T | null)[]) {
    this.record({ op: VISUAL_OPS_TYPES.DEL, indices: [idx] });
    this.arr.slice(idx, this.validLen).forEach((_, newIdx) =>
      this.record({
        op: VISUAL_OPS_TYPES.SWAP,
        indices: [idx + newIdx, newIdx + idx + 1],
      }),
    );

    this.record({ op: VISUAL_OPS_TYPES.DONE, args: { state } });
  }

  _swap(left: number, right: number) {
    const buffer = this.arr[right];

    this.arr[right] = this.arr[left];
    this.arr[left] = buffer;
    this.record({
      op: VISUAL_OPS_TYPES.SWAP,
      indices: [left, right],
    });
  }

  private binarySearch(
    searchVal: T,
    high: number = this.validLen - 1,
    low: number = 0,
  ): number {
    if (searchVal === null) return -1;

    if (low > high) return -1;
    const mid = Math.ceil((high + low) / 2);
    this.record({
      op: VISUAL_OPS_TYPES.MOVE_PTRS,
      args: { low, high, mid },
    });

    const midValue = this.arr[mid];
    if (midValue === null) return -1;

    const eq = this.compare(midValue, searchVal);
    if (eq === 0) return mid;
    else if (eq === 1) high = mid - 1;
    else low = mid + 1;

    return this.binarySearch(searchVal, high, low);
  }

  private recordSearchEnd(idx: number) {
    const state = this.arr;
    this.record({
      op: VISUAL_OPS_TYPES.FOUND,
      args: {
        idx,
      },
    });
    this.record({
      op: VISUAL_OPS_TYPES.DONE,
      args: {
        state,
      },
    });
  }

  next() {
    if (this.nextCounter >= this.arr.length) {
      this.nextCounter = 0;
      return { value: null, done: true };
    }
    const value = this.arr[this.nextCounter];
    this.nextCounter++;
    return { value, done: false };
  }

  /**
   * All symbol.iter needs to return is an iterator obj and if it is a generator. fine
   */
  *[Symbol.iterator]() {
    for (let idx = 0; idx < this.length; idx++) {
      yield this.arr[idx];
    }
  }

  toString() {
    return `${this.arr}`;
  }
}

type createParams<T extends string | number> = {
  userList?: T[];
  length?: number;
  fill?: number;
  isSorted?: boolean;
  isResizable?: boolean;
};

export function createTArray<T extends NonNullComparable>(
  params: createParams<T>,
): TArray<T> {
  const { length, fill = 0, isSorted, userList, isResizable } = params;
  if (userList != null && isNonEmptyIterable(userList))
    return new TArray(userList, isSorted, isResizable);
  if (length) {
    const list = Array.from({ length });
    for (let idx = 0; idx < length - fill; idx++) {
      list[idx] = Math.max(1, Math.trunc(Math.random() * 100));
    }

    if (isSorted) {
      list.sort((a, b) => Number(a) - Number(b));
    }

    return new TArray(list as Iterable<T>, isSorted, isResizable);
  }
  throw new Error("Cannot create array from user input");
}

export function isNonEmptyIterable<T>(someIter: any): someIter is Iterable<T> {
  if (someIter == null) return false;
  if (Symbol.iterator in someIter) {
    const iterObj = someIter[Symbol.iterator](); //get iterator object
    const iterResult = iterObj.next();
    if (iterResult.value != null) return true;
  }
  return false;
}
