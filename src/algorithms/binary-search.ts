export function binarySearch<T>(
  arr: T[],
  searchVal: T,
  high: number = arr.length - 1,
  low: number = 0,
): number {
  if (low > high) return -1;
  const mid = Math.ceil((high + low) / 2);

  if (arr[mid] === searchVal) return mid;
  else if (arr[mid] > searchVal) high = mid - 1;
  else low = mid + 1;
  return binarySearch(arr, searchVal, high, low);
}
