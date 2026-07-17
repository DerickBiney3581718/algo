/**
 * public class ST<Key, Value>
 * ST() create a symbol table
 * void put(Key key, Value val) put key-value pair into the table
 * (remove key from table if value is null)
 * Value get(Key key) value paired with key
 * (null if key is absent)
 * void delete(Key key) remove key (and its value) from table
 * boolean contains(Key key) is there a value paired with key?
 * boolean isEmpty() is the table empty?
 * int size() number of key-value pairs in the table
 * Iterable<Key> keys() all the keys in the table
 */

import type { Comparable, NonNullComparable } from "../../types/dsa";

class Node<
  K extends NonNullComparable = string,
  V extends Comparable = string,
> {
  next: Node<K, V> | null;
  prev: Node<K, V> | null;
  value: V;
  key: K;

  constructor(
    key: K,
    value: V,
    next?: Node<K, V> | null,
    prev?: Node<K, V> | null,
  ) {
    this.key = key;
    this.value = value;
    this.next = next ?? null;
    this.prev = prev ?? null;
  }
}

export class UnorderedST<K extends NonNullComparable, V extends Comparable> {
  head: Node<K, V> | null = null;
  tail: Node<K, V> | null = null;
  size: number = 0;

  put(key: K, value: V): void {
    let currNode = this.head;

    do {
      if (currNode == null) {
        // first node insertion
        const newNode = new Node(key, value);
        this.head = newNode;
        this.tail = newNode;
        this.size++;
        return;
      } else if (currNode.key === key) {
        // node update
        if (value === null) {
          this.remove(currNode);
        }
        currNode.value = value;
        return;
      }
      currNode = currNode.next;
    } while (currNode);

    // insertion
    const lastNode = this.tail;
    const newNode = new Node(key, value);
    if (lastNode) {
      lastNode.next = newNode;
      newNode.prev = lastNode;
      this.tail = newNode;
      this.size++;
    }
  }

  remove(currNode: Node<K, V>): void {
    const prev = currNode.prev;
    const next = currNode.next;

    if (prev !== null) {
      prev.next = next;
    } else {
      this.head = next;
    }
    if (next !== null) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }
    this.size--;
  }

  get(key: K): V | null {
    for (const node of this.nodes()) {
      if (node.key == key) return node.value;
    }
    return null;
  }

  delete(key: K): void {
    for (const node of this.nodes()) {
      if (node.key == key) this.remove(node);
    }
  }

  get isEmpty(): boolean {
    return this.size <= 0;
  }

  contains(key: K): boolean {
    let hasKey = false;
    for (const node of this.nodes()) {
      if (node.key == key) {
        hasKey = true;
        break;
      }
    }
    return hasKey;
  }

  get keys(): K[] {
    return Array.from(this.nodes()).map((node) => node.key);
  }

  *nodes(): Generator<Node<K, V>> {
    for (
      let currNode = this.head;
      currNode !== null;
      currNode = currNode.next
    ) {
      yield currNode;
    }
  }
}

const uST = new UnorderedST();
uST.put("name", "Maria");
uST.put("sign", "venus");
uST.put("from", "Malaysia");

uST.keys.forEach((val) => console.log(uST.get(val)));
