import { Base } from "../Base";
import { LinkNode } from "../linked-lists/LinkedLists";

export class Queue<T> extends Base<T> {
  private head: LinkNode<T> | null = null;
  private tail: LinkNode<T> | null = null;
  _size = 0;

  constructor(list: Iterable<T> = []) {
    super();
    for (const value of list) this.enqueue(value);
  }

  enqueue(value: T): Queue<T> {
    const newNode = new LinkNode(value);
    if (this.tail === null) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this._size += 1;
    return this;
  }

  dequeue(): T | null {
    if (this.head === null) return null;
    else {
      const currHead = this.head.value;
      const isTail = this.head === this.tail;

      if (isTail) {
        this.head = this.tail = null;
      } else {
        const nextNode = this.head.next;
        this.head = nextNode;
      }
      this._size -= 1;
      return currHead;
    }
  }

  peek(): T | null {
    return this.head?.value ?? null;
  }

  get size(): number {
    return this._size;
  }

  toString() {
    return this.tail;
  }
}
