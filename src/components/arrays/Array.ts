import ArrayModuleCss from "./array.module.css";
export const renderArraySlot = (idx: number, value: string) => {
  const slot = document.createElement("div");
  slot.className = ArrayModuleCss.arraySlot;
  slot.innerHTML = /*html*/ `
  <div class=${ArrayModuleCss.slotIdx}>${idx.toString()}</div>
  <div> ${value}</div>
  `;

  return slot;
  // todo:  return updater with cached node
};

export const renderArray = (array: string[]) => {
  const arrayVi = document.createElement("div");
  arrayVi.className = ArrayModuleCss.arrayVi;

  arrayVi.style.width = array.length * 2 + "rem";
  const slots = array.map((value, idx) => renderArraySlot(idx, value));
  arrayVi.append(...slots);
  return arrayVi;
};
