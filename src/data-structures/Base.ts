import type { VisualOp } from "../types/dsa";

export abstract class Base extends EventTarget {
  protected operations: VisualOp[] = [];

  getOps() {
    return [...this.operations];
  }

  protected record(op: VisualOp) {
    this.dispatchEvent(new CustomEvent("op", { detail: op }));
  }
}
