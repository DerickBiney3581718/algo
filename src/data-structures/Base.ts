import type { VisualOp } from "../types/dsa";

export type ValueOfFn<T> = (left: T) => string | number | null;

export abstract class Base<T> extends EventTarget {
  protected operations: VisualOp[] = [];

  valueOf: ValueOfFn<T | null> = (value) =>
    value == null ? null : String(value);

  compare(left: T | null, right: T | null): number {
    const leftVal = this.valueOf(left);
    const rightVal = this.valueOf(right);

    if (leftVal == null) return -1;
    if (rightVal == null) return 1;
    if (leftVal > rightVal) return 1;
    if (leftVal < rightVal) return -1;
    else return 0;
  }

  constructor(valueOf?: ValueOfFn<T | null>) {
    super();
    if (valueOf) this.valueOf = valueOf;
  }

  getOps() {
    return [...this.operations];
  }

  protected record(op: VisualOp) {
    this.dispatchEvent(new CustomEvent("op", { detail: op }));
  }
}
