import type { Base } from "../data-structures/Base";
import { VISUAL_OPS_TYPES, type VisualOp } from "../types/dsa";
import { INTER_OP_DELAY_MS } from "./helpers";
type storeSchema = {
  step: number;
  sequence: Array<VisualOp>;
  snapshots: Array<any>;
  isStepping: boolean;
};

type Listener = (state: VisualOp) => void;
function createStore<T extends storeSchema>(store: T) {
  const listeners = new Set<Listener>();

  const state = new Proxy(store, {
    set(target, key, value, receiver) {
      Reflect.set(target, key, value, receiver);

      return true;
    },
  });

  function subscribe(fn: Listener) {
    listeners.add(fn);
  }

  function callListeners() {
    async function callback() {
      let { step, sequence } = store;
      if (step >= sequence.length) {
        store.isStepping = false;
        return;
      }

      console.log("current step: ", step);

      for (const fn of listeners) await fn(sequence[step]);
      store.step += 1;

      setTimeout(callback, INTER_OP_DELAY_MS);
    }
    setTimeout(callback, INTER_OP_DELAY_MS);
  }

  function watch(ds: Base, reducer?: Listener) {
    ds.addEventListener("op", (e) => {
      const op = (e as CustomEvent<VisualOp>).detail;
      state["sequence"] = [...state["sequence"], op];

      if (op.op === VISUAL_OPS_TYPES.DONE) {
        if (!store.isStepping) {
          store.isStepping = true;
          callListeners();
        }
      }
    });
    if (reducer) subscribe(reducer);
  }

  return {
    state,
    subscribe,
    watch,
  };
}
export const { state, subscribe, watch } = createStore({
  step: 0,
  sequence: [],
  snapshots: [],
  isStepping: false,
});
