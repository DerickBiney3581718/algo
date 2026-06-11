import { VISUAL_OPS_TYPES } from "../types/dsa";
import { Base } from "./Base";

export interface TArray<T extends number | string> {
  [idx: number]: T;
}

export class TArray<T extends number | string> extends Base {
  arr: T[];
  private validLen: number = 0;
  private isSorted: boolean;
  private nextCounter: number = 0;
  length: number;

  constructor(initArr: Iterable<T>, isSorted: boolean = false) {
    super();
    this.arr = Array.from(initArr);
    this.length = this.arr.length;
    this.isSorted = isSorted;
    this.updateValidLen();

    return new Proxy(this, {
      get(target, key, receiver) {
        if (typeof key == "string" && !isNaN(+key)) return target.arr[+key];
        return Reflect.get(target, key, receiver);
      },
    });
  }
  get showArr() {
    return this.arr;
  }

  delete(idx: number) {
    const newArr = this.arr.slice(0, idx).concat(this.arr.slice(idx + 1));
    newArr.length = this.length;
    this.arr = newArr;
    this.updateValidLen();
    this.record({ op: VISUAL_OPS_TYPES.DEL, indices: [idx] });
  }

  search(searchVal: T): number {
    let foundIdx = -1;
    if (this.isSorted) {
      foundIdx = this.binarySearch(searchVal);
    } else
      foundIdx = this.arr.findIndex((val, idx) => {
        this.record({
          op: VISUAL_OPS_TYPES.MOVE_PTRS,
          args: { idx },
        });
        return val === searchVal;
      });
    return foundIdx;
  }

  insert(val: T, idx?: number) {
    if (this.validLen === this.length) throw new Error("Array is full");
    if (this.isSorted) {
      idx = this.findInsertIdx(val);
    }
    this.insertOrFail(val, idx);
  }

  private updateValidLen(): void {
    this.validLen = this.arr.filter((val) => val != null).length;
  }

  private insertOrFail(val: T, idx?: number) {
    const isValidIdx = typeof idx === "number";
    if (isValidIdx && idx >= this.length)
      throw new Error("Index is out of range");
    // idx may be undefined

    const targetIdx = isValidIdx ? idx : this.validLen; //insert at first empty slot
    this.arr = this.arr
      .slice(0, targetIdx)
      .concat([val], this.arr.slice(targetIdx, this.length - 1));

    this.arr.length = this.length;
    this.updateValidLen();

    this.record({ op: VISUAL_OPS_TYPES.INS, indices: [targetIdx] });
  }

  private binarySearch(
    searchVal: T,
    high: number = this.validLen - 1,
    low: number = 0,
  ): number {
    if (low > high) return -1;
    const mid = Math.ceil((high + low) / 2);
    this.record({
      op: VISUAL_OPS_TYPES.MOVE_PTRS,
      args: { low, high, mid },
    });
    if (this.arr[mid] === searchVal) return mid;
    else if (this.arr[mid] > searchVal) high = mid - 1;
    else low = mid + 1;
    return this.binarySearch(searchVal, high, low);
  }

  private findInsertIdx(val: T): number | undefined {
    let low = 0,
      high = this.validLen - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      this.record({
        op: VISUAL_OPS_TYPES.MOVE_PTRS,
        args: { low, high, mid },
      });
      if (this.arr[mid] <= val) low = mid + 1;
      else high = mid - 1;
    }
    this.record({
      op: VISUAL_OPS_TYPES.MOVE_PTRS,
      args: { low, high },
    });
    return low; // first position where arr[pos] > val
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

  [Symbol.iterator]() {
    return this;
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
};

export function createTArray<T extends string | number>(
  params: createParams<T>,
): TArray<T> {
  const { length, fill = 0, isSorted, userList } = params;
  if (userList != null && isNonEmptyIterable(userList))
    return new TArray(userList);
  if (length) {
    const list = Array.from({ length });
    for (let idx = 0; idx < length - fill; idx++) {
      list[idx] = Math.max(1, Math.trunc(Math.random() * 100));
    }

    if (isSorted) list.sort();

    return new TArray(list as Iterable<T>);
  }
  throw new Error("Cannot create array from user input");
}

function isNonEmptyIterable<T>(someIter?: Iterable<T>) {
  if (someIter == null) return false;
  if (Symbol.iterator in someIter) {
    const iterObj = someIter[Symbol.iterator](); //get iterator object
    const iterResult = iterObj.next();
    if (iterResult.value != null) return true;
  } else return false;
}
