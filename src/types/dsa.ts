export const DSA_TYPES = {
  ARRAYS: "arrays",
  LINKED_LISTS: "linked-lists",
} as const;

export type DSA_TYPE = (typeof DSA_TYPES)[keyof typeof DSA_TYPES];

export const VISUAL_OPS_TYPES = {
  DEL: "delete",
  INS: "insert",
  UPT: "update",
  SWAP: "swap",
  SEARCH: "search",
  SORT: "sort",
  MOVE_PTRS: "move_pointers",
  STATE: "state",
  FOUND: "found",
  DONE: "done",
  RESIZE: "resize",
} as const;

export type VisualOp = {
  op: (typeof VISUAL_OPS_TYPES)[keyof typeof VISUAL_OPS_TYPES];
  indices?: number[];
  args?: Record<string, any>;
};

export type Comparable = string | number | null;
