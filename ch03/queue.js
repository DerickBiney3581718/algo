import { DoublyLinkedList } from "./doubly-linked-list.js";
/**
 * Queue imp : FIFO
 * enqueue
 * dequeue
 */

class Queue {
  constructor() {
    this.box = [];
  }

  enqueue(el) {
    this.box.unshift(el);
    return this;
  }

  dequeue() {
    return this.box.shift();
  }

  isEmpty() {
    return this.box.length === 0;
  }

  peek() {
    if (!this.isEmpty) return this.box[0];
    return null;
  }

  toString() {
    const totalchars = this.box.join().length;
    let show = " ".repeat(4) + "-".repeat(totalchars + this.box.length * 2);
    const bus = this.box.join(" | ");
    return `\n${show}\n|--| ${bus} |\n${show}`;
  }
}

const q1 = new Queue();
q1.enqueue("jojo").enqueue("loretta").enqueue("momo");
console.log(String(q1));
q1.dequeue();
console.log(q1.toString());

class ListQueue {
  constructor() {
    this.box = new DoublyLinkedList();
  }

  enqueue(el) {
    this.box.append(el);
    return this;
  }
  isEmpty() {
    return this.box.isEmpty();
  }
  peek() {
    return this.box.peekHead();
  }

  dequeue() {
    this.box.removeFromHead();
  }

  toString() {
    const boxValues = Array.from(this.box);
    const totalchars = boxValues.join().length;
    let show = " ".repeat(4) + "-".repeat(totalchars + boxValues.length * 2);
    const bus = boxValues.join(" | ");
    return `${show}\n|--| ${bus} |\n${show}`;
  }
}

const lq1 = new ListQueue();
console.log(String(lq1.enqueue("pic").enqueue("the").enqueue("fin")));

lq1.dequeue();

console.log("peeking dequeue: ", lq1.peek());
