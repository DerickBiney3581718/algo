import { describe, expect, it } from "vitest";
import { Hashmap, stringHash } from "./hashmap";

describe("Hashmap", () => {
  let hashmap = new Hashmap(stringHash, (a, b) => a.localeCompare(b));
  const TMNT = {
    ralph: "stabbing things",
    michelangelo: "Nunchucks",
    leonardo: "twin swords",
    danatello: "staff",
  };

  describe("put|get", () => {
    it("puts and gets values", () => {
      for (const [key, value] of Object.entries(TMNT)) {
        hashmap.put(key, value);
        expect(hashmap.get(key)).toBe(value);
      }
    });

    it("updates existing keys", () => {
      hashmap.put("ralph", "maybe nunchucks?");
      hashmap.put("ralph", "stabbing things");

      expect(hashmap.get("ralph")).toBe("stabbing things");
    });
  });

  describe("delete", () => {
    it("deletes values by key", () => {
      hashmap.put("ralph", "stabbing things");
      hashmap.put("danny", "staff");

      hashmap.delete("ralph");

      expect(hashmap.get("ralph")).toBeNull();
      expect(hashmap.get("danny")).toBe("staff");
    });
  });
});
