export const DSA_TYPES = {
  ARRAYS: "arrays",
  LINKED_LISTS: "linked-lists",
} as const;

export type DSA_TYPE = (typeof DSA_TYPES)[keyof typeof DSA_TYPES];
