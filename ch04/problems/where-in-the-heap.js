/**
 *
 *Problem: Given an array-based heap on n elements and a real number x, efficiently
 *determine whether the kth smallest element in the heap is greater than or equal
 *to x. Your algorithm should be O(k) in the worst-case, independent of the size of
 *the heap. Hint: you do not have to find the kth smallest element; you need only
 *determine its relationship to x.
 */

import { Heap } from "../heap.js";
// As long as there k or more elements less than x ||  the entire heap gets exhausted : return false
// if there are less than k elements greater than x, meaning the left over elements which includes the kth are all greater than or equal to x :  return true

function isKthGreaterThanOrEqualTo(heap, kCount, x, idx) {
  function numberOfGreaterThanOrEqualTo(heap, kCount, x, idx) {
    const rootIdx = idx ?? heap.rootIdx;

    if (kCount <= 0 || rootIdx >= heap.size) return kCount;

    if (heap[rootIdx] < x) {
      kCount--;

      const leftChildIdx = heap.child(rootIdx);

      if (leftChildIdx) {
        kCount = numberOfGreaterThanOrEqualTo(heap, kCount, x, leftChildIdx);
        const rightChildIdx = leftChildIdx + 1;

        if (heap.inHeap(rightChildIdx)) {
          kCount = numberOfGreaterThanOrEqualTo(heap, kCount, x, rightChildIdx);
        }
      }
    }

    return kCount;
  }

  const remaining = numberOfGreaterThanOrEqualTo(heap, kCount, x, idx);
  return remaining > 0;
}

const heap1 = new Heap([3, 5, 90, 8103, 21, 1000, 8102]);
console.log(heap1);

console.log(isKthGreaterThanOrEqualTo(heap1, 6, 8103));
