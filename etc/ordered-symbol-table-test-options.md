# Testing `OrderedSymbolTable.ts` — Options & Recommendation

Target file: `src/data-structures/symbol-tables/OrderedSymbolTable.ts`
Test file to create: `src/data-structures/symbol-tables/OrderedSymbolTable.test.ts`

**Current state of the repo:** no test runner is installed (`package.json` has no `test` script, no Jest/Vitest/`node:test` config) and no existing `*.test.ts` files exist anywhere, so this is a from-scratch setup.

> ⚠️ **Pre-work needed:** `OrderedSymbolTable.ts` has module-level side-effect code at lines 149–165 (`new OrderedSymbolTable()` + several `console.log` calls) that runs on **every import** of the file. This will fire whenever the test file imports the class and should be removed/guarded first.

---

## 1. Test framework

| Option | Pros | Cons | Docs |
|---|---|---|---|
| **Vitest** ⭐ recommended | Zero-config with Vite (already a project dependency), native ESM/TS support, fast, Jest-compatible API | Adds one new dependency | [vitest.dev](https://vitest.dev/) · [Getting Started](https://vitest.dev/guide/) |
| **Jest** | Most familiar/ubiquitous test runner | Needs `ts-jest`/babel config to work with ESM + TS; more setup friction in a Vite-based project | [jestjs.io](https://jestjs.io/) · [ts-jest](https://kulshekhar.github.io/ts-jest/) |
| **`node:test`** (built-in) | Zero dependencies, ships with Node | No built-in watch/coverage ergonomics, less mature TS support, less common assertion DX | [Node.js Test Runner docs](https://nodejs.org/api/test.html) |

---

## 2. Structure of the test file

| Option | Pros | Cons |
|---|---|---|
| **Per-method `describe` blocks** — one block per public API method (`put`, `get`, `delete`, `min`, `max`, `floor`, `ceiling`, `rank`, `select`, `deleteMin`, `deleteMax`, `keys`, `size`, `isEmpty`, `contains`) | Mirrors the JSDoc API spec at the top of the file (lines 1–23); easy to audit for full coverage | More boilerplate; some tests naturally overlap (e.g. `put` and `get`) |
| **Behavior-driven scenarios** — e.g. "empty table", "single element", "many elements", "duplicate key put", each exercising several methods together | Reads like real usage; catches interaction bugs between methods | Harder to eyeball whether every spec method is covered |
| **Hybrid** ⭐ recommended — per-method `describe`, but each spec builds state through realistic sequences (`put` → `delete` → `put`) | Coverage traceability *and* catches state-transition bugs | Slightly more upfront design cost |

---

## 3. Fixture / setup strategy

| Option | Pros | Cons |
|---|---|---|
| **`beforeEach` with a fresh table seeded with a known key set** (e.g. `[5, 2, 8, 1, 9]`) ⭐ recommended | Predictable, reusable across method tests; easy to reason about `rank`/`select`/`floor`/`ceiling` | The shared shape alone won't cover empty/single-element edge cases — needs supplementary top-level tests |
| **Build state manually inside every `it`** | Full control per test, no shared assumptions to track | Verbose, repetitive |

Reference: [Vitest `beforeEach`/setup and teardown](https://vitest.dev/api/#beforeeach)

---

## 4. Edge cases to decide on

- Empty table: `min` / `max` / `floor` / `ceiling` / `get` / `select` with nothing inserted.
- Single-element table.
- Duplicate `put` (should overwrite, not insert twice) — assert `size` doesn't grow.
- `put(key, null)` — triggers the delete-on-null branch (line 41).
- `deleteMin` / `deleteMax` on an empty table.
- `rank` / `select` for keys not present.
- `floor` / `ceiling` binary search (`findKeyOrLessIdx`, lines 92–104) uses `(hi - lo) / 2` without `Math.floor` — can produce non-integer array indices.

---

## 5. Pin current behavior vs. test against the documented spec

| Option | Pros | Cons |
|---|---|---|
| **Pin current behavior as regression tests** | Fast, safe, no need to touch implementation first | Locks in existing bugs (e.g. `rank` just calls `findKeyIdx`, which doesn't match its own JSDoc contract: "number of keys less than key") |
| **Write tests against the documented JSDoc contract** ⭐ recommended | Tests double as a bug-finding pass; more valuable long-term | Some tests will fail immediately — requires a decision per failure: fix the implementation now, or mark `.todo`/`.skip` with an annotation |

Suspected bugs surfaced by this approach:
- `rank(key)` (line 112–114) returns `findKeyIdx` result (an index or `-1`), not "count of keys less than `key`" as documented.
- `findKeyOrLessIdx` (line 92–104) computes `mid` without flooring — potential fractional-index bug.

---

## Recommendation

**Vitest** + **hybrid structure** (per-method `describe`, realistic state sequences) + **`beforeEach` fixture** with a known key set, supplemented by explicit empty/single-element tests + **write against the documented JSDoc spec**, letting failures surface real bugs rather than enshrining them, then fix or `.skip`+annotate as needed.
