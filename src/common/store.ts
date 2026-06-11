import type { Base } from "../data-structures/Base";
import type { VisualOp } from "../types/dsa";
type storeSchema = {
  step: number;
  sequence: Array<VisualOp>;
};

type Listener = () => void;
function createStore<T extends storeSchema>(store: T) {
  const listeners = new Set<Listener>();

  const state = new Proxy(store, {
    set(target, key, value, receiver) {
      Reflect.set(target, key, value, receiver);

      listeners.forEach((listener) => listener());
      return true;
    },
  });

  function subscribe(fn: Listener) {
    listeners.add(fn);
  }

  function watch(ds: Base) {
    ds.addEventListener("op", (e) => {
      const op = (e as CustomEvent<VisualOp>).detail;
      state["sequence"] = [...state["sequence"], op];
    });
  }

  return {
    state,
    subscribe,
    watch,
  };
}
export const { state, subscribe, watch } = createStore({
  step: 1,
  sequence: [],
});
