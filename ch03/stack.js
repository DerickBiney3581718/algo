import { DoublyLinkedList } from "./doubly-linked-list.js";

/** Stack imp: LIFO order
 * init, pop, push
 */

class Stack {
  constructor() {
    this.box = [];
  }

  push(...el) {
    this.box.push(...el);
    return this;
  }

  pop() {
    this.box.pop();
  }

  toString() {
    let show = "-".repeat(this.box.length * 4);
    const bus = this.box.join(" | ");
    return `${show}\n| ${bus} |--|\n${show}`;
  }
}

const newStack = new Stack();
newStack.push(9, 8, 7, 6);
console.log(newStack.toString());
newStack.pop();
newStack.pop();
console.log(String(newStack));

class ListStack {
  constructor() {
    this.box = new DoublyLinkedList();
  }

  push(el) {
    this.box.append(el);
    return this;
  }

  pop() {
    this.box.removeFromEnd();
  }

  toString() {
    const boxValues = Array.from(this.box);
    let show = "-".repeat(boxValues.length * 4);
    const bus = boxValues.join(" | ");
    return `${show}\n| ${bus} |--|\n${show}`;
  }
}

const newLStack = new Stack();
newLStack.push(9, 8, 7, 6);
console.log(newLStack.toString());
newLStack.pop();
console.log(String(newLStack));
