export class ListNode {
  constructor(value, next = null) {
    this.value = value;
    this.next = next;
  }
}

export class LinkedList {
  size = 0;
  constructor(iterable = []) {
    this.head = null;
    this.tail = null;

    try {
      if (iterable && Symbol.iterator in iterable) {
        let prevNode = null;
        for (let elem of iterable) {
          this.size += 1;
          let currNode = new ListNode(elem);
          if (prevNode == null) this.head = currNode;
          else prevNode.next = currNode;
          prevNode = currNode;
        }
        this.tail = prevNode;
      }
    } catch {
      throw new Error("the constructor needs an iterable");
    }
  }

  search(value) {
    let currNode = this.head;
    while (currNode) {
      if (value === currNode.value) {
        break;
      }
      currNode = currNode.next;
    }
    return currNode;
  }

  prepend(value) {
    const newNode = new ListNode(value);
    newNode.next = this.head;
    this.head = newNode;
    if (this.isEmpty()) this.tail = newNode;
    this.size += 1;
    return this;
  }

  isEmpty() {
    return this.size === 0;
  }

  append(value) {
    const newNode = new ListNode(value);
    if (this.isEmpty()) this.head = newNode;
    else this.tail.next = newNode;

    this.tail = newNode;
    this.size += 1;
    return this;
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
      }
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

// const linkedList1 = new LinkedList([1, 2, 4, 3, 5, 6, 90]);

// for (const val of linkedList1) {
//   console.log(val);
// }
// console.log(`linked list remove : ${5}`, linkedList1.remove(5));
// console.log("append 5 : ", linkedList1.push(5));
// console.log(`linked list size: ${linkedList1.size}`);

// const emptyLinkedList = new LinkedList([]);
// console.log("search for 10", emptyLinkedList.search(10));
