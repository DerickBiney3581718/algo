import { describe, expect, it } from "vitest";
import { UnionFind } from "./UnionFind";

describe("UnionFind", () => {
  describe("construction", () => {
    it("starts with every site in its own component", () => {
      const uf = new UnionFind(10);
      expect(uf.components).toBe(10);
    });

    it("makes every site its own root", () => {
      const uf = new UnionFind(10);
      for (let i = 0; i < 10; i++) expect(uf.find(i)).toBe(i);
    });

    it("is reflexive: every site is connected to itself", () => {
      const uf = new UnionFind(10);
      for (let i = 0; i < 10; i++) expect(uf.isSame(i, i)).toBe(true);
    });

    it("starts with no two distinct sites connected", () => {
      const uf = new UnionFind(6);
      for (let i = 0; i < 6; i++) {
        for (let j = i + 1; j < 6; j++) expect(uf.isSame(i, j)).toBe(false);
      }
    });
  });

  describe("unionize", () => {
    it("connects two sites", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      expect(uf.isSame(1, 2)).toBe(true);
    });

    it("decrements the component count", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      expect(uf.components).toBe(9);
    });

    it("is symmetric", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      expect(uf.isSame(2, 1)).toBe(true);
    });

    it("is transitive", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      uf.unionize(2, 3);
      expect(uf.isSame(1, 3)).toBe(true);
    });

    it("is idempotent — re-unioning a connected pair changes nothing", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      const before = uf.components;
      uf.unionize(1, 2);
      uf.unionize(2, 1);
      expect(uf.components).toBe(before);
    });

    it("does not merge unrelated components", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      uf.unionize(3, 4);
      expect(uf.isSame(1, 3)).toBe(false);
      expect(uf.isSame(2, 4)).toBe(false);
      expect(uf.components).toBe(8);
    });

    it("merges two multi-site components in one call", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      uf.unionize(3, 4);
      uf.unionize(2, 3);
      for (const [a, b] of [
        [1, 3],
        [1, 4],
        [2, 4],
      ])
        expect(uf.isSame(a, b)).toBe(true);
      expect(uf.components).toBe(7);
    });

    it("collapses to a single component when everything is joined", () => {
      const uf = new UnionFind(10);
      for (let i = 1; i < 10; i++) uf.unionize(0, i);
      expect(uf.components).toBe(1);
    });

    it("attaches the smaller tree to the larger root (weighting)", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 2);
      uf.unionize(3, 4);
      uf.unionize(1, 3); // one 4-site component
      const bigRoot = uf.find(1);

      uf.unionize(5, 1); // singleton joins the big component
      expect(uf.find(5)).toBe(bigRoot);
    });
  });

  describe("site 0", () => {
    // Site 0 is its own root, and 0 is falsy — the classic trap for
    // `if (root)` style guards.
    it("connects site 0 to another site", () => {
      const uf = new UnionFind(10);
      uf.unionize(0, 1);
      expect(uf.isSame(0, 1)).toBe(true);
    });

    it("counts a union involving site 0", () => {
      const uf = new UnionFind(10);
      uf.unionize(0, 1);
      expect(uf.components).toBe(9);
    });

    it("connects site 0 transitively", () => {
      const uf = new UnionFind(10);
      uf.unionize(0, 1);
      uf.unionize(1, 2);
      expect(uf.isSame(0, 2)).toBe(true);
    });

    it("merges a component whose root happens to be 0", () => {
      const uf = new UnionFind(10);
      uf.unionize(1, 0); // root may settle on 0
      uf.unionize(2, 3);
      uf.unionize(0, 2);
      expect(uf.isSame(1, 3)).toBe(true);
      expect(uf.components).toBe(7);
    });
  });

  describe("tinyUF (Sedgewick's fixture)", () => {
    // 10 sites, 11 pairs, 2 components:
    //   {3,4,8,9} and {0,1,2,5,6,7}
    const pairs: [number, number][] = [
      [4, 3],
      [3, 8],
      [6, 5],
      [9, 4],
      [2, 1],
      [8, 9],
      [5, 0],
      [7, 2],
      [6, 1],
      [1, 0],
      [6, 7],
    ];
    const build = () => {
      const uf = new UnionFind(10);
      for (const [p, q] of pairs) uf.unionize(p, q);
      return uf;
    };

    it("ends with 2 components", () => {
      expect(build().components).toBe(2);
    });

    it("groups {3,4,8,9} together", () => {
      const uf = build();
      for (const s of [4, 8, 9]) expect(uf.isSame(3, s)).toBe(true);
    });

    it("groups {0,1,2,5,6,7} together", () => {
      const uf = build();
      for (const s of [1, 2, 5, 6, 7]) expect(uf.isSame(0, s)).toBe(true);
    });

    it("keeps the two components apart", () => {
      const uf = build();
      for (const a of [3, 4, 8, 9]) {
        for (const b of [0, 1, 2, 5, 6, 7]) expect(uf.isSame(a, b)).toBe(false);
      }
    });
  });
});
