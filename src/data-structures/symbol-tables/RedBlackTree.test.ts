import { beforeEach, describe, expect, it } from "vitest";
import { RBBst } from "./RedBlackTree";

// Insertion order chosen deliberately: it produces a tree shaped like
//         5
//       /   \
//      2     8
//     / \   / \
//    1   3 6   9
//         \ \
//          4 7
// so structural edge cases (e.g. a one-child node, a successor with its
// own right child) are exercised, not just a balanced/trivial shape.
const FULL_KEYS: number[] = [5, 2, 8, 1, 9, 6, 3, 7, 4];

function buildFullTree(): RBBst<number> {
  const t = new RBBst<number>();
  for (const key of FULL_KEYS) t.put(key, key ** 2);
  return t;
}

describe("RedBlackTree", () => {
  // one-time
  const keys: number[] = FULL_KEYS;
  const SLICE = 3;
  let tree: RBBst<number>;

  // beforeEach
  beforeEach(() => {
    tree = new RBBst();
    for (const key of keys.slice(0, SLICE)) tree.put(key, key ** 2);
  });

  // group tests for each methods

  describe("put|get", () => {
    it("inserts value if key is new and value is non-null", () => {
      const lastKey = keys.slice(-1)[0];
      const value = lastKey ** 2;
      tree.put(lastKey, value);
      expect(tree.get(lastKey)).toBe(value);
    });

    it("updates value of existing keys", () => {
      const firstKey = keys[0];
      tree.put(firstKey, 0);
      expect(tree.get(firstKey)).toBe(0);
    });

    it("returns null for a key that was never inserted", () => {
      expect(tree.get(1234)).toBeNull();
    });
  });

  describe("contains", () => {
    it("returns true for an existing key", () => {
      expect(tree.contains(keys[0])).toBe(true);
    });

    it("returns false for a missing key", () => {
      expect(tree.contains(1234)).toBe(false);
    });
  });

  describe("min|max", () => {
    it("gets the min key", () => {
      const minKey = keys
        .slice(0, SLICE)
        .reduce((prev, curr) => Math.min(prev, curr));
      expect(tree.min).toBe(minKey);
    });

    it("gets the max key", () => {
      const maxKey = keys
        .slice(0, SLICE)
        .reduce((prev, curr) => Math.max(prev, curr));
      expect(tree.max).toBe(maxKey);
    });
  });

  describe("keys", () => {
    it("get the keys", () => {
      const existingKeys = keys.slice(0, SLICE).toSorted();
      const treeKeys = tree.keys();

      expect(treeKeys).toEqual(existingKeys);
    });

    it("returns an empty array for an empty tree", () => {
      const empty = new RBBst<number>();
      expect(empty.keys()).toEqual([]);
    });

    describe("ranged queries", () => {
      let full: RBBst<number>;

      beforeEach(() => {
        full = buildFullTree();
      });

      it("returns all keys when lo/hi are omitted", () => {
        expect(full.keys()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it("includes matching keys reached through a left child whose own key is below lo", () => {
        // lo(4) is greater than root.left.key(2), but root.left.right.right
        // holds 4 itself — a naive "lo <= node.left.key" prune would skip
        // this whole branch and miss it.
        expect(full.keys(4, 7)).toEqual([4, 5, 6, 7]);
      });

      it("includes matching keys reached through a right child whose own key is above hi", () => {
        // hi(7) is less than root.right.key(8), but root.right.left and
        // root.right.left.right hold 6 and 7 — a naive "hi >= node.right.key"
        // prune would skip this whole branch and miss them.
        expect(full.keys(2, 7)).toEqual([2, 3, 4, 5, 6, 7]);
      });

      it("returns an empty array when the range matches nothing", () => {
        expect(full.keys(100, 200)).toEqual([]);
      });
    });
  });

  describe("rank|select", () => {
    const reversedSorted = keys.slice(0, SLICE).toSorted().toReversed();
    const lastRanked = reversedSorted[0];
    const lastRankedPos = reversedSorted.length;
    const firstRanked = reversedSorted[lastRankedPos - 1];
    it("gets the last ranked key", () => {
      expect(tree.rank(lastRanked)).toBe(lastRankedPos);
    });

    it("selects the  key of the last rank", () => {
      expect(tree.select(lastRankedPos)).toBe(lastRanked);
    });

    it("gets the first ranked key", () => {
      expect(tree.rank(firstRanked)).toBe(1);
    });

    it("selects the key of the first rank", () => {
      expect(tree.select(1)).toBe(firstRanked);
    });

    it("returns null rank for a missing key", () => {
      expect(tree.rank(1234)).toBeNull();
    });

    it("round-trips rank/select for every key across a bigger tree", () => {
      // Keys 1..9 are consecutive, so sorted position === key value,
      // which makes it easy to assert every rank/select pair at once.
      const full = buildFullTree();

      for (let key = 1; key <= 9; key++) {
        expect(full.rank(key)).toBe(key);
        expect(full.select(key)).toBe(key);
      }
    });
  });

  describe("floor|ceiling", () => {
    let full: RBBst<number>;

    beforeEach(() => {
      full = buildFullTree();
    });

    it("returns the key itself when it exists in the tree", () => {
      expect(full.floor(4)).toBe(4);
      expect(full.ceiling(4)).toBe(4);
    });

    it("finds the ceiling reached through a left child whose key is below the search key", () => {
      // node.left.key(2) < 4, but node.left.right.right holds 4 — the
      // ceiling search must still descend into that left subtree.
      expect(full.ceiling(4)).toBe(4);
    });

    it("finds the floor/ceiling of a key that is absent from the tree", () => {
      full.delete(4);
      expect(full.floor(4)).toBe(3);
      expect(full.ceiling(4)).toBe(5);
    });

    it("returns null when no floor exists", () => {
      expect(full.floor(0)).toBeNull();
    });

    it("returns null when no ceiling exists", () => {
      expect(full.ceiling(100)).toBeNull();
    });
  });

  describe("delete", () => {
    it("does nothing when the key does not exist", () => {
      const before = tree.keys();
      tree.delete(1234);
      expect(tree.keys()).toEqual(before);
    });

    it("removes the only node in a single-node tree", () => {
      const single = new RBBst<number>();
      single.put(5, 25);
      single.delete(5);
      expect(single.contains(5)).toBe(false);
      expect(single.keys()).toEqual([]);
      expect(single.min).toBeNull();
    });

    it("removes a leaf (0 children)", () => {
      const full = buildFullTree();
      const minKey = keys.reduce((prev, curr) => Math.min(prev, curr));
      const allKeys = full.keys();

      full.delete(minKey);

      expect(full.contains(minKey)).toBe(false);
      expect(full.keys()).toEqual(allKeys.filter((val) => val !== minKey));
    });

    it("removes a non-root node with exactly one child, preserving the correct side", () => {
      const full = buildFullTree();
      // 6 has only a right child (7), and 6 itself is the *left* child of 8.
      full.delete(6);
      expect(full.contains(6)).toBe(false);
      expect(full.contains(7)).toBe(true);
      expect(full.keys()).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
      // Ordering must remain valid: 7 has to end up left of 8, not right.
      expect(full.floor(7.5)).toBe(7);
      expect(full.ceiling(7.5)).toBe(8);
    });

    it("removes the root when it has exactly one child", () => {
      const t = new RBBst<number>();
      t.put(5, 25);
      t.put(2, 4);
      t.delete(5);
      expect(t.contains(5)).toBe(false);
      expect(t.contains(2)).toBe(true);
      expect(t.keys()).toEqual([2]);
      // The tree must still be usable afterwards (catches a dangling
      // parent pointer left on the promoted root).
      t.put(9, 81);
      expect(t.keys()).toEqual([2, 9]);
      expect(t.rank(9)).toBe(2);
    });

    it("removes a non-root node with two children", () => {
      const full = buildFullTree();
      full.delete(2);
      expect(full.contains(2)).toBe(false);
      expect(full.keys()).toEqual([1, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("removes the root when it has two children, without losing the rest of the tree", () => {
      const full = buildFullTree();
      // root(5)'s in-order successor is 6, which itself has a right
      // child (7) — that subtree must be reattached, not dropped.
      full.delete(5);
      expect(full.contains(5)).toBe(false);
      expect(full.keys()).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
      expect(full.contains(7)).toBe(true);
      expect(full.min).toBe(1);
      expect(full.max).toBe(9);
    });
  });
});
