import { createTArray } from "../../data-structures/Array";
import ArrayModuleCss from "./array.module.css";

const SLOT_WIDTH = 6;
export const renderArraySlot = (idx: number, value: string | number) => {
  const slot = document.createElement("div");
  slot.className = ArrayModuleCss.arraySlot;
  slot.innerHTML = /*html*/ `
  <div class=${ArrayModuleCss.slotIdx}>${idx.toString()}</div>
  <div> ${value ?? ""}</div>
  `;
  slot.style.width = SLOT_WIDTH + "rem";
  return slot;
  // todo:  return updater with cached node
};

export const renderArray = (canvasNode: Node) => {
  const arrayVi = document.createElement("div");
  arrayVi.className = ArrayModuleCss.arrayVi;

  const tArray = createTArray({ length: 10 });
  arrayVi.style.width = tArray.length * SLOT_WIDTH + "rem";
  tArray.delete(3);
  tArray.delete(4);
  tArray.insert("45");
  tArray.search("45");

  for (let idx = 0; idx < tArray.length; idx++) {
    const slot = renderArraySlot(idx, tArray[idx]);
    arrayVi.append(slot);
  }
  canvasNode.appendChild(arrayVi);
  return tArray;
};
