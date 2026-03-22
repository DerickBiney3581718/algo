// 5] We have seen how dynamic arrays enable arrays to grow while still achieving
// constant-time amortized(averaged across time) performance. This problem concerns extending dynamic
// arrays to let them both grow and shrink on demand.
//? (a) Consider an underflow strategy that cuts the array size in half whenever the
//? array falls below half full. Give an example sequence of insertions and deletions
//? where this strategy gives a bad amortized cost.
// soln: at the half point, repeated operations: insert, delete.
//
//? (b) Then, give a better underflow strategy than that suggested above, one that
//? achieves constant amortized cost per deletion.
// soln: shrink to 1/2 when 3/4 of array is empty.

class DynamicArray {
  size = 0;
  idx = 0;
  array = [];

  constructor(size, values) {
    this.size = size;
    this.initArray(this.size);

    if (values) {
      values.slice(0, this.size).forEach((el, idx) => {
        this.array[idx] = el;
        this.idx = idx;
      });
      this.idx++;
    }

    return new Proxy(this, {
      get(obj, key) {
        if (typeof key !== "symbol") {
          const coercedNum = Number(key);
          if (Number.isInteger(coercedNum)) return obj.array[parseInt(key)];
        }

        return Reflect.get(...arguments);
      },
    });
  }

  insert(val) {
    if (!this.size) {
      this.initArray(2);
      this.array[0] = val;
    } else {
      if (this.idx < this.size) this.array[this.idx] = val;
      else {
        this.initArray(this.size * 2);
        this.array[this.idx] = val;
      }
    }
    this.idx += 1;
    return this;
  }

  delete(idx) {
    if (idx >= this.size) return null;
    this.array = [...this.array.slice(0, idx), ...this.array.slice(idx + 1)];
    this.array.push(undefined);
    --this.idx;

    const shouldHalf = this.size ? this.idx / this.size < 0.25 : false;
    console.log("should half", idx, shouldHalf, this.array);
    if (shouldHalf) {
      this.array = this.array.slice(0, Math.floor(this.size / 2));
    }
    return this;
  }

  initArray(size) {
    const newArr = Array.from({ length: size });
    this.array.forEach((el, idx) => (newArr[idx] = el));
    this.array = newArr;
    this.size = size;
  }
  toString() {
    return this.array;
  }

  [Symbol.iterator]() {
    let idx = 0;
    const array = this.array;
    const size = this.size;

    function next() {
      if (idx === size) return { value: undefined, done: true };
      const value = array[idx];
      idx++;

      return { value, done: false };
    }
    return { next };
  }
}

const someList = new DynamicArray(5, [0, 2, 3, 4, 5, 7, 9]);
console.log(someList, someList[0]);
console.log(someList.insert(4).insert(7).insert(2).delete(0).delete(1));
for (let val of someList) {
  console.log("logging: ", val);
}
console.log(someList[1]);
