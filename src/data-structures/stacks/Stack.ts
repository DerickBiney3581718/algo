import { Base } from "../Base";
import { LinkedList } from "../linked-lists/LinkedLists";

export class Stack<T> extends Base {
  private engine: LinkedList<T> = new LinkedList();
  private _size = 0;

  constructor(list: Iterable<T> = []) {
    super();
    for (const value of list) this.push(value);
  }

  pop(): T | null {
    const popped = this.engine?.removeFromStart()?.value ?? null;
    this._size--;
    return popped;
  }

  push(value: T): void {
    this.engine.insert(value);
    this._size++;
  }

  peek(): T | null {
    let initValue = null;
    for (const value of this.engine) {
      initValue = value;
      break;
    }
    return initValue;
  }

  toString() {
    return this.engine.toString();
  }

  get size(): number {
    return this._size;
  }
}
