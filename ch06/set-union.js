export class SetUnion {
  constructor(elements) {
    this.init(elements);
  }

  init(elements) {
    if (!elements || elements.length == 0) return;
    if (!this.setsMap) this.setsMap = new Map();

    for (let el of elements) {
      this.setsMap.set(el, [el, 1]);
    }
  }

  getParent(el) {
    if (this.setsMap.has(el)) {
      const set = this.setsMap.get(el);
      return set?.[0];
    }
  }

  setParent(el, parent) {
    if (this.setsMap.has(el)) {
      const elSet = this.setsMap.get(el);
      this.setsMap.set(el, [parent, elSet[1]]);
    }
  }

  incSet(el, size) {
    if (this.setsMap.has(el)) {
      const elSet = this.setsMap.get(el);
      this.setsMap.set(el, [elSet[0], elSet[1] + size]);
    }
  }

  find(el) {
    let curr = el;
    let parent = this.getParent(curr);
    while (parent !== curr) {
      curr = parent;
      parent = this.getParent(parent);
    }
    return curr;
  }

  getSize(el) {
    if (this.setsMap.has(el)) return this.setsMap.get(el)?.[1];
  }

  union(elX, elY) {
    const rootX = this.find(elX);
    const rootY = this.find(elY);

    const sizeX = this.getSize(rootX);
    const sizeY = this.getSize(rootY);

    if (rootX === rootY) return;
    const [parent, child, size] =
      sizeX > sizeY ? [rootX, rootY, sizeY] : [rootY, rootX, sizeX];
    this.setParent(child, parent);
    this.incSet(parent, size);
  }

  same_component(elX, elY) {
    return this.find(elX) === this.find(elY);
  }
}

const setU = new SetUnion([1, 2, 3]);
setU.union(1, 3);
setU.union(3, 2);
console.log("loggin...setU", setU);
