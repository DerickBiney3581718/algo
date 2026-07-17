# Review: `src/data-structures/symbol-tables/BinarySearchTree.ts`

## Critical bugs (confirmed with test cases)

### 1. `floor()` / `ceiling()` return the wrong value when the key isn't in the tree
Lines 194-196, 213-218:
```ts
if (newNodeKey === null || (node.key < key && node.key > newNodeKey)) return key;
```
This returns `key` (the search key itself) instead of `node.key` in the fallback branches.

Example: tree contains only `{10}`.
- `floor(7)` should return `null` (no key ≤ 7 exists) but returns `7`.
- `ceiling(5)` on the same tree should return `10` but returns `5`.

Both methods can return values that don't exist in the tree at all.

### 2. `keys()` / `traverse()` is broken for the common no-argument call
Lines 288-309:
```ts
if (node.left && lo !== null && lo <= node.left.key!) this.traverse(node.left, q, lo, hi);
...
if (node.right && hi && hi >= node.right.key!) this.traverse(node.right, q, lo, hi);
```
When `lo`/`hi` are `null` (the default, meaning "no bound"), `lo !== null` and `hi` are both falsy, so the traversal **never recurses into either subtree**. `keys()` with no args returns only the root key, dropping every other key in the tree.

Even with real bounds, pruning on `node.right.key` / `node.left.key` instead of `node.key` is unsound — e.g. `hi=30` with `node.right.key=50` skips the right subtree entirely even though `node.right.left` could hold `25`, which is in range.

### 3. `rank()` is only correct for depth-1 trees
Lines 221-233. It compares the found node only against `this.root`, ignoring every other ancestor on the path, and uses `currNode.size` (the found node's *whole subtree* size) rather than accumulating left-subtree sizes along the search path. Standard rank requires summing `size(node.left) (+1)` at every step from root to the target.

### 4. `select()` logic is inverted and uses the wrong size
Lines 235-252. It compares `rank` against `node.size` (whole subtree) rather than `node.left.size`, and the left/right branching is backwards relative to the standard algorithm (`t = size(left); rank<t → left; rank>t → right, rank-t-1`). Will return wrong keys for any non-trivial tree.

### 5. Truthy checks on `.key` break for key/value `0`
`0` is a valid `NonNullComparable`, but these treat it as absent:
- Line 60: `if (key && value)` in the constructor
- Line 83: `if (child !== null && child.key)` in `put()`
- Lines 187, 189: `node.right?.key`, `node.right?.left?.key` in `floor()`
- Line 208: `node.left?.key` in `ceiling()`

Elsewhere the code correctly uses `=== null` (e.g. lines 180, 202, 265) — so the checks are inconsistent, and the truthy ones are bugs.

## Missing API surface

The file's own doc-comment (lines 1-23) advertises `contains`, `isEmpty`, `size()`, `deleteMin`, `deleteMax`, `size(lo, hi)` — **none of these are implemented**. Only `get/put/delete/min/max/floor/ceiling/rank/select/keys` exist.

## Structural / design issues

- **Key and Value forced to the same type** (`class BST<T extends NonNullComparable>`, `put(key: T, value: T | null)`) — the header's own Java reference (`BST<Key, Value>`) implies independent types. As written you can't store a value that isn't itself a comparable key type.
- **`walk()` generator is indirect for no benefit**: it yields `null` on every non-matching step just so `get()` / `findNode()` can filter with `if (node)`. A plain `findNode(key): BSTNode<T> | null` loop would be simpler and avoid generator overhead entirely.
- **`put()` recomputes direction redundantly**: line 92 computes `isLeft` to walk down, then lines 77-78 recompute `parent.key! < key` from scratch to decide which side to attach the new node — should just reuse the direction already known from the traversal.
- **`delete()`'s two-child case is a non-standard "graft onto successor in place" trick** rather than the textbook promote-successor-and-`deleteMin`. It appears to preserve BST ordering, but never rebalances, so repeated deletions can skew the tree; it also calls `unset`/`set` (each an O(log n) walk to root recomputing sizes) up to 4 times per delete, redoing work.
- **`BSTNode.key` / `value` declared `T | null = null`** (lines 30-31) even though the constructor always assigns real values immediately — this manufactures nullability that's dead in practice, and is likely *why* the truthy-vs-`=== null` inconsistency crept in. Making them required, non-nullable fields would remove a whole class of these bugs.
- **No test file** for `BinarySearchTree.ts` (there's `OrderedSymbolTable.test.ts` but nothing for BST/RedBlackTree) — given the bug count above, even basic tests (insert 0, floor/ceiling of an absent key, `keys()` with no args, rank/select on a 3+ level tree) would have caught most of this immediately.

## Suggested next step

Add a test file before fixing anything, so each fix can be verified against a concrete failing case rather than by inspection.
