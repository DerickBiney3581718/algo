import { Base } from "../Base";

export class LinkNode<T> {
  value: T;
  next: LinkNode<T> | null = null;

  constructor(value: T, next?: LinkNode<T>) {
    this.value = value;
    this.next = next ?? null;
  }
}

export class LinkedList<T> extends Base {
  head: LinkNode<T> | null = null;
  tail: LinkNode<T> | null = null;
  _iter: LinkNode<T> | null = null;

  constructor(list: Iterable<T>) {
    super();
    for (const value of list) this.insert(value);
  }

  insert(value: T): void {
    const nextNode = new LinkNode(value);
    if (this.head === null) {
      this.head = nextNode;
      this.tail = nextNode;
    } else {
      nextNode.next = this.head;
      this.head = nextNode;
    }
    this._iter = this.head;
  }

  insertAtEnd(value: T): void {
    const newNode = new LinkNode(value);
    if (this.tail) this.tail.next = newNode;
    this.tail = newNode;
  }

  search(value: T): LinkNode<T> | null {
    let counter = this.head;
    let found = null;

    while (counter && found === null) {
      if (counter.value === value) found = counter;
      counter = counter.next;
    }
    return found;
  }

  update(value: T): boolean {
    const found = this.search(value);
    if (found === null) return false;
    found.value = value;
    return true;
  }

  remove(value: T): LinkNode<T> | null {
    const found = this.search(value);
    if (found === null) return found;
    else {
      if (found === this.head) {
        const nextNode = this.head.next;
        this.head = nextNode;
      }
      const prev = this._prev(found.value);
      if (found === this.tail) {
        this.tail = prev;
      }
      if (prev !== null) {
        prev.next = found.next;
      }
    }
    return found;
  }

  removeFromStart(): LinkNode<T> | null {
    const headValue = this.head?.value;
    if (headValue == null) return null;
    return this.remove(headValue);
  }

  /**
   * removes the last element in the linked list
   * depends on non-duplicates
   * @returns LinkNode<T>
   */
  removeFromEnd(): LinkNode<T> | null {
    const tailValue = this.tail?.value;
    if (tailValue == null) return null;
    return this.remove(tailValue);
  }

  _prev(value: T): LinkNode<T> | null {
    let currNode = this.head;
    let nextNode = currNode?.next;

    while (nextNode) {
      if (nextNode?.value === value) break;
      currNode = nextNode;
      nextNode = nextNode.next;
    }

    return currNode;
  }

  next() {
    const value = this._iter?.value; //value can be undefined
    if (value !== undefined) {
      this._iter = this._iter?.next ?? null;
      return { value, done: false };
    }
    this._iter = this.head;
    return { value: null, done: true };
  }

  [Symbol.iterator]() {
    return this;
  }
}
