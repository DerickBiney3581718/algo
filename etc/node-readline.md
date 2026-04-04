# Reading Terminal Input in Node.js (`readline`)

Yes — Node.js supports interactive terminal input via the built-in `readline` module.

## The two patterns

### 1. `question()` — ask once, then proceed

```js
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const answer = await rl.question("Enter vertex count: ");
rl.close();  // must close or the process hangs

console.log(`You entered: ${answer}`);
```

`rl.question()` returns a Promise — use `await` (requires a top-level async
context or an `async` function wrapper). The program pauses until the user
presses Enter, then resumes.

**Important:** always call `rl.close()` when done. If the interface is left
open, Node keeps the event loop alive and the process never exits.

### 2. `"line"` event — read every line until EOF

Useful when you want to feed multiple values or pipe a file to the script:

```js
import readline from "node:readline";

const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  console.log("got:", line.trim());
});

rl.on("close", () => {
  console.log("done");
});
```

Terminates when the user presses Ctrl+D (EOF on Unix) or Ctrl+Z + Enter (Windows).

## Using it in graph.js

For building a graph interactively you would likely combine both patterns —
ask for the vertex/edge count first, then loop `question()` calls for each edge:

```js
import readline from "node:readline/promises";
import { Graph } from "./graph.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const nStr = await rl.question("Number of vertices: ");
const eStr = await rl.question("Number of edges: ");
const n = Number(nStr);
const e = Number(eStr);

const g = new Graph(false);

for (let i = 0; i < e; i++) {
  const line = await rl.question(`Edge ${i + 1} (u v): `);
  const [u, v] = line.trim().split(" ").map(Number);
  // insertEdge(g, u, v) — call whatever your Graph API exposes
}

rl.close();
```

## `readline` vs `readline/promises`

| Import | API style |
|---|---|
| `node:readline` | callback / event-based |
| `node:readline/promises` | Promise-based (`await`-friendly) |

Prefer `readline/promises` for sequential prompts — it reads linearly and
avoids nested callbacks.

## Resources

- [Node.js readline docs](https://nodejs.org/api/readline.html)
- [readline/promises (Promise-based API)](https://nodejs.org/api/readline.html#promises-api)
- [readline.createInterface options](https://nodejs.org/api/readline.html#readlinecreateinterfaceoptions)
