import { INTER_ANIM_DELAY_MS } from "../../common/helpers";
import { VISUAL_OPS_TYPES, type VisualOp } from "../../types/dsa";
import {
  BLUE_ACCENT,
  GREEN_ACCENT,
  ORANGE_ACCENT,
} from "../commons/common.helpers";
import { renderUpArrow } from "../commons/UpArrow";
import { getSlotValue, SLOT_WIDTH, updateSlotValue } from "./array.helpers";
import { renderArraySlot } from "./array.renderer";

const OPTS = { duration: INTER_ANIM_DELAY_MS };

export function createReducer(node: Node) {
  const reduceArray = async (state: VisualOp) => {
    switch (state.op) {
      case VISUAL_OPS_TYPES.DEL:
        await delSlot(node, state);
        break;

      case (VISUAL_OPS_TYPES.INS, VISUAL_OPS_TYPES.UPT):
        await insSlot(node, state);
        break;

      case VISUAL_OPS_TYPES.SWAP:
        await swapArray(node, state);
        break;

      case VISUAL_OPS_TYPES.RESIZE:
        await resizeArray(node, state);
        break;

      case VISUAL_OPS_TYPES.MOVE_PTRS:
        await movePtrs(node, state);
        break;

      case VISUAL_OPS_TYPES.FOUND:
        await foundSlot(node, state);
        break;

      default:
        null;
    }
  };
  return reduceArray;
}

async function highlightSlot(targetNode: Node) {
  if (targetNode instanceof Element) {
    await targetNode.animate(
      {
        backgroundColor: ["var(--color-accent-orange)", "inherit"],
      },
      OPTS,
    ).finished;
  }
}

async function delSlot(rootNode: Node, state: VisualOp) {
  if (state.indices?.length) {
    const idx = state.indices[0];
    const targetNode = rootNode.childNodes.item(idx);

    highlightSlot(targetNode);
    updateSlotValue(targetNode, "");
  }
}

async function foundSlot(rootNode: Node, state: VisualOp) {
  const foundIdx = state.args?.idx;

  if (foundIdx === -1) return;
  const targetNode = rootNode.childNodes.item(foundIdx);

  highlightSlot(targetNode);
}
async function insSlot(rootNode: Node, state: VisualOp) {
  const idx = state.args?.initIdx;
  const value = state.args?.val;
  const targetNode = rootNode.childNodes.item(idx);

  highlightSlot(targetNode);
  updateSlotValue(targetNode, value);
}

async function swapArray(rootNode: Node, state: VisualOp) {
  if (state.indices?.length) {
    const [left, right] = state.indices;

    const leftNode = rootNode.childNodes[left] as HTMLElement;
    const rightNode = rootNode.childNodes[right] as HTMLElement;

    const distance = (right - left) * SLOT_WIDTH * 16;
    const buffer = getSlotValue(leftNode);

    const promiseLog = await Promise.all([
      leftNode.animate(
        [
          { transform: `translateX(0)` },
          { transform: `translateX(${distance}px)` },
        ],
        OPTS,
      ).finished,

      rightNode.animate(
        {
          transform: [`translateX(0)`, `translateX(-${distance}px)`],
        },
        OPTS,
      ).finished,
    ]);

    console.log("promises", promiseLog);

    updateSlotValue(leftNode, getSlotValue(rightNode));
    updateSlotValue(rightNode, buffer);

    leftNode.getAnimations().forEach((a) => a.cancel());
    rightNode.getAnimations().forEach((a) => a.cancel());
  }
}

async function resizeArray(rootNode: Node, state: VisualOp) {
  if (state.args) {
    const { newLen, currentLen } = state.args;

    for (let index = currentLen; index < newLen; index++) {
      rootNode.appendChild(renderArraySlot(index));
    }
  }
}

async function renderPointer(idx: number, color: string, rootNode: Node) {
  const arrowWidth = 2;
  const arrowDim = `${arrowWidth}rem`;
  const ptrNode = renderUpArrow(color, arrowDim);
  ptrNode.style.position = "absolute";
  ptrNode.style.top = "100%";
  ptrNode.style.left = (SLOT_WIDTH * idx || 0) + "rem";
  ptrNode.style.transform = `translateX(${(SLOT_WIDTH - arrowWidth) / 2}rem)`;
  rootNode.appendChild(ptrNode);

  await ptrNode.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: INTER_ANIM_DELAY_MS,
    delay: INTER_ANIM_DELAY_MS,
  }).finished;

  rootNode.removeChild(ptrNode);
}
async function movePtrs(rootNode: Node, state: VisualOp) {
  // state args can either : idx or low, mid, high
  // arrow width 2 rem

  const args = state.args || {};
  const pointers = Object.keys(args);

  if (pointers.length === 1) {
    await renderPointer(args.idx, BLUE_ACCENT, rootNode);
  } else if (pointers.length === 3) {
    const { low, mid, high } = args;

    await Promise.all([
      renderPointer(low, BLUE_ACCENT, rootNode),
      renderPointer(mid, ORANGE_ACCENT, rootNode),
      renderPointer(high, GREEN_ACCENT, rootNode),
    ]);
  }
}
