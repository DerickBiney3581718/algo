2. Adding linked list, queue, stack, dll, deque data structures
3. adding forms for the arrays
4. building out the playback controller
5. abstracting the recording better in data structures

private \_delete(node, key): Node<T> | null {
if (key < node.key)
{

<!-- if 2-node -->

if (!isRed(node.left) && !isRed(node.left?.left)) node = moveRedLeft(node);
node.left = this.\_delete(node.left, key);
}

else
{

<!-- if part of 3-node, right rotate -->

if (isRed(node.left)) node = rightRotate(node);
if (key === node.key && node.right === null) return null; // found at the bottom
if (!isRed(node.right) && !isRed(node.right?.left)) node = moveRedRight(node);
if (key === node.key) { // two-children case
const m = node.right!.min!;
node.key = m.key; node.value = m.value;
node.right = this.\_deleteMin(node.right!);
} else {
node.right = this.\_delete(node.right, key);
}
}
return this.\_balance(node); // ← every path rebalances on unwind
}
