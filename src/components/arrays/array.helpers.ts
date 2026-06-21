export function updateSlotValue(slot: Node, value: string) {
  if (slot instanceof Element) {
    const valueSlot = slot.querySelectorAll("div")[1];
    valueSlot.textContent = value;
  }
}

export function getSlotValue(slot: Element) {
  return slot.querySelectorAll("div")[1].textContent || "";
}

export const SLOT_WIDTH = 3;
