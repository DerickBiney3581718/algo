/\*\*
contiguous

Structural equivalence means:

1. Same property names ✓
2. All values match (by value, not reference):


    - Primitives: 1 === 1 (same value)
    - Objects: recursively check their structure (don't care

if different references) 3. Same prototype chain structure (recursively) ✓

shallow vs deep clones
const original = { x: 1, y: { z: 2 } };

const shallowClone = { x: 1, y: original.y }; // y points
to SAME object
const deepClone = { x: 1, y: { z: 2 } }; // y points
to NEW object

// Structurally equivalent? All THREE are structurally
equivalent
// - Names match: x, y
// - Values match: 1 === 1, { z: 2 } ≡ { z: 2 }
// - Prototypes match

The difference is referential equality, not structural
equivalence:

original.y === shallowClone.y // true (same reference)
original.y === deepClone.y // false (different
reference)

const colors = ["red", "yellow", "blue"];
colors[5] = "purple";
const iterator = colors.keys();
for (const key of iterator) {
console.log(`${key}: ${colors[key]}`);
}
for (let idx = 0; idx < colors.length; idx++) {
const element = colors[idx];
console.log("element", element);
}
for (const value of colors) {
console.log(`value: ${value}`);
}

colors.forEach((val, idx) => {
console.log(`idx:${idx} -> val:${val}`);
});
const newCls = colors.map((val, idx) => `idx:${idx} -> val:${val}`);
console.log(newCls);
\*/
