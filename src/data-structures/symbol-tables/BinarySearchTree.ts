import type { NonNullComparable } from "../../types/dsa";
// import type { Queue as QueueType } from "../queues/Queue";
// import { Queue } from "../queues/Queue.ts";

class BSTNode<T extends NonNullComparable> {
  value: T;
  key: T;
  size: number = 1;

  parent: BSTNode<T> | null = null;
  left: BSTNode<T> | null = null;
  right: BSTNode<T> | null = null;

  constructor(key: T, value: T) {
    this.key = key;
    this.value = value;
  }

  get min(): BSTNode<T> | null {
    let minNode: BSTNode<T> = this;
    while (minNode.left) minNode = minNode.left;
    return minNode;
  }

  get max(): BSTNode<T> | null {
    let maxNode: BSTNode<T> = this;
    while (maxNode.right) maxNode = maxNode.right;
    return maxNode;
  }
}

export class BST<T extends NonNullComparable> {
  root: BSTNode<T> | null = null;

  constructor(key?: T, value?: T) {
    if (key != null && value != null) this.root = new BSTNode(key, value);
  }

  put(key: T, value: T | null): void {
    let parent: BSTNode<T> | null = null;
    let child = this.root;

    while (true) {
      if (child === null && value !== null) {
        child = new BSTNode(key, value);
        child.parent = parent;

        if (parent === null) {
          this.root = child;
          break;
        }

        if (parent.key! < key) parent.right = child;
        else parent.left = child;
        this.updateSize(parent);
        break;
      }

      if (child !== null && child.key !== null) {
        // check equality
        if (child.key === key) {
          if (value !== null)
            child.value = value; // update
          else if (value === null) this.delete(key);
          break;
        } else {
          parent = child;
          const isLeft = child.key > key; //check search key less
          child = isLeft ? child.left : child.right;
        }
      } else {
        break;
      }
    }
  }

  get(key: T): T | null {
    for (const node of this.walk(key)) if (node) return node.value;

    return null;
  }

  contains(key: T): boolean {
    return !!this.findNode(key);
  }

  delete(key: T): void {
    const node = this.findNode(key);
    if (node === null) return;
    const parent = node.parent;
    const children = (node.left ? 1 : 0) + (node.right ? 1 : 0);
    if (children === 0) {
      this.detach(node);
      if (parent === null) this.root = null;
    } else if (children === 1) this._deleteOne(node);
    else {
      const rightMin = node.right!.min;

      node.key = rightMin?.key!;
      node.value = rightMin?.value!;

      this._deleteOne(rightMin!); //detach right min
    }
  }

  updateSize(parent: BSTNode<T>): void {
    let currParent: BSTNode<T> | null = parent;
    while (currParent) {
      currParent.size =
        (currParent.left?.size ?? 0) + (currParent.right?.size ?? 0) + 1;
      currParent = currParent.parent;
    }
  }

  _deleteOne(node: BSTNode<T>) {
    const child = node.left ?? node.right;
    const parent = node.parent;

    this.detach(node); // break node-parent
    this.detach(child!); // break child-node
    if (parent === null) {
      this.root = child;
    }
    this.attach(parent, child);
  }

  detach(child: BSTNode<T>) {
    const parent: BSTNode<T> | null = child?.parent ?? null;
    if (parent && this.isLeftChild(parent, child)) parent.left = null;
    else if (parent && !this.isLeftChild(parent, child)) parent.right = null;

    if (child) child.parent = null;
    if (parent) this.updateSize(parent);
  }

  attach(parent: BSTNode<T> | null, child: BSTNode<T> | null) {
    if (!child) return;
    child.parent = parent;

    if (parent === null) return;
    if (this.isLeftChild(parent, child)) {
      parent.left = child;
    } else {
      parent.right = child;
    }
    this.updateSize(parent);
  }

  get min(): T | null {
    return this.root?.min?.key ?? null;
  }

  get max(): T | null {
    return this.root?.max?.key ?? null;
  }

  floor(key: T, node: BSTNode<T> | null = this.root): T | null {
    if (node === null) return null;

    if (node.key === null) return null;

    let newNodeKey = null;
    if (key < node.key) newNodeKey = this.floor(key, node.left);
    else if (key > node.key) {
      if (node.right?.key != null) newNodeKey = this.floor(key, node.right);
    }

    if (
      (newNodeKey === null && node.key <= key) ||
      (newNodeKey !== null && node.key > newNodeKey && node.key < key)
    )
      return node.key;
    else return newNodeKey;
  }

  ceiling(searchKey: T, node: BSTNode<T> | null = this.root): T | null {
    // smallest key larger than key or key
    if (node === null) return null;

    if (node.key === null) return null;

    let newNodeKey = null;
    if (searchKey >= node.key) {
      //check if right is smaller than node key, but greater search key
      newNodeKey = this.ceiling(searchKey, node.right);
    } else if (searchKey < node.key) {
      newNodeKey = this.ceiling(searchKey, node.left);
    }

    if (
      (newNodeKey === null && node.key >= searchKey) ||
      (newNodeKey !== null && node.key < newNodeKey && node.key > searchKey)
    )
      return node.key;
    else return newNodeKey;
  }

  rank(key: T): number | null {
    let node = this.findNode(key); //get the node, bubble up to the root
    if (node === null) return null;
    let rank = (node.left?.size ?? 0) + 1;

    while (node) {
      const parent: BSTNode<T> | null = node.parent;
      if (parent === null) return rank;
      else {
        if (!this.isLeftChild(parent, node))
          rank = (parent?.left?.size ?? 0) + 1 + rank;
        node = parent;
      }
    }

    return rank;
  }

  isLeftChild(parent: BSTNode<T>, child: BSTNode<T>): boolean {
    return parent.key! > child.key! ? true : false;
  }

  select(rank: number): T | null {
    let node = this.root; // bubble down from root to find size match, accounting for right side sicount

    while (node) {
      if (node.size === null) {
        return null;
      }

      const leftSize = node.left?.size ?? 0;

      if (rank == leftSize + 1) return node.key;
      else if (rank > leftSize + 1) {
        rank -= leftSize + 1;
        node = node.right;
      } else {
        node = node.left;
      }
    }
    return null;
  }

  findNode(key: T): BSTNode<T> | null {
    let foundNode = null;
    for (const node of this.walk(key)) {
      if (node) foundNode = node;
    }
    return foundNode;
  }

  *walk(key: T): Generator<BSTNode<T> | null> {
    let node = this.root;
    while (node) {
      if (node.key === null) {
        yield null;
        break;
      }
      if (node.key === key) {
        yield node;
        break;
      } else if (node.key > key) {
        yield null;
        node = node.left;
      } else {
        yield null;
        node = node.right;
      }
    }
  }

  keys(lo: T | null = null, hi: T | null = null) {
    const q: T[] = [];
    this.traverse(this.root, q, lo, hi);
    return q;
  }

  traverse(
    node: BSTNode<T> | null = this.root,
    q: T[],
    lo: T | null,
    hi: T | null,
  ) {
    if (node == null) return;

    if (lo === null || lo <= node.key!) this.traverse(node.left, q, lo, hi);

    let shouldQ = true;
    if (lo !== null && lo > node.key!) shouldQ = false;
    if (shouldQ && hi !== null && hi < node.key!) shouldQ = false;

    if (shouldQ) {
      q.push(node.key!);
    }

    if (hi === null || hi >= node.key!) this.traverse(node.right, q, lo, hi);
  }
}
