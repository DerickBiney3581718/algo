import { createTArray } from "../../data-structures/Array";
import ArrayModuleCss from "./array.module.css";
import { createReducer } from "./array.reducer";
import { SLOT_WIDTH } from "./array.helpers";

export const renderArray = (canvasNode: Node) => {
  const arrayVi = document.createElement("div");
  arrayVi.className = ArrayModuleCss.arrayVi;

  const tArray = createTArray({
    userList: [1, 2, 3, 4, 45, 7, 9, 10],
    length: 10,
    isSorted: true,
    isResizable: true,
  });

  for (let idx = 0; idx < tArray.length; idx++) {
    const slot = renderArraySlot(idx, tArray[idx]);
    arrayVi.append(slot);
  }

  canvasNode.appendChild(arrayVi);
  const reducer = createReducer(arrayVi);
  return { ds: tArray, reducer };
};

export const renderArraySlot = (idx: number, value?: string | number) => {
  const slot = document.createElement("div");
  slot.className = ArrayModuleCss.arraySlot;
  slot.innerHTML = /*html*/ `
  <div class=${ArrayModuleCss.slotIdx}>${idx.toString()}</div>
  <div> ${value ?? ""}</div>
  `;
  slot.style.width = SLOT_WIDTH + "rem";
  return slot;
};
