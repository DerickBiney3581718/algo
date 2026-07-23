/**
 * A 2-3 search tree can have null, 2-node or 3-node
 * Maintaining balance on insertion:
 * 1. null -> 2-node,
 * 2. 2-node -> 3-node,
 * 3. 3-node -> 2-node + pass up the mid key recursively
 * Used to improve the worst-case perf of a bst
 * Normally, implemented using a red-black tree for lower overhead
 */

import type { NonNullComparable } from "../../types/dsa";
import { BST, BSTNode } from "./BinarySearchTree";

/**
 * subtree, node
 */
class Node<T extends NonNullComparable> extends BSTNode<T> {
  isRed: boolean; //part of a 3-node if true
  parent: Node<T> | null = null;
  left: Node<T> | null = null;
  right: Node<T> | null = null;

  constructor(key: T, value: T, isRed: boolean = false) {
    super(key, value);
    this.value = value;
    this.key = key;
    this.isRed = isRed;
  }

  updateSize(): void {
    this.size = (this.left?.size ?? 0) + (this.right?.size ?? 0) + 1;
  }
  get min(): Node<T> | null {
    let minNode: Node<T> = this;
    while (minNode.left) minNode = minNode.left;
    return minNode;
  }

  get max(): Node<T> | null {
    let maxNode: Node<T> = this;
    while (maxNode.right) maxNode = maxNode.right;
    return maxNode;
  }
}

/**
 * To have 1:1 correspondence with 2-3 trees
 * 1. Left-lean rb tree. all red links link to a left child
 * 2. No node has two red links
 * 3. perfect black balance
 */
export class RBBst<T extends NonNullComparable> extends BST<T> {
  root: Node<T> | null = null;
  size: number = 0;

  /**
   *
   * @param parent
   * Make parent the left child of right child
   * Modify their sizes
   */
  leftRotate(parent: Node<T>): Node<T> {
    const right = parent.right;
    if (right === null) return parent;
    const grandParent = parent.parent;

    parent.right = right.left;
    if (right.left !== null) right.left.parent = parent;

    right.left = parent;
    parent.parent = right;

    right.parent = grandParent;
    if (grandParent === null) this.root = right;
    else if (grandParent.left === parent) grandParent.left = right;
    else grandParent.right = right;

    right.isRed = parent.isRed;
    parent.isRed = true;

    // modify sizes; order matters
    parent.updateSize();
    right.updateSize();

    return right;
  }

  /**
   *
   * @param parent
   * Make parent the right child of their left child
   * modify sizes
   */
  rightRotate(parent: Node<T>): Node<T> {
    const left = parent.left;
    if (left === null) return parent;
    const grandParent = parent.parent;

    // attach left.right <-> parent
    parent.left = left.right;
    if (left.right !== null) left.right.parent = parent;

    // attach  parent <-> left
    left.right = parent;
    parent.parent = left;

    // attach left <-> grandparent
    left.parent = grandParent;
    if (grandParent === null) this.root = left;
    else if (grandParent.left === parent) grandParent.left = left;
    else grandParent.right = left;

    // maintain parent's colors
    left.isRed = parent.isRed;
    parent.isRed = true;

    parent.updateSize();
    left.updateSize();

    return left;
  }

  put(key: T, value: T): void {
    this.root = this._put(this.root, key, value);
    this.root.isRed = false; // root should always be black
  }

  private _put(node: Node<T> | null, key: T, value: T): Node<T> {
    if (node === null) return new Node(key, value, true);
    else if (node.key === key) {
      node.value = value;
    } else if (node.key > key) {
      const left = this._put(node.left, key, value);
      node.left = left;
      left.parent = node;
    } else {
      const right = this._put(node.right, key, value);
      node.right = right;
      right.parent = node;
    }

    node = this.balance(node);
    // updating sizes incase this is an unrotated node whose children might have resized
    node.updateSize();
    return node;
  }

  balance(node: Node<T>): Node<T> {
    // left == BLACK && right == RED
    if (!this._isRed(node.left) && this._isRed(node.right))
      node = this.leftRotate(node);
    if (this._isRed(node.left) && this._isRed(node.left?.left))
      node = this.rightRotate(node);
    if (this._isRed(node.left) && this._isRed(node.right))
      this.flipColors(node);
    return node;
  }

  /**
   *
   * @param key
   * Using the top-down approach to prevent leaving a null node and affecting the black balance
   * The invariant that has to be maintained in every node is that the left node is not a 2-node.
   */
  delete(key: T): void {
    this.root = this._delete(this.root, key);
    if (this.root) this.root.isRed = false;
  }

  private _delete(node: Node<T> | null, key: T): Node<T> | null {
    if (node === null) return null;
    if (node.key > key) {
      if (node.left && this.isTwoNode(node.left)) {
        // parent is red cause a three 2-node can only exist cos the middle got promoted to a parent && no 2 red links
        node = this._borrowRight(node);
      }

      node.left = this._delete(node.left, key);
    } else {
      // node.key <= key
      if (this._isRed(node.left)) node = this.rightRotate(node);
      if (node.key === key && node.right === null) {
        // from case 1: either node is now left which makes right null not possible. So, left is black, node has not changed and if right is null, then left is actually null(nill)node. does this is the no children case
        return null;
      }
      if (node.right && this.isTwoNode(node.right))
        node = this._borrowLeft(node);
      if (node.key === key && node.right !== null) {
        const rightMin = node.right.min!;
        node.value = rightMin?.value;
        node.key = rightMin?.key;

        node.right = this._delete(node.right, rightMin.key);
      } else node.right = this._delete(node.right, key);
    }
    node = this.balance(node);
    node.updateSize();
    return node;
  }

  private _borrowRight(node: Node<T>): Node<T> {
    this.flipColors(node); // merge down the parent, we might not have a right 3-node
    let newRight = node;
    if (node.right && node.right.left && this._isRed(node.right.left)) {
      newRight = this.rightRotate(node.right);
      this.leftRotate(node);
      this.flipColors(newRight);
    }
    return newRight; //return new current node/root of the subtree
  }

  private _borrowLeft(node: Node<T>): Node<T> {
    this.flipColors(node); // merge down the parent
    let newLeft = node;
    if (node.left && node.left.left && this._isRed(node.left.left)) {
      newLeft = this.rightRotate(node); //?
      this.flipColors(newLeft);
    }
    return newLeft;
  }

  private isTwoNode(node: Node<T>): boolean {
    return !this._isRed(node) && !this._isRed(node.left);
  }

  isLeftChild(parent: Node<T>, child: Node<T>): boolean {
    return parent.key >= child.key;
  }

  _isRed(node?: Node<T> | null): boolean {
    return node != null && node.isRed;
  }

  /**
   * flipping is only done under two condition:
   * 1. breaking of a 4-node post-insertion
   * 2. merging of the parent into a 3-node or 4-node
   * @param parent
   */
  private flipColors(parent: Node<T>): void {
    parent.isRed = !parent.isRed; // make mid part of a 3-node
    if (parent.right) parent.right.isRed = !parent.right.isRed;
    if (parent.left) parent.left.isRed = !parent.left.isRed;
  }
}
