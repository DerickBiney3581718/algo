export class UnionFind {
  /**
   * parent-link representation of a forest (set) of trees.
   * @property siteArr
   */
  private siteArr: number[] = [];
  private siteCounts: number[] = [];

  private counter: number = 0;

  constructor(sites: number) {
    for (let idx = 0; idx < sites; idx++) {
      this.siteArr[idx] = idx;
      this.siteCounts[idx] = 1;
    }
    this.counter = sites;
  }

  unionize(x: number, y: number) {
    const xRoot = this.find(x);
    const yRoot = this.find(y);
    if (xRoot !== yRoot) {
      if (this.siteCounts[xRoot] > this.siteCounts[yRoot]) {
        this.siteArr[yRoot] = xRoot;
        this.siteCounts[xRoot] += this.siteCounts[yRoot];
      } else {
        this.siteArr[xRoot] = yRoot;
        this.siteCounts[yRoot] += this.siteCounts[xRoot];
      }
      this.counter--;
    }
  }

  /**
   * @param id
   * @returns
   */
  find(id: number) {
    return this._find_parent(id);
  }

  private _find_parent(id: number): number {
    const parentId = this.siteArr[id];
    if (parentId === id) return id;
    else return this._find_parent(parentId);
  }

  isSame(x: number, y: number): boolean {
    const xRoot = this.find(x);
    const yRoot = this.find(y);

    return xRoot !== undefined && yRoot !== undefined && xRoot === yRoot;
  }

  get components() {
    return this.counter;
  }
}
