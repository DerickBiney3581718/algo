/**
 * BINARY SEARCH TREE
 * search
 * insert
 * delete
 * min
 * max
 * TODO: successor
 * TODO: predecessor
 */

class BSTNode {
  constructor(val, parent) {
    this.value = val;
    this.left = null;
    this.right = null;
    this.parent = parent;
  }
}

class BSTree {
  size = 0;

  constructor(...values) {
    this.root = null;
    if (values.length > 0) {
      this._createInitTree(values);
    }
  }

  max(node = this.root) {
    if (node.right === null) return node;
    else return this.max(node.right);
  }

  min(node = this.root) {
    if (node.left === null) return node;
    else return this.min(node.left);
  }

  search(val, node = this.root) {
    if (node === null) return null;
    if (node.value === val) return node;

    if (val > node.value) {
      return this.search(val, node.right);
    } else {
      return this.search(val, node.left);
    }
  }

  insert(val) {
    this._attachBSTNode(val, this.root);
    return this;
  }

  delete(val) {
    // todo: handle possible duplicate vals
    const found = this.search(val);
    if (!found) return;
    let parent;
    const hasParent = found.parent;

    if (!hasParent) {
      parent = new BSTNode();
      parent.left = found;
      this.root = parent;
    } else parent = found.parent;

    const isLeftChild = parent.left === found;

    // ?case 1: has no kids
    if (!found.left && !found.right) {
      if (isLeftChild) parent.left = null;
      else parent.right = null;
    } else if (found.left && found.right) {
      // ?case 2: has two kids
      console.log("has two kids");
      const smallestRight = this.min(found.right);
      const smallestRightParent = smallestRight.parent;
      smallestRightParent.left = null;

      if (isLeftChild) parent.left = smallestRight;
      else parent.right = smallestRight;
    } else {
      //?case 3: hass one child
      console.log("has one kid");
      if (isLeftChild) {
        if (found.left) parent.left = found.left;
        else parent.left = found.right;
      } else {
        if (found.left) parent.right = found.left;
        else parent.right = found.right;
      }
    }

    if (!hasParent) {
      found.parent = null;
      this.root = found;
    }
    this.size -= 1;
    return this;
  }
  _createInitTree(values) {
    for (let val of values) {
      if (this.root == null) {
        this.root = new BSTNode(val);
        this.size += 1;
      } else {
        this._attachBSTNode(val, this.root);
      }
    }
  }

  _attachBSTNode(val, parent) {
    if (val > parent.value) {
      if (parent.right) this._attachBSTNode(val, parent.right);
      else {
        const child = new BSTNode(val);
        child.parent = parent;
        parent.right = child;

        this.size += 1;
      }
    } else {
      if (parent.left) this._attachBSTNode(val, parent.left);
      else {
        const child = new BSTNode(val);
        child.parent = parent; // TODO: with weakmaps
        parent.left = child;
        this.size += 1;
      }
    }
  }

  toString() {
    const lines = Array.from({ length: this.size * 2 - 1 }).map(() =>
      " ".repeat(this.size * 4 + 1).split(""),
    );

    const printLine = this.createPrintLine(lines);
    this._traverse(printLine);

    return lines.map((line) => line.join("")).join("\n");
  }

  _traverse(
    callback,
    node = this.root,
    depth = 0,
    isLeft = false,
    strategy = "in-order",
  ) {
    if (strategy === "in-order") {
      callback(node, depth, isLeft);

      if (node?.left) this._traverse(callback, node?.left, depth + 1, true);

      if (node?.right) this._traverse(callback, node?.right, depth + 1);
    }
  }

  createPrintLine(lines) {
    const size = this.size;
    function _printLine(node, depth, isLeft) {
      if (!node || node?.value === null) return;
      if (!lines) return;

      const adjustedPadding = size * 2 + depth * (isLeft ? -2 : 2);
      const lineIdx = depth * 2;
      const line = lines[lineIdx];

      if (line) line[adjustedPadding] = node.value;

      const nextLine = lines[lineIdx + 1];
      if (nextLine) {
        nextLine[adjustedPadding - 1] = node.left ? "/" : " ";
        nextLine[adjustedPadding + 1] = node.right ? `\\` : " ";
      }
    }
    return _printLine;
  }
}

const t1 = new BSTree(4, 2, 7, 10, 1);
// console.log(t1.toString());
// console.log(Object.__proto__.constructor === BSTree);
// console.log("max:", t1.max());
// console.log("min: ", t1.min());
console.log("searching 2: ", t1.search(10));
// console.log("deleting 2: ");
// t1.delete(2);
console.log("insert 3,8:", t1.insert(3).insert(8));
console.log("deleting 2: ");
t1.delete(2);
console.log(
  JSON.stringify(t1, (key, val) => (key === "parent" ? undefined : val)),
);
console.log(t1.toString());

// {"size":8,"root":{"value":4,"left":{"value":2,"left":{"value":1,
// "left":null,"right":null},"right":{"value":3,"left":null,"right"
// :null}},"right":{"value":7,"left":null,"right":{"value":10,"left
// ":{"value":8,"left":null,"right":null},"right":null}}}}
