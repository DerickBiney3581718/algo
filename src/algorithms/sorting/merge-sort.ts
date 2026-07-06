export function mergeSort<T extends number | string>(
  list: T[],
  hi: number = list.length - 1,
  lo: number = 0,
): void {
  const mid = lo + Math.floor((hi - lo) / 2);

  if (hi <= lo) return;

  mergeSort(list, mid, lo);
  mergeSort(list, hi, mid + 1);

  return merge(list, lo, mid, hi);
}

function merge<T extends number | string>(
  list: T[],
  lo: number,
  mid: number,
  hi: number,
) {
  let leftCounter = lo;
  let rightCounter = mid + 1;

  const auxList: T[] = list.slice(lo, hi + 1);
  for (let idx = lo; idx <= hi; idx++) {
    //
    if (leftCounter > mid) list[idx] = auxList[rightCounter++ - lo];
    else if (rightCounter > hi) list[idx] = auxList[leftCounter++ - lo];
    else if (auxList[leftCounter - lo] > auxList[rightCounter - lo])
      list[idx] = auxList[rightCounter++ - lo];
    else list[idx] = auxList[leftCounter++ - lo];
  }
}
