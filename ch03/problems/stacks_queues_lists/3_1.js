//  [3] A common problem for compilers and text editors is determining whether the
// parentheses in a string are balanced and properly nested. For example, the string
// ((())())() contains properly nested pairs of parentheses, which the strings )()( and
// ()) do not. Give an algorithm that returns true if a string contains properly nested
// and balanced parentheses, and false if otherwise. For full credit, identify the position
// of the first offending parenthesis if the string is not properly nested and balanced.
import { Stack } from "../../stack.js";
import assert from "node:assert";

function truePairs(text) {
  const pairStack = new Stack();
  const opening = "(";
  let matched = true;
  let idx = 0;
  const textLength = text.length;

  while (matched && idx < textLength) {
    const char = text[idx];
    if (char === opening) {
      pairStack.push(char);
    } else {
      if (pairStack.peek() === opening) {
        pairStack.pop();
        console.log("char: ", char, "popping");
      } else {
        matched = false;
        break;
      }
    }
    ++idx;
  }
  return matched ? matched : idx;
}

assert.equal(truePairs("((())())()"), true);
assert.notEqual(truePairs(")()("), true);
assert.notEqual(truePairs("())"), true);
