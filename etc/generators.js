/**
 * generator functions return special iterators(generators)
 * that pause execution right before yield
 * @param {*} start
 * @param {*} end
 * @param {*} step
 * @returns
 */
function* makeRangeIterator(start, end, step) {
  let iterationCount = 0;
  for (let index = start; index < end; index += step) {
    iterationCount++;
    yield index;
  }
  return iterationCount;
}

const iter = makeRangeIterator(1, 10, 2);

console.log("iter: ", iter);

let result = iter.next();
while (!result.done) {
  console.log(result.value); // 1 3 5 7 9
  result = iter.next();
}

console.log("Iterated over sequence of size:", result.value);
