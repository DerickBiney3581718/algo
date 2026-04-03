/**
 * A randomized quicksort algo runs on avg nlogn time, on any input, with high probability
 * pick a random pivot
 * sort all less to left, all greater to right
 * repeat for both partitions
 */

function partition(list, low, high) {
  // returns pivot position
  const randPivot = Math.floor(low + Math.random() * (high - low + 1));

  // swap rand pivot value with last value
  const pivotValue = list[randPivot];
  const highVal = list[high];
  list[high] = pivotValue;
  list[randPivot] = highVal;

  let truePivot = low;
  let counter = low;

  while (counter <= high) {
    const currVal = list[counter];

    if (currVal < pivotValue) {
      const truePivotVal = list[truePivot];
      list[truePivot] = currVal;
      list[counter] = truePivotVal;
      truePivot++;
    }
    counter++;
  }
  //swap back rand pivot value to true pivot point
  const truePivotVal = list[truePivot];
  list[truePivot] = pivotValue;
  list[high] = truePivotVal;
  return truePivot;
}

function quickSort(list, low = 0, high = list.length - 1) {
  if (low <= high) {
    const pivot = partition(list, low, high);
    quickSort(list, low, pivot - 1);
    quickSort(list, pivot + 1, high);
  }
  return list;
}

const list1 = [2, 8, 5, 3, 9, 4, 1, 7];
console.log(quickSort(list1));

// !imp 1
// function quickSort(list, low, upper) {
//   if (low >= upper) return list;

//   console.log(list, low, upper);

//   let upperIdx = upper ?? list.length - 1;
//   let lowerIdx = low ?? 0;
//   const pivot = Math.floor(Math.random() * (upperIdx + 1));

//   let leftShiftCount = 0;
//   let rightShiftCount = 0;

//   const pivotNumber = list[pivot];

//   while (lowerIdx < pivot || upperIdx > pivot) {
//     let leftNumber = list[lowerIdx];
//     let rightNumber = list[upperIdx];

//     console.log(pivot, lowerIdx, upperIdx);
//     if (lowerIdx < pivot && upperIdx > pivot) {
//       if (leftNumber > pivotNumber && rightNumber < pivotNumber) {
//         // swap
//         console.log("swapping: ", leftNumber, rightNumber);
//         list[lowerIdx] = rightNumber;
//         list[upperIdx] = leftNumber;
//         upperIdx--;
//         lowerIdx++;
//       } else if (leftNumber > pivotNumber) {
//         upperIdx--;
//       } else lowerIdx++;
//     } else if (lowerIdx < pivot) {
//       if (leftNumber > pivotNumber) {
//         list.splice(lowerIdx, 1);
//         list.push(leftNumber);
//         leftShiftCount++;
//         console.log("increase left shift, push: ", leftNumber, "into : ", list);
//       } else lowerIdx++;
//     } else {
//       if (rightNumber < pivotNumber) {
//         list.splice(upperIdx, 1);
//         list.unshift(rightNumber);
//         rightShiftCount++;
//         console.log(
//           "increase right shift, unshift: ",
//           rightNumber,
//           "into : ",
//           list,
//         );
//       } else upperIdx--;
//     }
//   }

//   const shiftedPivot = pivot - leftShiftCount + rightShiftCount;
//   console.log("shifted pivot: ", shiftedPivot);
//   quickSort(list, low, shiftedPivot);
//   quickSort(list, shiftedPivot, upper);
//   return list;
// }
