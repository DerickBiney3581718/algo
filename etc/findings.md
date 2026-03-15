# Findings

## Optional chaining (`?.`) cannot be on the left-hand side of assignment

- MDN — Optional chaining: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining#invalid_optional_chaining_targets
- ECMAScript spec — AssignmentExpression (why `?.` is not a valid assignment target): https://tc39.es/ecma262/#sec-assignment-operators
- TC39 proposal (original design notes, see "NOT supported" section): https://github.com/tc39/proposal-optional-chaining#not-supported

## ESM failing without extension

Is ESM the "default"? Not quite yet. Node.js still defaults to
 CommonJS unless:

- Your package.json has "type": "module", or
- The file uses .mjs extension

If you have neither, Node will error when it sees import. The fact
 that yours ran at all (and hit the module-not-found error rather
 than a syntax error) means one of those conditions is already met in
your project.

Resources:

- https://nodejs.org/api/esm.html#mandatory-file-extensions
- https://nodejs.org/api/packages.html#determining-module-system
  (explains "type": "module")

## Circular references from BST child→parent pointers

### The problem
Each `BSTNode` holds a `parent` reference, creating cycles:
`root → child → root → ...`

This breaks several things:

| Scenario | Failure |
|---|---|
| `JSON.stringify(tree)` | `TypeError: Converting circular structure to JSON` |
| `structuredClone(tree)` | Works in modern JS (handles cycles), but included parent pointers bloat the clone |
| `console.log` | Shows `[Circular *1]` — not the real value |
| Custom recursive traversal without a visited set | Stack overflow / infinite loop |
| Some ORMs / serializers | Silent data loss or crash |

### Resolutions

**1. Replacer function (quickest fix for JSON)**
```js
JSON.stringify(tree, (key, val) => key === 'parent' ? undefined : val)
```
- MDN replacer docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter

**2. A "seen" WeakMap in custom traversal**
Track visited nodes to break cycles without modifying the structure.
- MDN WeakMap: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap

**3. Store parent value instead of parent reference**
Store `node.parentValue` (a primitive) instead of the full node object — eliminates the cycle at the cost of losing direct pointer traversal.

**4. Use a library for circular-safe serialization**
- `flatted`: https://github.com/WebReflection/flatted
- `json-stringify-safe`: https://github.com/nicolo-ribaudo/json-stringify-safe-non-recursive

**5. Remove parent pointer entirely**
Many BST implementations omit the parent pointer and instead pass the parent down the call stack during recursion. Simpler, no cycle risk, but upward traversal (e.g., finding successor) requires more work.
- CLRS discussion on BST parent pointers: https://en.wikipedia.org/wiki/Binary_search_tree#Successor_and_predecessor

---

## BST `_traverseTree` not recursive — deep nodes not printed

### The problem
`_traverseTree` in `bst.js:73` prints the root and calls `_printTreeLine`
for root's immediate left/right children — but never calls *itself* on
those children. The traversal stops at depth 1.

Tree has 5 nodes: `4, 2, 7, 1, 10`
Only 3 are visited: `4` (depth 0), `2` and `7` (depth 1)
Never reached: `1` (left of 2) and `10` (right of 7) — both at depth 2

The `console.log("node...", node)` inside `_printTreeLine` is the
evidence: it fires exactly 3 times, confirming only 3 nodes were traversed.

### Root cause
`_traverseTree` calls `_printTreeLine` for children but does NOT call
`_traverseTree` recursively on them. The recursion is missing.

### Reference — tree traversal patterns
- MDN recursion: https://developer.mozilla.org/en-US/docs/Glossary/Recursion
- Wikipedia — Tree traversal (pre/in/post-order): https://en.wikipedia.org/wiki/Tree_traversal

---

## Refactoring `_traverse` with function factories and closures

### Verdict: Feasible

The idea is to decouple *how you traverse* from *what you do at each node*
by passing a **factory function** into `_traverse`. The factory uses closure
to capture any context it needs (e.g. `lines`, `totalSize`) and returns a
callback that `_traverse` calls on each node.

Skeleton of the pattern:
```js
// Factory — closes over external state, returns a node-visitor callback
function printLineFactory(lines, totalSize) {
  return function visitor(node, depth, isLeft) {
    // `lines` and `totalSize` are captured via closure
    const adjustedPadding = totalSize * 2 + depth * (isLeft ? -2 : 2);
    lines[depth * 2][adjustedPadding] = node.value;
    // ... rest of printTreeLine logic
  };
}

// _traverse becomes purely structural — knows nothing about the side-effect
_traverse(strategy, node, visitor, depth = 0) {
  if (!node) return;
  if (strategy === "in-order") {
    this._traverse(strategy, node.left, visitor, depth + 1);
    visitor(node, depth);
    this._traverse(strategy, node.right, visitor, depth + 1);
  }
}

// Call site
const visitor = printLineFactory(lines, this.size);
this._traverse("in-order", this.root, visitor);
```

