# Global Store Patterns

## 1. Your current approach: module singleton

```ts
// store.ts
export const store = new Map();
store.set("step", 1);
store.set("sequence", []);
```

```ts
// any file that needs it
import { store } from "../common/store";
store.get("step");
```

**Does this give you one shared store?** Yes. The JS module system caches every module after its first evaluation. `new Map()` runs exactly once — every file that imports `store` gets a reference to the same object. This holds in both ESM and CommonJS, and in bundlers like Vite (single bundle, single module cache).

**Caveat:** This breaks if the store ends up in multiple bundles that don't share a runtime (e.g. micro-frontends, workers, SSR vs client). For a single-page app like this one, it's completely safe.

**You do NOT need to import it at the top of `main.ts` to pre-initialize it.** Since the store body is synchronous (just `new Map()` + two `.set` calls), the first file that actually uses it will initialize it on the spot. Import-at-top is only useful when initialization has side effects that need to happen before anything else (timers, listeners, async setup).

---

## 2. The unused import problem

If you import a module purely for its side effects (initialization) but don't use the binding, TypeScript's `noUnusedLocals` flag and ESLint's `no-unused-vars` will complain.

### Option A — side-effect import (idiomatic)

```ts
import "../common/store"; // no binding, just run the module
```

TypeScript and ESLint both treat this as intentional. It means "run this module for its side effects."

### Option B — don't import it in main at all

For this project the store initializes synchronously, so whichever module first does `import { store } from "../common/store"` will trigger initialization. No top-level import in `main.ts` needed.

### Option C — re-export it from a barrel

```ts
// common/index.ts
export { store } from "./store";
```

Other modules import from the barrel and the singleton is naturally shared.

---

## 3. Typed map (recommended upgrade)

A plain `Map()` loses type information. Narrow it so callers know what they're getting:

```ts
type StoreSchema = {
  step: number;
  sequence: unknown[];
};

class TypedStore {
  private map = new Map<keyof StoreSchema, StoreSchema[keyof StoreSchema]>();

  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return this.map.get(key) as StoreSchema[K];
  }

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]) {
    this.map.set(key, value);
  }
}

export const store = new TypedStore();
store.set("step", 1);
store.set("sequence", []);
```

Now `store.get("step")` returns `number`, not `unknown`.

---

## 4. Other patterns (for reference)

### Reactive store (Proxy-based)

Intercepts writes and notifies subscribers. Useful when the UI needs to re-render automatically on state change.

```ts
type Listener = () => void;

function createStore<T extends object>(init: T) {
  const listeners = new Set<Listener>();
  const state = new Proxy(init, {
    set(target, key, value) {
      Reflect.set(target, key, value);
      listeners.forEach(fn => fn());
      return true;
    },
  });
  return {
    state,
    subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

export const { state, subscribe } = createStore({ step: 1, sequence: [] as unknown[] });
```

### globalThis (avoid unless necessary)

```ts
(globalThis as any).__store = store;
```

Works across module boundaries (workers, iframes) but loses all type safety and pollutes the global namespace. Use only as a last resort.

---

## 5. Reactive store architecture — the full picture

### The question you raised

> "The DS would have to call the store's listener when there are updates... the store subscribes to the data structure, right?"

Yes — and both halves are correct. There are two independent observer relationships:

```
DS method call
    ↓  emits VisualOp
Store (subscriber of DS)
    ↓  updates sequence/step state
UI / Playback (subscriber of Store)
    ↓  re-renders
```

The DS should not know the store exists. The store should not know the UI exists. Each layer only knows about the layer below it.

---

### Why not just call the store directly from the DS?

`Base.recordOps` already accumulates `VisualOp[]`. If DS methods directly mutated the store, you'd couple every data structure to a specific store implementation. That makes DS methods untestable in isolation and means you can never use a DS outside the app context (e.g. in a worker, in a test).

**The DS's job is to produce a sequence of operations. What happens to that sequence is not its concern.**

---

### Architecture option A — Observer / EventEmitter (simplest for this project)

The DS emits events. The store listens. The store emits on state change. The UI listens.

```
TArray.insert()
  → this.emit('op', { op: 'insert', indices: [2] })

Store.onOp(op)
  → appends to sequence
  → notifies UI subscribers

Playback
  → subscribes to store
  → steps through sequence on user input
```

