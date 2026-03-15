function selectionSort(someList) {
  const listSize = someList.length;

  for (let idx = 0; idx < listSize; idx++) {
    for (let j = idx + 1; j < listSize; j++) {
      let temp = someList[idx];
      const currNumber = someList[j];
      if (currNumber < temp) {
        someList[idx] = someList[j];
        someList[j] = temp;
      }
    }
  }

  return someList;
}

const someList = [2, 4, 5, 1, 90, 6, 10];
console.log("starting fn--------list:", someList);
const sortedList = selectionSort(someList);
console.log("sorted list: ", sortedList);