You can now swap in any factory (collect values, count nodes, draw the tree)
without touching `_traverse` itself.

### Why it works — the JS concepts involved

**Closures** (most important)
The factory captures `lines` and `totalSize` in its scope. The returned
`visitor` function still has access to them after the factory returns.
- MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
- 33jsconcepts topic: Closures

**Higher-order Functions**
`_traverse` accepts a function as an argument. The factory itself returns
a function. Both make `_traverse` a higher-order function consumer.
- MDN: https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function
- 33jsconcepts topic: Higher-order Functions

**Callbacks**
The `visitor` returned by the factory is used as a callback — passed in,
called later at the right moment during traversal.
- MDN: https://developer.mozilla.org/en-US/docs/Glossary/Callback_function
- 33jsconcepts topic: Callbacks

**Pure Functions** (worth understanding the contrast)
`_traverse` itself can be kept pure (no side-effects, same output for same
input) while the injected `visitor` may be impure (mutates `lines`).
Separating them makes testing `_traverse` independently easy.
- MDN: https://developer.mozilla.org/en-US/docs/Glossary/Pure_function
- 33jsconcepts topic: Pure Functions

**Recursion**
`_traverse` calls itself — depth tracking must be passed down the call stack,
not stored on `this` (or race conditions between calls will corrupt depth).
- MDN: https://developer.mozilla.org/en-US/docs/Glossary/Recursion
- 33jsconcepts topic: Recursion

**Composition**
Multiple factories can be composed — e.g. wrap them so one `_traverse` call
fires both a print visitor and a collect-values visitor.
- MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#function_composition
- 33jsconcepts topic: Composition

**Design Patterns — Visitor Pattern**
This refactor is a textbook implementation of the Visitor pattern: separate
an algorithm (the visitor/factory) from the data structure it operates on
(the BST). It also uses the Strategy pattern for the `strategy` argument.
- Wikipedia Visitor pattern: https://en.wikipedia.org/wiki/Visitor_pattern
- 33jsconcepts topic: Design Patterns

---

## `this` is `undefined` inside a regular function used as a callback

### What happened
`createPrintLine` returns a regular `function _printLine(...)`. When
`_traverse` calls it as `callback(node, depth, isLeft)` — no receiver
object, no `.call`, no `.bind` — `this` inside `_printLine` is `undefined`
(strict mode) or `globalThis` (sloppy mode). Neither is the `BSTree` instance.

`createPrintLine` itself is called as `this.createPrintLine(lines)`, so
`this` IS the BSTree there — but regular functions reset their own `this`
at call time. That binding does not pass through to `_printLine`.

### Why regular functions behave this way
`this` in a regular function is **dynamic** — determined entirely by how
the function is invoked, not where it was defined:

| How called | `this` value |
|---|---|
| `obj.method()` | `obj` |
| `fn()` (no receiver) | `undefined` (strict) / `globalThis` (sloppy) |
| `fn.call(ctx)` | `ctx` |
| `new fn()` | the new instance |

### Two resolutions relevant to the factory pattern

**1. Arrow function — lexical `this`**
Arrow functions have NO own `this`. They capture it from the surrounding
scope at definition time. If `createPrintLine` is called as a method,
`this` inside it is the BSTree — and any arrow defined there inherits it.
```js
createPrintLine(lines) {
  const _printLine = (node, depth, isLeft) => {  // arrow — `this` = BSTree
    const adjustedPadding = this.size * 2 + ...
  };
  return _printLine;
}
```

**2. Close over `this.size` explicitly (cleaner for factories)**
Capture what you need as a plain variable in the factory scope. The
returned callback then needs no `this` at all — pure closure.
```js
createPrintLine(lines) {
  const size = this.size;  // captured once, in factory scope
  function _printLine(node, depth, isLeft) {
    const adjustedPadding = size * 2 + ...  // no `this` needed
  }
  return _printLine;
}
```
This is the more idiomatic factory pattern: the factory gathers everything
it needs from the outside world at creation time; the returned function is
self-contained.

### Resources
- MDN — `this`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
- MDN — Arrow functions (no own `this`): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#no_separate_this
- MDN — `.bind()` (third resolution — explicit binding): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
- 33jsconcepts topics: Closures, The `this` Keyword, Higher-order Functions

---

### Tradeoffs to keep in mind
- The factory must be called *before* `_traverse` so the closure is set up
- `depth` must be a parameter passed by `_traverse`, not inferred inside the
  factory — the factory has no awareness of its position in the tree
- Passing `isLeft` into the visitor requires `_traverse` to know which
  branch it's on (`node === parent.left`), or you pass it explicitly as a
  parameter at each recursive call
