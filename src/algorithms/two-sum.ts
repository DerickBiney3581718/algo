// Consider the easier problem of determining the number of pairs of
// integers in an input file that sum to 0.
// list : [1,2,3,4,5]

import { binarySearch } from "./binary-search";

interface IZeroSum {
  (list: number[]): number;
}

const twoSum: IZeroSum = (list) => {
  let zeroSums = 0;
  for (let idx1 = 0; idx1 < list.length; idx1++) {
    for (let idx2 = idx1 + 1; idx2 < list.length; idx2++) {
      const sum = list[idx1] + list[idx2];
      if (sum === 0) zeroSums++;
    }
  }
  return zeroSums;
};

// Can be improved with mergesort and binary search
// sort and find the negated number

const twoSumFast: IZeroSum = (list) => {
  const sortedList = list.toSorted();
  let zeroSums = 0;
  for (let idx = 0; idx < sortedList.length; idx++) {
    const result = binarySearch(list, list[idx]);
    if (result !== -1) zeroSums++;
  }
  return zeroSums;
};

const threeSumFast: IZeroSum = (list) => {
  let zeroSums = 0;

  for (let idx1 = 0; idx1 < list.length; idx1++) {
    for (let idx2 = idx1 + 1; idx2 < list.length; idx2++) {
      const sum = list[idx1] + list[idx2];
      const result = binarySearch(list, -sum);
      if (result !== -1) zeroSums++;
    }
  }
  return zeroSums;
};