`Base` already has `recordOps` — this just replaces the internal array with an emitter. No external dependency needed: the browser's `EventTarget` or a tiny custom emitter is sufficient.

This is the right pattern **when the sequence is consumed after the fact** (record all ops, then replay). It matches your current `step` + `sequence` store shape.

- [MDN — EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
- [Node.js EventEmitter (concept reference)](https://nodejs.org/api/events.html)

---

### Architecture option B — Redux / Flux (action → reducer → state)

The classic unidirectional data flow:

```
DS method call
  → dispatches Action: { type: 'INSERT', payload: { indices: [2] } }

Dispatcher (central)
  → routes Action to the right Reducer

Reducer (pure function)
  → (currentState, action) → nextState

Store
  → holds current state
  → notifies subscribers when state changes

UI
  → subscribes, re-renders on notification
```

**Key properties:**
- State is never mutated directly — reducers return new state
- Any action can be replayed or time-travelled (great for your playback feature)
- Adding a new op type = adding a new reducer case, nothing else changes
- Reducers are pure functions, trivially testable

The cost is boilerplate: you need an action type for every operation. For this project's `VisualOp` type, the actions already exist — they just need a dispatcher in front of them.

- [Redux docs — motivation](https://redux.js.org/understanding/thinking-in-redux/motivation)
- [Flux architecture overview](https://facebookarchive.github.io/flux/docs/in-depth-overview)

---

### Architecture option C — Reactive streams (Observable)

`Base.recordOps` pushes to a stream. The store subscribes to the stream and transforms it (filter, buffer, map). The UI subscribes to the transformed stream.

```
DS method → Subject.next(op)
Store      → pipe(scan((seq, op) => [...seq, op], []))
UI         → subscribe(seq => render(seq))
```

`scan` is the key operator — it's a running reducer over a stream, equivalent to `Array.reduce` but for async/push events. This is exactly the Redux reducer pattern expressed as a stream transformation.

This is the most powerful option but requires RxJS (or a minimal Observable implementation). It pays off when you need to debounce, buffer, or combine event streams — e.g. stepping through ops at a timed interval, or merging ops from multiple concurrent data structures.

- [RxJS — scan operator](https://rxjs.dev/api/operators/scan)
- [RxJS — Subject](https://rxjs.dev/guide/subject)
- [The introduction to Reactive Programming you've been missing (Gist)](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)

---

### Which to choose

| Pattern | Best when |
|---|---|
| EventEmitter + Observer | Simple, sequential ops, no time-travel needed — **good fit for this project now** |
| Redux / Flux | You want strict action history, replay, undo, or multiple reducers acting on the same action |
| Reactive streams | Async event streams, rate control, combining multiple DS event sources |

Your store's current shape (`step: number`, `sequence: VisualOp[]`) maps cleanly onto the Redux model: `sequence` is the accumulated state, each `VisualOp` is an action, the playback controller is the subscriber. You don't need the full Redux library — the pattern itself is what matters.

---

### Where `Base.recordOps` fits

Right now `Base` accumulates ops into `this.operations`. That's essentially a local event log. The architectural move is:

- Keep `recordOps` as the DS-side API (DS doesn't change)
- Replace the internal array with an emitter or subject
- The store subscribes to that emitter
- When the DS is "done" (or after each op, depending on playback design), the store's sequence updates and notifies the UI

The DS never imports the store. The store imports (or receives) a DS instance and calls `.subscribe` (or attaches a listener). This is dependency inversion — high-level policy (store) depends on an abstraction (emitter interface on Base), not on a concrete DS.

- [Wikipedia — Observer pattern](https://en.wikipedia.org/wiki/Observer_pattern)
- [Wikipedia — Dependency inversion principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Martin Fowler — Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

---

## When to upgrade from module singleton

| Need | Use |
|---|---|
| Simple shared state, no reactivity | Module singleton (current) |
| Type-safe key/value access | Typed map (option 3) |
| UI auto-updates on state change | Proxy reactive store |
| Cross-worker / cross-frame state | `BroadcastChannel` or `SharedArrayBuffer` |

---

## Resources

- [MDN — JavaScript modules (caching behavior)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN — Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [TypeScript Handbook — Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript `noUnusedLocals`](https://www.typescriptlang.org/tsconfig#noUnusedLocals)
