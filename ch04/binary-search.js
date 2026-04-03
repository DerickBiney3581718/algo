function binarySearch(list, search, low, high) {
  const newHigh = high ?? list.length - 1;
  const newLow = low ?? 0;

  const mid = Math.floor((newHigh + newLow) / 2);

  if (newHigh < newLow) return -1;
  const midItem = list[mid];

  if (midItem === search) return mid;
  else if (midItem > search) return binarySearch(list, search, newLow, mid - 1);
  else return binarySearch(list, search, mid + 1, newHigh);
}

const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 102];
console.log(binarySearch(list, 102));
