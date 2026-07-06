/**
 * pick a random number, use as pivot, move other numbers to its left or right
 * @param list
 */

import { swap } from "./shell-sort";

function quickSort<T extends string | number>(
  list: T[],
  lo: number = 0,
  hi: number = list.length - 1,
) {
  // find pivot
  if (lo >= hi) return;

  let pivotIdx = Math.floor(Math.random() * (hi + 1));
  const pivotVal = list[pivotIdx];

  //   put pivot value at the end
  swap(list, pivotIdx, hi);

  //   set the moving pivot
  let movingPivotIdx = lo;

  for (let idx = lo; idx < hi; idx++) {
    const currVal = list[idx];
    // move mp after swapping lower values with higher in
    if (currVal <= pivotVal && idx >= movingPivotIdx) {
      swap(list, idx, movingPivotIdx);
      movingPivotIdx++;
    }
  }
  // swap pivot to its sorted position
  swap(list, hi, movingPivotIdx);

  quickSort(list, lo, movingPivotIdx - 1);
  quickSort(list, movingPivotIdx + 1, hi);
}

const list = "HIPPOPOTAMUS".split("");
quickSort(list);
console.log("list: ", list);
