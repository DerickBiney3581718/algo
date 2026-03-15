import assert from "node:assert/strict";

class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.previous = null;
  }
}

export class DoublyLinkedList {
  head = null;
  tail = null;
  size = 0;

  constructor(iterable = []) {
    if (
      iterable &&
      typeof iterable == "object" &&
      Symbol.iterator in iterable
    ) {
      let prevNode = null;
      for (let value of iterable) {
        const newNode = new ListNode(value);
        if (!prevNode) this.head = newNode;
        else {
          newNode.previous = prevNode;
          prevNode.next = newNode;
        }
        prevNode = newNode;
        this.size += 1;
      }

      this.tail = prevNode;
    } else throw new Error("constructor need iterable");
  }

  [Symbol.iterator]() {
    let initNode = this.head;
    function next() {
      if (!initNode) return { done: true, value: undefined };
      const value = initNode.value;
      initNode = initNode.next;
      return { done: false, value };
    }
    return { next };
  }

  prepend(value) {
    const firstNode = this.head;
    const newNode = new ListNode(value);

    newNode.next = firstNode;
    if (firstNode === null) this.tail = newNode;
    if (firstNode) firstNode.previous = newNode;

    this.head = newNode;
    this.size += 1;
    return this;
  }

  append(value) {
    const lastNode = this.tail;
    const newNode = new ListNode(value);

    if (lastNode === null) this.head = newNode;
    else {
      lastNode.next = newNode;
      newNode.previous = lastNode.lastNode;
    }
    this.tail = newNode;
    this.size += 1;
    return this;
  }

  isEmpty() {
    return this.size === 0;
  }

  search(value) {
    let currNode = this.head;
    while (currNode) {
      if (currNode.value === value) return this;
      currNode = currNode.next;
    }
    return null;
  }

  remove(value) {
    let currNode = this.head;
    while (currNode) {
      if (currNode.value === value) {
        if (currNode.previous) {
          currNode.previous.next = currNode.next;
        } else {
          this.head = currNode.next;
        }

        if (currNode.next) {
          currNode.next.previous = currNode.previous;
        } else {
          this.tail = currNode.previous;
        }

        this.size -= 1;
        return this;
      }
      currNode = currNode.next;
    }
    return null;
  }

  removeFromEnd() {
    const lastNode = this.tail;
    this.tail = lastNode.previous;
    this.tail.next = null;
    return lastNode.value;
  }

  removeFromHead() {
    const firstNode = this.head;
    this.head = firstNode.next;
    this.head.previous = null;
    return firstNode.value;
  }

  peekHead() {
    return this.head.value;
  }
}

const doubleLL = new DoublyLinkedList([11, 2, 3]);
const emptyLL = new DoublyLinkedList();
assert.deepStrictEqual([...doubleLL], [11, 2, 3]);
assert.deepEqual(doubleLL.head.value, 11);
assert.deepEqual(doubleLL.tail.value, 3);

// test append
doubleLL.append(5).append(4);
assert.deepStrictEqual([...doubleLL], [11, 2, 3, 5, 4]);
assert.deepEqual(doubleLL.size, 5);
assert.equal(doubleLL.tail.value, 4);

emptyLL.append(9);
assert.deepStrictEqual([...emptyLL], [9]);
assert.equal(emptyLL.size, 1);
assert.equal(emptyLL.tail.value, 9);
assert.equal(emptyLL.head.value, 9);

// remove
emptyLL.remove(9);
assert.equal(emptyLL.size, 0);

// test prepend
doubleLL.prepend(6).prepend(7);
assert.deepStrictEqual([...doubleLL], [7, 6, 11, 2, 3, 5, 4]);
assert.equal(doubleLL.head.value, 7);
assert.equal(doubleLL.size, 7);
assert.equal(doubleLL.tail.value, 4);

emptyLL.prepend(9);
assert.deepStrictEqual([...emptyLL], [9]);
assert.equal(emptyLL.size, 1);
assert.equal(emptyLL.tail.value, 9);
assert.equal(emptyLL.head.value, 9);
emptyLL.remove(9);
// search
assert.deepStrictEqual(doubleLL.search(11), doubleLL);
assert.deepStrictEqual(doubleLL.search(4), doubleLL);
assert.deepStrictEqual(doubleLL.search(7), doubleLL);
assert.deepEqual(doubleLL.search(3243), null);
assert.deepEqual(emptyLL.search(42434), null);
