import { beforeEach, describe, expect, it } from "vitest";
import { OrderedSymbolTable } from "./OrderedSymbolTable";

describe("OrderedSymbolTable", () => {
  let table: OrderedSymbolTable<number>;

  // sorted order after seeding: 1, 2, 5, 8, 9
  const seedKeys = [5, 2, 8, 1, 9];

  beforeEach(() => {
    table = new OrderedSymbolTable<number>();
    for (const key of seedKeys) table.put(key, key * 10);
  });

  describe("put / get", () => {
    it("stores a value retrievable by its key", () => {
      expect(table.get(5)).toBe(50);
    });

    it("increases size for each new key", () => {
      expect(table.size).toBe(seedKeys.length);
    });

    it("overwrites the value on a duplicate put without growing size", () => {
      table.put(5, 999);
      expect(table.get(5)).toBe(999);
      expect(table.size).toBe(seedKeys.length);
    });

    it("deletes the key when put with a null value", () => {
      table.put(5, null as unknown as number);
      expect(table.contains(5)).toBe(false);
      expect(table.size).toBe(seedKeys.length - 1);
    });

    // BUG (A): unused TArray slots are `undefined`, not `null`, so get()
    // on a missing key returns `undefined` instead of the documented `null`.
    it("returns null for a key that was never inserted", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(empty.get(1)).toBeNull();
    });
  });

  describe("contains", () => {
    it("is true for an inserted key", () => {
      expect(table.contains(8)).toBe(true);
    });

    it("is false for a key never inserted", () => {
      expect(table.contains(100)).toBe(false);
    });

    it("is false for every key on an empty table", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(empty.contains(1)).toBe(false);
    });
  });

  describe("delete", () => {
    it("removes the key-value pair and decrements size", () => {
      table.delete(2);
      expect(table.contains(2)).toBe(false);
      expect(table.size).toBe(seedKeys.length - 1);
    });

    it("leaves the remaining keys in sorted order", () => {
      table.delete(5);
      expect(table.keys()).toEqual([1, 2, 8, 9]);
    });
  });

  describe("isEmpty", () => {
    it("is true for a freshly created table", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(empty.isEmpty).toBe(true);
    });

    it("is false once a key has been inserted", () => {
      expect(table.isEmpty).toBe(false);
    });

    it("becomes true again after deleting the only key", () => {
      const single = new OrderedSymbolTable<number>();
      single.put(1, 10);
      single.delete(1);
      expect(single.isEmpty).toBe(true);
    });
  });

  describe("min / max", () => {
    it("returns the smallest key", () => {
      expect(table.min).toBe(1);
    });

    it("returns the largest key", () => {
      expect(table.max).toBe(9);
    });

    it("returns the only key when there is a single element", () => {
      const single = new OrderedSymbolTable<number>();
      single.put(42, 1);
      expect(single.min).toBe(42);
      expect(single.max).toBe(42);
    });

    // BUG (A): same undefined-vs-null gap as get() — empty._keys[0] is
    // `undefined`, not `null`.
    it("returns null on an empty table", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(empty.min).toBeNull();
      expect(empty.max).toBeNull();
    });
  });

  describe("floor", () => {
    it("returns the key itself when the key is present", () => {
      expect(table.floor(5)).toBe(5);
    });

    // BUG (C): findKeyOrLessIdx computes `mid = lo + (hi - lo) / 2` without
    // Math.floor, so it can land on a fractional index and return undefined
    // instead of the true floor.
    it("returns the largest key less than the given key when absent", () => {
      expect(table.floor(6)).toBe(5);
    });

    // BUG (A): floor() doesn't `?? null` like min/max now do, so when
    // findKeyOrLessIdx returns -1 (key smaller than every key), this._keys[-1]
    // is `undefined`, not `null`.
    it("returns null when the key is smaller than every key", () => {
      expect(table.floor(0)).toBeNull();
    });
  });

  describe("ceiling", () => {
    it("returns the key itself when the key is present", () => {
      expect(table.ceiling(5)).toBe(5);
    });

    // BUG (D): ceiling() only exact-matches via findKeyIdx; on a miss (-1)
    // it indexes _keys[-1 + 1] = _keys[0], so it always returns the minimum
    // instead of the true ceiling.
    it("returns the smallest key greater than the given key when absent", () => {
      expect(table.ceiling(6)).toBe(8);
    });

    it("returns the max when the key is larger than every key", () => {
      expect(table.ceiling(20)).toBeNull();
    });
  });

  describe("rank", () => {
    it("returns the count of keys strictly less than an inserted key", () => {
      // sorted: 1, 2, 5, 8, 9 -> 5 is at index 2, i.e. 2 keys are smaller
      expect(table.rank(5)).toBe(2);
    });

    it("returns 0 for the minimum key", () => {
      expect(table.rank(1)).toBe(0);
    });
  });

  describe("select", () => {
    it("returns the key at the given rank", () => {
      expect(table.select(0)).toBe(1);
      expect(table.select(2)).toBe(5);
      expect(table.select(4)).toBe(9);
    });

    // BUG (A): same undefined-vs-null gap — out-of-range slots are undefined.
    it("returns null for a rank beyond the table size", () => {
      expect(table.select(100)).toBeNull();
    });
  });

  describe("deleteMin", () => {
    it("removes the smallest key", () => {
      table.deleteMin();
      expect(table.contains(1)).toBe(false);
      expect(table.min).toBe(2);
      expect(table.size).toBe(seedKeys.length - 1);
    });

    // BUG (B): cascades from (A) — deleteMin() guards with `min !== null`,
    // but empty.min is `undefined`, so it passes the guard and calls
    // delete(undefined), driving size to -1.
    it("is a no-op on an empty table", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(() => empty.deleteMin()).not.toThrow();
      expect(empty.size).toBe(0);
    });
  });

  describe("deleteMax", () => {
    it("removes the largest key", () => {
      table.deleteMax();
      expect(table.contains(9)).toBe(false);
      expect(table.max).toBe(8);
      expect(table.size).toBe(seedKeys.length - 1);
    });

    // BUG (B): same cascade as deleteMin() — empty.max is `undefined`, not
    // `null`, so the `max !== null` guard doesn't catch it.
    it("is a no-op on an empty table", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(() => empty.deleteMax()).not.toThrow();
      expect(empty.size).toBe(0);
    });
  });

  describe("keys", () => {
    it("returns all keys in sorted order when called with no arguments", () => {
      expect(table.keys()).toEqual([1, 2, 5, 8, 9]);
    });

    it("returns keys within the given [lo, hi] index range", () => {
      expect(table.keys(1, 3)).toEqual([2, 5, 8]);
    });

    it("returns an empty array for an empty table", () => {
      const empty = new OrderedSymbolTable<number>();
      expect(empty.keys()).toEqual([]);
    });
  });

  describe("toString", () => {
    it("includes both the keys line and the values line", () => {
      const str = table.toString();
      const [keysLine, valuesLine] = str.split("\n");
      expect(keysLine).toContain("1");
      expect(valuesLine).toContain("10");
    });
  });
});
