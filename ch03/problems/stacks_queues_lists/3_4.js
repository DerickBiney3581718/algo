// [3] Design a dictionary data structure in which search, insertion, and deletion can
// all be processed in O(1) time in the worst case. You may assume the set elements
// are integers drawn from a finite set 1, 2, .., n, and initialization can take O(n) time.
//! refer to ch03/hash-map.js

//  [3] Find the overhead fraction (the ratio of data space over total space) for each
// of the following binary tree implementations on n nodes:
// (a) All nodes store data, two child pointers, and a parent pointer. The data field
// requires four bytes and each pointer requires four bytes.
//soln for each node, data = 4, pointers = 4 * 3, total = 16
//! : 4/16 = 1/4

// (b) Only leaf nodes store data; internal nodes store two child pointers. The data
// field requires four bytes and each pointer requires two bytes.
// E = n - 1 : number of edges entering all nodes but root
// E = I + L : I number of internal nodes, L number of leaf nodes
// I ≈ L : in a balanced tree, number of internal nodes is roughly equal leaf nodes
//! (4*n)/2 * 1/(4*n) = 1/2

// 3-6. [5] Describe how to modify any balanced tree data structure such that search,
// insert, delete, minimum, and maximum still take O(log n) time each, but successor
// and predecessor now take O(1) time each. Which operations have to be modified
// to support this?
// !insert and delete would have to be modified. Need to add two extra pointers to each node: prev and next
// ! on insert, node finds predecessor (normal way), O(logn), sets next on predecessor to itself
// !and node's own prev to predecessor.The previous next of predecessor would also have to run predecessor(normal way) to get its new prev.
// ! same for inserted node's successor

// ! on delete: Assuming even the
// !1. simplest case of a node with no kids. Say node to be deleted is W,
// ! W.next and W.prev would have run the predecessor and successor methods respectively. that would be 3 * logn which is still O(lgn)

//! !But remember nodes inserted already have the extra pointers, all we have to do is to break the link before deletion
// ! A.next -> B , B.prev -> A, delete node Z

// 3-7. [5] Suppose you have access to a balanced dictionary data structure, which supports
// each of the operations search, insert, delete, minimum, maximum, successor, and
// predecessor in O(log n) time. Explain how to modify the insert and delete operations
// so they still take O(log n) but now minimum and maximum take O(1) time. (Hint:
// think in terms of using the abstract dictionary operations, instead of mucking about
// with pointers and the like.)
// !add current_min and current_max keys
// ! on insertion: check if value is < or > than current min and max. update appropriately
// ! on deletion: find new max or min if current is deleted using predecessor, successor, dic.min or dic.max.

// 3-8. [6 ] Design a data structure to support the following operations:
// • insert(x,T) – Insert item x into the set T.
// • delete(k,T) – Delete the kth smallest element from T.
// • member(x,T) – Return true iff x ∈ T.
// All operations must take O(log n) time on an n-element set.
// !
