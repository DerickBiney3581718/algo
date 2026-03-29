/**
 * implement heap
 * insert: lgn
 * delete: 0(lgn)
 * peek: max or min O(1)
 *
 */
export class Heap {
  array = [undefined];
  type = "min";
  rootIdx = 1;

  constructor(iterable, type = "min") {
    this.type = type;

    if (iterable.length) {
      this._initHeap(iterable);
    }

    return new Proxy(this, {
      get(target, method) {
        const idx = Number(method);
        if (isFinite(idx)) {
          return target.array[idx];
        } else if (method === "size") return target.array.length;
        return Reflect.get(target, method);
      },
    });
  }

  peek() {
    return this.array[1];
  }

  _initHeap(iterable) {
    // for (const key of iterable) {
    //   this.insert(key);
    // }

    this.array.push(...iterable);
    const len = this.array.length;
    const startIdx = Math.floor(len / 2) - 1;

    for (let idx = startIdx; idx > 0; idx--) {
      this._bubbleDown(idx);
    }
  }

  insert(key) {
    const idx = this.array.length;
    this.array.push(key);
    this._bubbleUp(idx);
  }

  get prioritized() {
    const peek = this.peek();
    this.delete(1);
    return peek;
  }

  child(parentIdx) {
    return parentIdx * 2 < this.array.length ? parentIdx * 2 : null;
  }

  inHeap(idx) {
    return idx < this.array.length;
  }
  search(val) {
    return this.array.findIndex((el) => el === val);
  }

  _bubbleUp(idx) {
    const parentIdx = Math.floor(idx / 2);
    if (parentIdx <= 0) return;

    const shouldBubbleUp = this._compareFn(idx, parentIdx);
    if (shouldBubbleUp) {
      const parent = this.array[parentIdx];
      const child = this.array[idx];
      this.array[parentIdx] = child;
      this.array[idx] = parent;
      this._bubbleUp(parentIdx);
    }
  }

  _bubbleDown(parentIdx) {
    const child1Idx = this.child(parentIdx);
    const child2Idx = child1Idx + 1;
    const len = this.array.length;

    const child1Exists = child1Idx < len;
    const child2Exists = child2Idx < len;

    if (!child1Exists && !child2Exists) return;
    if (
      this._compareFn(parentIdx, child1Idx) &&
      this._compareFn(parentIdx, child2Idx)
    )
      return;

    let maxChildIdx = null;
    if (child1Exists && child2Exists)
      maxChildIdx = this._compareFn(child1Idx, child2Idx)
        ? child1Idx
        : child2Idx;
    else {
      maxChildIdx = child1Exists ? child1Idx : child2Idx;
    }

    const parent = this.array[parentIdx];
    console.log("swapping : ", parent, "for : ", this.array[maxChildIdx]);
    this.array[parentIdx] = this.array[maxChildIdx];
    this.array[maxChildIdx] = parent;
    this._bubbleDown(maxChildIdx);
  }

  _compareFn(idx1, idx2) {
    switch (this.type) {
      case "min":
        return this.array[idx1] < this.array[idx2];
      default:
        return this.array[idx1] > this.array[idx2];
    }
  }

  delete(idx) {
    const len = this.array.length;
    if (idx >= len) return null;
    const lastItem = this.array[len - 1];
    this.array[idx] = lastItem; //TODO: Need to use dynamic array to maintain free slots so can reimplement to move the last element to deleted spot before bubble-down
    this.array[len - 1] = undefined;
    this._bubbleDown(idx);
  }

  toString() {
    return this.array.toString();
  }
}

// const heap1 = new Heap([3, 8103, 1000, 5, 21, 90, 8102]);
// console.log(heap1);

// const sample = heap1.search(5);
// if (sample > 0) heap1.delete(sample);
// console.log(heap1[1]);
