function insertionSort(someList) {
  const someListLen = someList.length;

  for (let idx = 1; idx < someListLen; idx++) {
    const thresholdVal = someList[idx];
    let pin = idx - 1;

    while (pin >= 0 && someList[pin] > thresholdVal) {
      someList[pin + 1] = someList[pin];
      pin -= 1;
    }
    someList[pin + 1] = thresholdVal;
  }

  return someList;
}

const someList = [5, 2, 4, 6, 1, 3];
console.log("sorting...", someList);
console.log("sorted: ", insertionSort(someList));
