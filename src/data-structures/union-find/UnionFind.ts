// union find: dynamic connectivity
// Array<(int, int)>; sequence of edges
// p and q are connected means: symmetrical, transitive, and reflexive.
// therefore they have the same equivalence class or belong to the same (connected) component
//  initialize,
//  add a connection between two sites,
//  identify the component containing a site,
//  determine whether two sites are in the same component,
//  and count the number of components.

/**
 * Weight quick union find
 */
class UnionFind {
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

  /**
   * naive union is the bottle-neck. Having to loop over entire sites. Meaning for a completely connected component, we get quadratic time
   * @param x
   * @param y
   */
  unionize(x: number, y: number) {
    const xRoot = this.find(x);
    const yRoot = this.find(y);
    if (xRoot && yRoot && !this.isSame(x, y)) {
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
