# Swap Animation Options for `swapArray`

Context: `swapArray` in `src/components/arrays/Array.ts` currently swaps slot values after a flat `delay()`. The transition is abrupt. Below are three approaches to make it smooth.

---

## Option 1: Slide with `translateX`

Animate the two slots physically crossing each other. Left slot moves right by the distance between them; right slot moves left by the same amount. Swap the values at the midpoint, then reset transforms.

```ts
function swapArray(rootNode: Node, state: VisualOp) {
  if (!state.indices?.length) return;
  const [left, right] = state.indices;
  const leftNode = rootNode.childNodes[left] as HTMLElement;
  const rightNode = rootNode.childNodes[right] as HTMLElement;

  const distance = (right - left) * SLOT_WIDTH * 16; // rem → px (1rem = 16px)
  const duration = 600;

  leftNode.style.transition = `transform ${duration}ms ease`;
  rightNode.style.transition = `transform ${duration}ms ease`;

  leftNode.style.transform = `translateX(${distance}px)`;
  rightNode.style.transform = `translateX(-${distance}px)`;

  setTimeout(() => {
    const buffer = getSlotValue(leftNode);
    updateSlotValue(leftNode, getSlotValue(rightNode));
    updateSlotValue(rightNode, buffer);

    leftNode.style.transition = "none";
    rightNode.style.transition = "none";
    leftNode.style.transform = "";
    rightNode.style.transform = "";
  }, duration);
}
```

**Pros:** Most visually informative — direction of swap is explicit.  
**Cons:** Needs accurate px conversion for `rem`; slots must not overlap other layout elements during animation.

**Resources:**
- [MDN: CSS transform — translateX](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translateX)
- [MDN: CSS transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition)
- [CSS Tricks: Animating with CSS transforms](https://css-tricks.com/almanac/properties/t/transform/)

---

## Option 2: Fade Out → Swap → Fade In

Fade both slots to invisible, swap the text content at the midpoint, then fade back in. Works entirely through CSS `opacity` transition.

```ts
function swapArray(rootNode: Node, state: VisualOp) {
  if (!state.indices?.length) return;
  const [left, right] = state.indices;
  const leftNode = rootNode.childNodes[left] as HTMLElement;
  const rightNode = rootNode.childNodes[right] as HTMLElement;

  const half = 300;
  leftNode.style.transition = `opacity ${half}ms ease`;
  rightNode.style.transition = `opacity ${half}ms ease`;
  leftNode.style.opacity = "0";
  rightNode.style.opacity = "0";

  setTimeout(() => {
    const buffer = getSlotValue(leftNode);
    updateSlotValue(leftNode, getSlotValue(rightNode));
    updateSlotValue(rightNode, buffer);

    leftNode.style.opacity = "1";
    rightNode.style.opacity = "1";
  }, half);
}
```

**Pros:** Simplest to implement; no layout/position concerns.  
**Cons:** Doesn't convey direction — the viewer can't tell which value moved where.

**Resources:**
- [MDN: CSS opacity](https://developer.mozilla.org/en-US/docs/Web/CSS/opacity)
- [MDN: CSS transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition)

---

## Option 3: Web Animations API (Recommended)

Use `element.animate()` which returns an `Animation` object with a `.finished` promise. Lets you sequence steps cleanly with `async/await` — no nested `delay()` or `setTimeout` calls. Pairs well with the existing `// todo: change to promises` in `delArray`.

```ts
async function swapArray(rootNode: Node, state: VisualOp) {
  if (!state.indices?.length) return;
  const [left, right] = state.indices;
  const leftNode = rootNode.childNodes[left] as HTMLElement;
  const rightNode = rootNode.childNodes[right] as HTMLElement;

  const distance = (right - left) * SLOT_WIDTH * 16;
  const opts: KeyframeAnimationOptions = { duration: 600, easing: "ease", fill: "forwards" };

  await Promise.all([
    leftNode.animate([{ transform: "translateX(0)" }, { transform: `translateX(${distance}px)` }], opts).finished,
    rightNode.animate([{ transform: "translateX(0)" }, { transform: `translateX(-${distance}px)` }], opts).finished,
  ]);

  const buffer = getSlotValue(leftNode);
  updateSlotValue(leftNode, getSlotValue(rightNode));
  updateSlotValue(rightNode, buffer);

  leftNode.getAnimations().forEach((a) => a.cancel());
  rightNode.getAnimations().forEach((a) => a.cancel());
}
```

**Pros:** Promise-based sequencing; no nested callbacks; composable with other async animation steps.  
**Cons:** Slightly more verbose. `fill: "forwards"` holds the final keyframe state, so you must cancel the animation after swapping or the transform persists.

**Resources:**
- [MDN: Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
- [MDN: Animation.finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished)
- [MDN: KeyframeEffect](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect)
- [web.dev: Orchestrating animations with the Web Animations API](https://web.dev/articles/web-animations)

---

## Comparison

| | Visual clarity | Code complexity | Sequencing |
|---|---|---|---|
| translateX (CSS) | High | Low | Callback/timeout |
| Fade (CSS) | Low | Lowest | Callback/timeout |
| Web Animations API | High | Medium | async/await |
