# Anatomy of a "JavaScript heap out of memory" crash under Vitest

Reference for the crash produced by `src/algorithms/graphs/DirectedCycle.test.ts`.
Every section is one fragment of that error dump, what it actually means, and where
to read more.

---

## 0. The root cause (for this specific crash)

`DirectedCycle.ts`:

```ts
for (let index = src; index != null; this.edgeTo[index])
```

A `for` statement's third clause is the **update expression** — it is evaluated for
its side effects after each iteration. `this.edgeTo[index]` is a pure property read
with no side effect, so `index` never changes, `index != null` is permanently true,
and `cycle.push(index)` allocates forever. The intended line is:

```ts
for (let index = src; index != null; index = this.edgeTo[index])
```

Everything below is the machinery that reported this infinite allocation.

- MDN, `for` statement (the three clauses): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
- MDN, assignment operators: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment

---

## 1. `<--- Last few GCs --->`

Before V8 aborts, it prints the tail of its garbage-collection log so you can see
whether the heap was still growing. Reading one line:

```
[10108:0000019E6A0E5000]  32001 ms: Scavenge (interleaved)
   4054.6 (4132.9) -> 4054.6 (4133.9) MB, pooled: 0 MB,
   24.69 / 0.00 ms  (average mu = 0.221, current mu = 0.174) allocation failure;
```

| Field | Meaning |
|---|---|
| `[10108:0x...]` | OS process id : isolate address |
| `32001 ms` | ms since process start |
| `Scavenge` | which collector ran (see section 2) |
| `4054.6 (4132.9) -> 4054.6 (4133.9) MB` | heap used (total committed) **before** then **after** the GC |
| `24.69 / 0.00 ms` | time spent in GC / in external callbacks |
| `mu` | *mutator utilization* — fraction of time your code ran rather than the GC |
| `allocation failure` | the reason the GC was triggered |

The two diagnostic signals here:

1. **`4054.6 -> 4054.6`** — the collection freed *nothing*. Every object was still
   reachable, which is the signature of a leak or an unbounded data structure, not
   of ordinary memory pressure.
2. **`mu = 0.221` and falling** — only ~22% of wall-clock time was your program;
   the rest was GC thrash. Healthy processes sit near 1.0.

Also note `24.69 ms` becoming `513.50 ms` between the two logged GCs: collections
getting 20x slower while reclaiming nothing is the death spiral immediately
preceding the abort.

- V8 GC internals ("Trash talk: the Orinoco garbage collector"): https://v8.dev/blog/trash-talk
- Node.js diagnostics — memory: https://nodejs.org/en/learn/diagnostics/memory
- `--trace-gc` (how to print this log deliberately): https://nodejs.org/api/cli.html#--trace-gc

---

## 2. `Scavenge (interleaved)` and `pooled: 0 MB`

V8's heap is generational:

- **Young generation (new space)** — collected by **Scavenge**, a fast copying
  collector. Short-lived objects die here cheaply.
- **Old generation (old space)** — collected by **Mark-Compact** / **Mark-Sweep**,
  which is far more expensive. Objects that survive a couple of scavenges are
  *promoted* here.

Repeated `Scavenge` runs that free nothing mean every newly allocated object
survives and is being promoted into old space — exactly what an ever-growing
`Stack` does. `pooled: 0 MB` means V8 had no reclaimed pages held in reserve to
hand back.

`(interleaved)` marks a scavenge run interleaved with other work rather than as a
single stop-the-world pause.

- Generational GC in V8: https://v8.dev/blog/trash-talk
- Concurrent marking: https://v8.dev/blog/concurrent-marking
- Orinoco parallel scavenger: https://v8.dev/blog/orinoco-parallel-scavenger

---

## 3. `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`

V8 refuses to grow the old generation past a hard ceiling. When an allocation cannot
be satisfied and GC cannot free space, V8 calls its fatal error handler and the
process dies — this is **not** a catchable JavaScript exception. `try`/`catch` and
`process.on('uncaughtException')` cannot intercept it.

The ~4055 MB in the log is the default ceiling on a 64-bit machine (roughly 4 GB on
modern Node; it used to be ~1.5 GB and is now sized from available system memory).

Raising the ceiling is a diagnostic tool, not a fix — an infinite loop will exhaust
any limit you choose:

```bash
node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run
```

Via npm script (`NODE_OPTIONS` is inherited by the workers Vitest spawns):

```jsonc
// package.json
"scripts": {
  "test:big": "cross-env NODE_OPTIONS=--max-old-space-size=8192 vitest run"
}
```

- `--max-old-space-size`: https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes
- `NODE_OPTIONS`: https://nodejs.org/api/cli.html#node_optionsoptions
- `--heapsnapshot-near-heap-limit` (dump a heap snapshot just before this abort — the
  fastest way to see *which* objects filled the heap):
  https://nodejs.org/api/cli.html#--heapsnapshot-near-heap-limitmax_count
- `process.memoryUsage()`: https://nodejs.org/api/process.html#processmemoryusage

---

## 4. `----- Native stack trace -----` (`SetCppgcReference`, `ReportExternalAllocationLimitReached`, ...)

