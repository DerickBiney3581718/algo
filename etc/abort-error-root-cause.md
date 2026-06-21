# AbortError: Concurrent Operations & Animation Cancellation

## What triggers `AbortError` on `Animation.finished`

`Animation.finished` is a Promise that resolves when the animation completes naturally. The browser **rejects** it with `AbortError` when the animation is cancelled mid-flight. This happens in three situations:

1. `animation.cancel()` is called explicitly
2. The animated element is **removed from the DOM** — the browser cancels all its animations automatically
3. The document is unloaded

MDN ref: [Animation.finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished)  
MDN ref: [Web Animations API — cancelling](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API#controlling_playback)

---

## What's actually happening here

### The call site (`DSA.ts:52-53`)

```ts
ds.delete(3);   // fires DONE → callListeners() [Chain A]
ds.insert(45);  // fires DONE → callListeners() [Chain B]
```

Both run **synchronously and immediately**. By the time the second line executes, all ops from both operations are already in `store.sequence`, and `callListeners()` has been called **twice** — spawning two independent `setTimeout` chains that share the same `store.step` counter.

### The race in `store.ts`

```ts
function callback() {
  let { step, sequence } = store;
  if (step >= sequence.length) return;
  listeners.forEach((fn) => fn(sequence[step]));
  store.step += 1;          // ← both chains mutate this
  setTimeout(callback, INTER_OP_DELAY_MS);
}
```

Chain A and Chain B both read and increment `store.step`. They interleave unpredictably:

```
Chain A: step=0 → dispatch op[0], step becomes 1
Chain B: step=1 → dispatch op[1], step becomes 2   ← skipped op[0] for B's turn
Chain A: step=2 → dispatch op[2], step becomes 3
...
```

Operations get dispatched out-of-order and at double speed.

### Why the DOM node disappears

Each `DONE` op triggers a `STATE` op that re-renders the array DOM — likely replacing `#canvas` innerHTML or recreating child nodes. If `swapArray` is mid-`await Promise.all([...finished])` when this re-render fires, the `leftNode`/`rightNode` it holds references to are **removed from the DOM**. The browser immediately cancels their animations and rejects `.finished` with `AbortError`.

```
swapArray: leftNode.animate().finished  ← Promise pending
                    ↓
Chain B dispatches STATE op → DOM re-rendered → leftNode removed
                    ↓
Browser cancels animation → .finished rejects → AbortError
```

MDN ref: [Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)

---

## Your hypothesis vs reality

Your guess was close. It's not that the two ops run "simultaneously" in a threading sense (JS is single-threaded), but:

- Both ops complete **synchronously** before any animation starts, so both `DONE` events fire back-to-back
- This starts **two timer loops** on shared mutable state
- The second loop advances the step counter and triggers a re-render that **destroys the DOM nodes** the first loop's animation is waiting on
- That destruction cancels the animation → `AbortError`

---

## Fix direction

The store needs a **queue / lock**: `callListeners()` should only start a new playback chain if one isn't already running, and all ops should drain from a single chain in sequence.

```ts
// rough idea
let isPlaying = false;

function callListeners() {
  if (isPlaying) return;   // don't spawn a second chain
  isPlaying = true;
  function callback() { ... isPlaying = false when done ... }
  setTimeout(callback, INTER_OP_DELAY_MS);
}
```

A cleaner solution is an async queue (each op awaits the previous animation's `.finished` before advancing), so re-renders only happen after the animation settles.

Ref: [Task queues and microtasks — Jake Archibald](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
