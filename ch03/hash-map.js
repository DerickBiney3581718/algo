class HashMap {
  α = 26; //size of the alphabet
  size = 27644437; //hash table size using a prime number to reduce collisions
  array = Array.from({ length: this.size });

  constructor(values, hashFunc) {
    if (typeof hashFunc === "function") this._hashFn = hashFunc;
    for (const [key, value] of values) {
      this.insert(key, value);
    }
  }

  _hashFn(value) {
    // const strLen = value.length;

    // const hashInt = Array.from(value).reduce((prev, curr, currIdx) => {
    //   const char = String(curr).codePointAt(0);
    //   const posMux = this.α ** (strLen - currIdx);
    //   return prev + posMux * char; //position-value system
    // }, 0);

    // return hashInt % this.size;

    //! from 3_4. using direct addressing for finite integer set of keys
    return value;
  }

  insert(key, value) {
    const hashedKey = this._hashFn(key);
    this.array[hashedKey] = [key, value];
  }

  search(key) {
    const hashKey = this._hashFn(key);
    return this.array?.[hashKey]?.[1];
  }

  delete(key) {
    const foundKey = this.search(key);

    if (!foundKey) return;
    const hashedKey = this._hashFn(key);
    this.array[hashedKey] = undefined;
  }
  toString() {
    return Object.fromEntries(this.array.filter((el) => !!el));
  }
}

const hashMap1 = new HashMap([
  [1, "value"],
  [2, "me"],
]);
hashMap1.insert(3, "milky way");
hashMap1.insert(4, "the sun");
hashMap1.insert(5, "milky way");

console.log("searching ", "6", "got :  ", hashMap1.search(6));
console.log("searching ", "1", "got : ", hashMap1.search(1));
hashMap1.delete(1);
console.log(hashMap1.toString());
