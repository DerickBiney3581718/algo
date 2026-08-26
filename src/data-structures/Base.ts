import type { Comparable, VisualOp } from "../types/dsa";

export type CompareFn<T> = (left: T, right: T) => number;
export type ValueOfFn<T> = (item: T) => Comparable;

export abstract class Base<T> extends EventTarget {
  protected operations: VisualOp[] = [];

  valueOf(item: T | null): Comparable {
    return String(item);
  }

  compare(left: T | null, right: T | null): number {
    const leftVal = this.valueOf(left);
    const rightVal = this.valueOf(right);

    if (leftVal == null) return -1;
    if (rightVal == null) return 1;
    if (leftVal > rightVal) return 1;
    if (leftVal < rightVal) return -1;
    else return 0;
  }

  constructor(compare?: CompareFn<T>, valueOf?: ValueOfFn<T>) {
    super();
    if (compare) this.compare = compare;
    if (valueOf) this.valueOf = valueOf;
  }

  getOps() {
    return [...this.operations];
  }

  protected record(op: VisualOp) {
    this.dispatchEvent(new CustomEvent("op", { detail: op }));
  }
}