This is a **C++** stack, not a JavaScript one. It is the call chain *inside the Node
binary* at the moment of the abort, symbolized from the executable's export table.

Because only exported symbols can be named, the printer attributes each frame to the
nearest preceding exported symbol plus a byte offset — which is why you see
nonsensical-looking entries like `SSL_get_quiet_shutdown+102712` and
`v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+31456`. Those are
**not** really OpenSSL or allocator functions; they are static V8 GC internals living
some distance after an exported symbol. The trailing bare address
(`00007FF60FB6D4BA`) is a frame with no nearby symbol at all.

Practical takeaway: **this section is for Node/V8 maintainers and carries no
information about your code.** Skip it. `SetCppgcReference` and
`ReportExternalAllocationLimitReached` appearing here do not mean you have a cppgc or
external-allocation problem.

- Oilpan / cppgc (the C++ GC those symbols belong to): https://v8.dev/blog/high-performance-cpp-gc
- Node.js debugging guide: https://nodejs.org/en/learn/getting-started/debugging
- `--stack-trace-limit`: https://nodejs.org/api/cli.html#--stack-trace-limitn

---

## 5. `Error: [vitest-pool]: Worker forks emitted error.`

Vitest does not run your test file in the main process. It spawns a **pool** of
workers and runs test files inside them, for isolation and parallelism. The default
pool is `forks` (Node child processes via `child_process.fork()`); the alternative is
`threads` (worker_threads).

This message is the *pool manager* in the main process reporting that one of its
workers died. It is a consequence of section 3, not an independent failure.

When a worker keeps dying, run everything in one process so the crash is directly
debuggable and the stack is not marshalled across a process boundary:

```bash
npx vitest run --pool=forks --poolOptions.forks.singleFork
# or
npx vitest run --no-file-parallelism
```

- Vitest `pool` config: https://vitest.dev/config/#pool
- Vitest `poolOptions`: https://vitest.dev/config/#pooloptions
- Vitest common errors: https://vitest.dev/guide/common-errors.html
- `child_process.fork()`: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options

---

## 6. `EventEmitter.emit` / `ChildProcess.emitUnexpectedExit` / `Process.ChildProcess._handle.onexit`

The stack frames beneath the pool error are Node's event plumbing. Read bottom-up:

```
Process.ChildProcess._handle.onexit      <- libuv reports the child process ended
ChildProcess.emit                        <- ChildProcess (an EventEmitter) emits 'exit'
ChildProcess.emitUnexpectedExit          <- Vitest's listener: exit was not requested
EventEmitter.emit                        <- Vitest's own emitter re-emits as a task error
EventEmitter.onTaskError                 <- Vitest turns it into the reported error
```

`ChildProcess` extends `EventEmitter`, so Vitest subscribes to its `'exit'` event.
When V8 aborts the worker, the OS reaps it, libuv's `onexit` handle fires, and that
propagates up as the error you see. Nothing here is broken — it is the notification
path working correctly.

- `EventEmitter`: https://nodejs.org/api/events.html#class-eventemitter
- `ChildProcess` `'exit'` event: https://nodejs.org/api/child_process.html#event-exit
- `ChildProcess` class: https://nodejs.org/api/child_process.html#class-childprocess
- libuv process handles: https://docs.libuv.org/en/v1.x/process.html

---

## 7. `Unhandled Errors` / "This might cause false positive tests"

Vitest reports errors raised outside any test body separately, because they cannot be
attributed to an assertion. The warning matters: when a worker dies mid-run, the tests
it had not reached yet are never executed, and depending on the reporter they may be
counted as passing or simply omitted. **A run with unhandled errors is not a green
run**, regardless of the summary line.

- Vitest common errors: https://vitest.dev/guide/common-errors.html
- `dangerouslyIgnoreUnhandledErrors` (suppresses the report; almost never what you
  want): https://vitest.dev/config/#dangerouslyignoreunhandlederrors

---

## Debugging checklist for the next one

1. **Read the GC log first.** `X -> X MB` (no reclamation) means unbounded growth or
   a leak. `X -> much smaller MB` while still aborting means genuinely too little
   heap; raise `--max-old-space-size`.
2. **Ignore the native stack trace.** It describes the Node binary, not your program.
3. **Suspect loop termination before suspecting the platform.** In this codebase the
   candidates are `for` update expressions that don't assign, `while` conditions on a
   variable never mutated in the body, and linked-list traversals that never advance
   the cursor.
4. **Re-run single-process** (`--no-file-parallelism`) to get a clean, unmarshalled
   failure.
5. **If it isn't obvious, snapshot the heap:**
   `node --max-old-space-size=8192 --heapsnapshot-near-heap-limit=1 ./node_modules/vitest/vitest.mjs run`
   then open the `.heapsnapshot` in Chrome DevTools, Memory panel. The dominant
   retainer is the culprit.
   - https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots
6. **Guard recursive graph code with a bound** while developing — a visit counter that
   throws past `V * V` turns a 32-second OOM into an instant, readable failure.

---

## Related notes in this folder

- `abort-error-root-cause.md`
- `node-assert.md`
