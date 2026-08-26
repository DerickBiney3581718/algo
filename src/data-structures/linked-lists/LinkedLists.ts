import { Base } from "../Base";

export class LinkNode<T> {
  value: T;
  next: LinkNode<T> | null = null;

  constructor(value: T, next?: LinkNode<T>) {
    this.value = value;
    this.next = next ?? null;
  }
}

export type CompareFn<T, Q> = (counter: LinkNode<T>, value: Q) => boolean;
export type KeyFn<T, Q> = (value: T) => Q;

export class LinkedList<T, Q = T> extends Base<T> {
  head: LinkNode<T> | null = null;
  tail: LinkNode<T> | null = null;
  _iter: LinkNode<T> | null = null;
  private _size: number = 0;

  compareFn: CompareFn<T, Q> = (counter, value) =>
    this.keyOf(counter.value) === value;

  keyOf: KeyFn<T, Q> = (value: T) => value as unknown as Q;

  constructor(
    list?: Iterable<T>,
    compareFn?: CompareFn<T, Q>,
    keyOf?: KeyFn<T, Q>,
  ) {
    super();
    if (compareFn) this.compareFn = compareFn;
    if (keyOf) this.keyOf = keyOf;
    if (list) for (const value of list) this.insert(value);
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
    this._size++;
  }

  insertAtEnd(value: T): void {
    const newNode = new LinkNode(value);
    if (this.tail) this.tail.next = newNode;
    this.tail = newNode;
    this._size++;
  }

  search(value: Q): LinkNode<T> | null {
    let counter = this.head;
    let found = null;

    while (counter && found === null) {
      if (this.compareFn(counter, value)) found = counter;
      counter = counter.next;
    }
    return found;
  }

  update(value: T): boolean {
    const found = this.search(this.keyOf(value));
    if (found === null) return false;
    found.value = value;
    return true;
  }

  remove(query: Q): LinkNode<T> | null {
    const found = this.search(query);
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
    this._size--;
    return found;
  }

  removeFromStart(): LinkNode<T> | null {
    const headValue = this.head?.value;
    if (headValue == null) return null;
    return this.remove(this.keyOf(headValue));
  }

  /**
   * removes the last element in the linked list
   * depends on non-duplicates
   * @returns LinkNode<T>
   */
  // removeFromEnd(): LinkNode<T> | null {
  //   const tailValue = this.tail?.value;
  //   if (tailValue == null) return null;
  //   return this.remove(tailValue);
  // }

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

  toString() {
    const values: string[] = [];
    for (const val of this) values.push(String(val));
    return values.join(" -> ");
  }

  get size(): number {
    return this._size;
  }
}
