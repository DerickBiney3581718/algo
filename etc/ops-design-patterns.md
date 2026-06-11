# Operations Generation — Design Patterns

## The Problem

`TArray` needs to collect `VisualOp[]` as its methods run (insert, delete, search, etc.).
Every future data structure (LinkedList, Tree, Graph) will need the same thing.
The question is: where does that logic live so it isn't duplicated?

---

## Option 1: TypeScript Mixin

A mixin is a function that takes a base class and returns a new class with extra behaviour.
TypeScript supports this natively.

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

function WithOps<Base extends Constructor>(BaseClass: Base) {
  return class extends BaseClass {
    readonly ops: VisualOp[] = [];

    protected record(op: VisualOp) {
      this.ops.push(op);
    }

    clearOps() {
      this.ops.length = 0;
    }
  };
}

// Usage — TArray gains ops tracking for free
class TArray<T extends number | string> extends WithOps(Object) {
  insert(val: T) {
    // ...logic...
    this.record({ op: "insert", indices: [targetIdx] });
  }
}

// LinkedList gets the same without copy-paste
class LinkedList<T> extends WithOps(Object) {
  append(val: T) {
    // ...logic...
    this.record({ op: "insert" });
  }
}
```

**Pros**
- One place to add ops helpers (clearOps, replayOps, etc.)
- Can stack multiple mixins if needed

**Cons**
- TypeScript mixin typing gets awkward with generics — `WithOps(Object)` loses the base type
- Hard to mixin onto a class that already extends something (JS has single inheritance)
- The `Constructor` trick breaks down when the base class itself has generics

---

## Option 2: Abstract Base Class

All data structures extend a shared abstract class that owns the ops array.

```typescript
abstract class DSABase {
  protected readonly ops: VisualOp[] = [];

  protected record(op: VisualOp) {
    this.ops.push(op);
  }

  getOps(): VisualOp[] {
    return [...this.ops]; // return copy so caller can't mutate
  }

  clearOps() {
    this.ops.length = 0;
  }
}

class TArray<T extends number | string> extends DSABase {
  private arr: T[] = [];

  insert(val: T, idx?: number) {
    // ...logic...
    this.record({ op: "insert", indices: [idx ?? this.arr.length] });
  }
}

class LinkedList<T> extends DSABase {
  // gets ops tracking for free
}
```

**Pros**
- Simple and idiomatic — easy to read and extend
- Works naturally with generics
- Can add abstract methods to enforce interface (e.g., `abstract reset(): void`)
- TypeScript will infer types correctly across subclasses

**Cons**
- Locks in single inheritance — if a DS needs to extend something else, it can't
- Base class grows over time if you keep adding shared utilities (god class risk)

---

## Option 3: Composition (has-a, not is-a)

Each data structure holds an `OpsRecorder` instance instead of inheriting from one.

```typescript
class OpsRecorder {
  private ops: VisualOp[] = [];

  record(op: VisualOp) {
    this.ops.push(op);
  }

  getOps(): VisualOp[] {
    return [...this.ops];
  }

  clear() {
    this.ops.length = 0;
  }
}

class TArray<T extends number | string> {
  private arr: T[] = [];
  readonly recorder = new OpsRecorder();

  insert(val: T, idx?: number) {
    // ...logic...
    this.recorder.record({ op: "insert", indices: [idx ?? this.arr.length] });
  }
}

// Caller
const arr = new TArray([1, 2, 3]);
arr.insert(5);
const ops = arr.recorder.getOps();
```

**Pros**
- Most flexible — `OpsRecorder` can be shared, mocked, swapped
- No inheritance chain at all — data structures are free to extend whatever
- Easy to test `OpsRecorder` in isolation
- Aligns with arch.md's operation → timeline store pipeline

**Cons**
- Caller uses `arr.recorder.getOps()` not `arr.getOps()` — slightly more verbose
- You need to manually pass the recorder into every data structure

---

## Recommendation

**Use the abstract base class (Option 2)** for this project's scale.

- Mixins are powerful but their TypeScript generics story is painful — you'll fight the type system constantly
- Composition is the most correct OOP pattern but adds indirection that isn't needed yet
- Abstract base class is straightforward, TypeScript handles it cleanly, and it matches the existing class-based style of `TArray`

If the codebase later needs a data structure that must extend something else, extract `OpsRecorder` as a standalone class (Option 3) at that point. That migration is easy — it's just moving `ops` and `record()` out of the base class.

---

## Sketch of the Abstract Base

```typescript
// src/data-structures/DSABase.ts
import type { VisualOp } from "../types/dsa";

export abstract class DSABase {
  protected readonly ops: VisualOp[] = [];

  protected record(op: VisualOp) {
    this.ops.push(op);
  }

  getOps(): VisualOp[] {
    return [...this.ops];
  }

  clearOps(): void {
    this.ops.length = 0;
  }
}
```

```typescript
// src/data-structures/Array.ts
import { DSABase } from "./DSABase";
import { VISUAL_OPS_TYPES } from "../types/dsa";

class TArray<T extends number | string> extends DSABase {
  private arr: T[];

  constructor(initArr: Iterable<T>) {
    super(); // required for abstract base
    this.arr = Array.from(initArr);
  }

  insert(val: T, idx?: number) {
    // ...logic...
    this.record({ op: VISUAL_OPS_TYPES.INS, indices: [idx ?? this.arr.length] });
  }

  delete(idx: number) {
    // ...logic...
    this.record({ op: VISUAL_OPS_TYPES.DEL, indices: [idx] });
  }
}
```

The caller (DSA.ts / playback engine) then calls `arr.getOps()` after running an algorithm to get the full operation timeline.
