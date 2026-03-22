// [3] Write a program to reverse the direction of a given singly-linked list. In other
// words, after the reversal all pointers should now point backwards. Your algorithm
// should take linear time.
// 3->4->5->6 : 3<-4<-5<-6
import { LinkedList, ListNode } from "../../linked-list.js";

function reverseList(lList) {
  const newList = Object.assign({}, lList);

  let prevNode = null;
  let currNode = newList.head;

  while (currNode) {
    let newNode;

    if (currNode.next) {
      newNode = new ListNode(currNode.next.value);
      newNode.next = currNode.next.next;
    } else {
      const listHead = newList.head;
      newList.tail = listHead;
      newList.head = currNode;
    }

    currNode.next = prevNode;
    prevNode = currNode;
    currNode = newNode;
  }
  return newList;
}

const list1 = new LinkedList([1, 2, 3, 4, 5]);
console.log(JSON.stringify(list1));
console.log("--------------------------------");
const list2 = reverseList(list1);
console.log(JSON.stringify(list2));
