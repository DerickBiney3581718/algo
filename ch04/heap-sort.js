import { Heap } from "./heap.js";

/**
 * implement heap sort using heap implementation
 * @param {*} iterable
 * @param {*} order
 */
function heapSort(iterable, order = "asc") {
  const type = order === "asc" ? "min" : "max";
  const heap = new Heap([...iterable], type);
  console.log("init heap: ", heap);

  for (const idx of Object.keys(iterable)) {
    iterable[idx] = heap.prioritized;
  }
}

const someArr = [3, 8103, 1000, 5, 21, 90, 8102];
heapSort(someArr);
console.log(someArr);
