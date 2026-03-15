import assert from "node:assert/strict";

class ListNode {
  constructor(value, next = null) {
    this.value = value;
    this.next = next;
  }
}

class SortedLinkedList {
  size = 0;
  constructor(iterable = []) {
    this.head = null;
    this.tail = null;

    if (
      iterable &&
      typeof iterable == "object" &&
      Symbol.iterator in iterable
    ) {
      let prevNode = null;
      const incomingList = [];

      for (let elem of iterable) incomingList.push(elem);
      const sortedList = incomingList.toSorted();
      if (sortedList.length) {
        for (let elem of sortedList) {
          this.size += 1;
          let currNode = new ListNode(elem);
          if (prevNode == null) this.head = currNode;
          else prevNode.next = currNode;
          prevNode = currNode;
        }
        this.tail = prevNode;
      }
    } else throw new Error("the constructor needs an iterable");
  }

  search(value) {
    let currNode = this.head;
    while (currNode) {
      if (value === currNode.value) {
        break;
      }
      if (value < currNode.value) return null;
      currNode = currNode.next;
    }
    return currNode;
  }

  insert(value) {
    const newNode = new ListNode(value);
    let currNode = this.head;
    let prevNode = null;

    while (true) {
      // if at the end
      if (!currNode) {
        this.tail = newNode;
        if (prevNode == null) this.head = newNode;
        else prevNode.next = newNode;
        break;
      } else if (currNode.value >= value) {
        // inserting before greater number
        newNode.next = currNode;

        if (prevNode == null) this.head = newNode;
        else prevNode.next = newNode;
        break;
      }

      prevNode = currNode;
      currNode = currNode.next;
    }

    this.size += 1;
    return this;
  }

  isEmpty() {
    return this.size === 0;
  }

  remove(value) {
    let currNode = this.head;
    let prevNode = null;

    while (currNode) {
      if (value === currNode.value) {
        if (!prevNode) this.head = currNode.next;
        else prevNode.next = currNode.next;
        if (!currNode.next) this.tail = prevNode;
        this.size -= 1;
        return value;
      } else if (value < currNode.value) return null;

      prevNode = currNode;
      currNode = currNode.next;
    }
    return null;
  }

  // Symbol.iterator has to return an iterator object
  [Symbol.iterator]() {
    let currNode = this.head;
    function next() {
      if (!currNode) return { done: true, value: undefined };
      const currVal = currNode.value;
      currNode = currNode.next;
      return { value: currVal, done: false };
    }
    return { next };
  }
}

// --- construction ---
const sortedLL = new SortedLinkedList([5, 2, 1]);
assert.deepStrictEqual([...sortedLL], [1, 2, 5]);
assert.strictEqual(sortedLL.size, 3);
assert.strictEqual(sortedLL.head.value, 1);
assert.strictEqual(sortedLL.tail.value, 5);

// --- insert ---
sortedLL.insert(4);
sortedLL.insert(0);
sortedLL.insert(8);
sortedLL.insert(9);
assert.deepStrictEqual([...sortedLL], [0, 1, 2, 4, 5, 8, 9]);
assert.strictEqual(sortedLL.size, 7);
assert.strictEqual(sortedLL.head.value, 0);
assert.strictEqual(sortedLL.tail.value, 9);
console.log(
  "after insertion: ",
  [...sortedLL],
  sortedLL.size,
  sortedLL.head.value,
);

// --- remove (mid, head, tail) ---
sortedLL.remove(2);
sortedLL.remove(0);
sortedLL.remove(9);
assert.deepStrictEqual([...sortedLL], [1, 4, 5, 8]);
assert.strictEqual(sortedLL.size, 4);
assert.strictEqual(sortedLL.head.value, 1);
assert.strictEqual(sortedLL.tail.value, 8);

// --- error on non-iterable ---
assert.throws(() => new SortedLinkedList(7), {
  message: "the constructor needs an iterable",
});
