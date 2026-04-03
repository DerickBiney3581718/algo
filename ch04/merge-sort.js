// Mergesort(A[(1, n)]);
// Merge(MergeSort(A[(1, n / 2)]), MergeSort(A[(n / 2 + 1, n)]));

// TODO: REwrite to use indices and passing only the original array around
function mergeSort(list, low, mid, high) {
  if (list.length <= 1) return list;

  const med = Math.floor(list.length / 2);
  return merge(mergeSort(list.slice(0, med)), mergeSort(list.slice(med)));
}

function merge(list1, list2) {
  console.log("merging...", list1, list2);

  const mergeList = [];
  const list1Len = list1.length;
  const list2Len = list2.length;

  let idx1 = 0;
  let idx2 = 0;

  while (true) {
    const isList2Empty = idx2 >= list2Len;
    const isList1Empty = idx1 >= list1Len;

    if (!isList1Empty && !isList2Empty) {
      if (list1[idx1] < list2[idx2]) {
        mergeList.push(list1[idx1]);
        idx1 += 1;
      } else {
        mergeList.push(list2[idx2]);
        idx2 += 1;
      }
    } else if (!isList1Empty) {
      mergeList.push(...list1.slice(idx1));
      break;
    } else {
      mergeList.push(...list2.slice(idx2));
      break;
    }
  }
  return mergeList;
}

const unsorted = [2, 8, 5, 3, 9, 4, 1, 7];
console.log(mergeSort(unsorted));
