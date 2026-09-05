# Rule-Based Answer Matching: A DSA Crash Course

A ground-up guide to understanding, implementing, and improving every rule-based string matching technique — from first principles, without relying on packages.

**Reading order:** Work through the DSA prerequisites first (Part 1), then each method in Part 2 builds on them. Part 3 covers advanced data structures for production scale.

---

## Table of Contents

1. [Part 1 — DSA Prerequisites](#part-1--dsa-prerequisites)
   - 1.1 Strings & Unicode
   - 1.2 Hash Maps & Sets
   - 1.3 Sorting
   - 1.4 Dynamic Programming
   - 1.5 Trees
2. [Part 2 — Rule-Based Methods](#part-2--rule-based-methods)
   - 2.1 Tokenization & Normalization
   - 2.2 Exact Match with Hash Sets
   - 2.3 Edit Distance (Levenshtein)
   - 2.4 Jaro-Winkler Similarity
   - 2.5 N-gram Similarity (Jaccard)
   - 2.6 Token Sort & Token Set Ratio
   - 2.7 Soundex (Phonetic Hashing)
   - 2.8 Double Metaphone
3. [Part 3 — Advanced Data Structures for Scale](#part-3--advanced-data-structures-for-scale)
   - 3.1 Trie (Prefix Tree)
   - 3.2 BK-Tree (Fuzzy Dictionary)
   - 3.3 Inverted N-gram Index
4. [Part 4 — Pipeline Design & Threshold Tuning](#part-4--pipeline-design--threshold-tuning)

---

## Part 1 — DSA Prerequisites

Learn these concepts **before** diving into the methods. Each method section references back to these.

---

### 1.1 Strings & Unicode

**Why it matters:** Every algorithm here operates on strings. Getting character indexing, comparison, and Unicode handling wrong at this layer breaks everything above it.

**Key concepts:**

- A string is an immutable sequence of characters. In JavaScript/TypeScript, characters are UTF-16 code units.
- ASCII covers English letters (0–127). Thai characters are in the Unicode range U+0E00–U+0E7F.
- `str.length` counts UTF-16 code units, not visible characters. Emoji and some Thai characters use 2 code units (surrogate pairs).
- Always normalise before comparing: lowercase, trim whitespace, remove diacritics, Unicode normalise (`NFC`/`NFD`).

```typescript
// Safe normalisation before any comparison
function normalise(s: string): string {
  return s.trim().toLowerCase().normalize("NFC"); // Compose Unicode characters consistently
}

// Correct way to iterate over Unicode code points (handles surrogates)
function toCodePoints(s: string): string[] {
  return [...s]; // Spread uses the iterator, not UTF-16 indices
}
```

**Complexity:** String comparison is O(n) where n = length of the shorter string.

**Resources:**

- [The Absolute Minimum Every Software Developer Must Know About Unicode — Joel Spolsky](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/)
- [MDN: String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [Unicode Thai block reference](https://www.unicode.org/charts/PDF/U0E00.pdf)

---

### 1.2 Hash Maps & Sets

**Why it matters:** Exact matching, n-gram overlap, and token-set similarity all depend on O(1) average lookup. A naïve array scan is O(n) per lookup and becomes the bottleneck at scale.

**How a hash map works:**

1. Pass the key through a **hash function** → produces a bucket index.
2. Store the value at that bucket.
3. On lookup, hash the key again → jump directly to the bucket.

Collisions (two keys → same bucket) are handled by chaining (linked list per bucket) or open addressing (probe to next empty slot).

```typescript
// Manual hash map (educational — use Map<> in production)
class SimpleHashMap<V> {
  private buckets: Array<Array<[string, V]>>;
  private size: number;

  constructor(capacity = 64) {
    this.size = capacity;
    this.buckets = Array.from({ length: capacity }, () => []);
  }

  private hash(key: string): number {
    let h = 0;
    for (const ch of key) {
      h = (h * 31 + ch.charCodeAt(0)) % this.size;
    }
    return h;
  }

  set(key: string, value: V): void {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    const existing = bucket.find(([k]) => k === key);
    if (existing) existing[1] = value;
    else bucket.push([key, value]);
  }

  get(key: string): V | undefined {
    const idx = this.hash(key);
    return this.buckets[idx].find(([k]) => k === key)?.[1];
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}
```

**Complexity:** O(1) average set/get/has. O(n) worst case (all keys collide — rare with a good hash).

**Resources:**

- [Hash Table — Wikipedia](https://en.wikipedia.org/wiki/Hash_table)
- [CS50 Lecture: Hash Tables (YouTube)](https://www.youtube.com/watch?v=nvzVHwrrub0)
- [Visualgo Hash Table](https://visualgo.net/en/hashtable)

---

### 1.3 Sorting

**Why it matters:** Token Sort Ratio (section 2.6) requires sorting word tokens before comparing. Understanding sorting helps you reason about when the cost is acceptable.

**Key algorithm — Merge Sort (O(n log n), stable):**

```typescript
function mergeSort(arr: string[]): string[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: string[], right: string[]): string[] {
  const result: string[] = [];
  let i = 0,
    j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

**Complexity:** Time O(n log n), Space O(n). For short answer strings (< 20 words), even O(n²) sorts are fine — optimise only when sorting large corpora.

**Resources:**

- [Sorting Algorithms — Visualgo](https://visualgo.net/en/sorting)
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/)

---

### 1.4 Dynamic Programming

**Why it matters:** Levenshtein distance (section 2.3) is the canonical DP problem. Understanding DP is the gateway to a whole family of sequence alignment algorithms.

**Core idea:** Break a problem into overlapping subproblems, solve each once, store results in a table (memoization or bottom-up tabulation).

**Pattern to recognise:** "What is the cost of operating on prefix A[0..i] and prefix B[0..j]?" → 2D table of size (m+1) × (n+1).

```typescript
// Generic DP template: longest common subsequence
function lcs(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  // dp[i][j] = LCS length of a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp[m][n];
}
```

**Complexity:** O(m × n) time and space. The space can be reduced to O(min(m,n)) by keeping only two rows at a time.

**Resources:**

- [Dynamic Programming — MIT OpenCourseWare (YouTube)](https://www.youtube.com/watch?v=OQ5jsbhAv_M)
- [DP Patterns — LeetCode discuss](https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns)
- [Visualising Edit Distance](https://www.cs.usfca.edu/~galles/visualization/DPLEDIT.html)

---

### 1.5 Trees

**Why it matters:** Tries (section 3.1) and BK-Trees (section 3.2) are the primary data structures for efficient large-scale fuzzy matching. You cannot understand them without understanding trees first.

**Key vocabulary:**

- **Node** — contains a value and references to children.
- **Root** — the top node with no parent.
- **Leaf** — a node with no children.
- **Depth** — number of edges from root to node.
- **Edge** — a parent–child connection, often labelled (as in tries).

```typescript
// Generic tree node
interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

// Depth-first traversal (recursive)
function dfs<T>(node: TreeNode<T>, visit: (v: T) => void): void {
  visit(node.value);
  for (const child of node.children) dfs(child, visit);
}

// Breadth-first traversal (queue-based)
function bfs<T>(root: TreeNode<T>, visit: (v: T) => void): void {
  const queue: TreeNode<T>[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    visit(node.value);
    queue.push(...node.children);
  }
}
```

**Resources:**

- [Tree Data Structures — CS50 (YouTube)](https://www.youtube.com/watch?v=YISbQLzA6jU)
- [Visualgo Binary Search Tree](https://visualgo.net/en/bst)
- [Trie Visualiser](https://www.cs.usfca.edu/~galles/visualization/Trie.html)

---

## Part 2 — Rule-Based Methods

---

### 2.1 Tokenization & Normalization

**DSA used:** Strings (1.1).

**What it solves:** The current `.includes()` bug where `"land"` matches `"Thailand"`. Tokenization splits the stored answer string into discrete accepted values so each is compared as a whole unit.

**The algorithm:**

1. Split stored answer on comma delimiter.
2. For each token: trim whitespace, lowercase, Unicode-normalise.
3. Build a Set of accepted tokens.
4. Normalise player answer the same way.
5. Check Set membership.

```typescript
function normalise(s: string): string {
  return s.trim().toLowerCase().normalize("NFC");
}

function tokenize(stored: string): Set<string> {
  return new Set(stored.split(",").map(normalise).filter(Boolean));
}

function tokenExactMatch(stored: string, playerAnswer: string): boolean {
  const accepted = tokenize(stored);
  return accepted.has(normalise(playerAnswer));
}

// Example:
// stored      = "Thailand,TH,Siam"
// playerAnswer = "  Siam  "
// accepted     = {"thailand", "th", "siam"}
// normalised player = "siam"
// result: true ✓
```

**Complexity:** O(k) build where k = number of tokens. O(1) lookup.

**Improvement ideas:**

- Strip common filler words ("the", "a", "an") before tokenising.
- Also strip punctuation: `s.replace(/[^\p{L}\p{N}\s]/gu, '')`.
- Expand stored tokens with known synonyms at question creation time.

**Resources:**

- [Tokenization — NLP Demystified](https://www.nlpdemystified.org/course/tokenization)

---

### 2.2 Exact Match with Hash Sets (multi-field)

**DSA used:** Hash Maps & Sets (1.2).

**What it solves:** Efficient lookup when the accepted answer set is large, or when you need to support multiple normalisation passes (lowercase, stripped, transliterated) each as a separate set.

**The algorithm:**

Build multiple Sets at index time, one per normalisation strategy. At query time, run the player answer through each strategy and check the corresponding set.

```typescript
interface AnswerIndex {
  raw: Set<string>;
  stripped: Set<string>; // punctuation removed
  noSpaces: Set<string>; // spaces removed (handles "south east" vs "southeast")
}

function buildIndex(stored: string): AnswerIndex {
  const tokens = stored.split(",").map((s) => s.trim().toLowerCase());
  return {
    raw: new Set(tokens),
    stripped: new Set(tokens.map((t) => t.replace(/[^\p{L}\p{N}]/gu, ""))),
    noSpaces: new Set(tokens.map((t) => t.replace(/\s+/g, ""))),
  };
}

function multiNormMatch(index: AnswerIndex, playerAnswer: string): boolean {
  const lower = playerAnswer.trim().toLowerCase();
  const stripped = lower.replace(/[^\p{L}\p{N}]/gu, "");
  const noSpaces = lower.replace(/\s+/g, "");

  return (
    index.raw.has(lower) ||
    index.stripped.has(stripped) ||
    index.noSpaces.has(noSpaces)
  );
}
```

**Store the index alongside the question** so it's computed once, not on every answer submission.

**Complexity:** O(k) build, O(1) per lookup strategy. Total O(s) per query where s = number of strategies.

---

### 2.3 Edit Distance (Levenshtein)

**DSA used:** Dynamic Programming (1.4), Strings (1.1).

**What it solves:** Typos, misspellings, transpositions. Measures how many single-character operations (insert, delete, substitute) are needed to turn one string into another.

**The recurrence:**

```
dp[0][j] = j                          (delete all of a[0..j-1])
dp[i][0] = i                          (insert all of b[0..i-1])

if a[i-1] === b[j-1]:
  dp[i][j] = dp[i-1][j-1]            (no op needed)
else:
  dp[i][j] = 1 + min(
    dp[i-1][j],                       (delete from a)
    dp[i][j-1],                       (insert into a)
    dp[i-1][j-1]                      (substitute)
  )
```

**Full implementation:**

```typescript
function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;

  // Optimisation: only keep two rows, not the full m×n table
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;

    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // delete
        curr[j - 1] + 1, // insert
        prev[j - 1] + cost, // substitute
      );
    }

    [prev, curr] = [curr, prev]; // swap rows
  }

  return prev[n]; // prev holds the last completed row
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function fuzzyMatch(stored: string, player: string, threshold = 0.85): boolean {
  const tokens = stored.split(",").map((s) => s.trim().toLowerCase());
  const p = player.trim().toLowerCase();
  return tokens.some((t) => levenshteinSimilarity(t, p) >= threshold);
}
```

**Trace example:**

```
a = "cat"   b = "cut"

     ""  c  u  t
""  [ 0  1  2  3 ]
c   [ 1  0  1  2 ]
a   [ 2  1  1  2 ]
t   [ 3  2  2  1 ]

Distance = 1 (substitute a→u)
```

**Complexity:** O(m × n) time. O(min(m,n)) space with the two-row optimisation.

**Damerau-Levenshtein variant:** Also counts transpositions (`"teh"` → `"the"` = distance 1 instead of 2). Better for catching common keyboard typos.

```typescript
// Add transposition case to the recurrence
if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
  curr[j] = Math.min(curr[j], prev2[j - 2] + cost); // prev2 = row i-2
}
```

**Resources:**

- [Edit Distance — MIT 6.006 lecture](https://www.youtube.com/watch?v=Ako4EFSY3cg)
- [Levenshtein interactive visualiser](https://www.cs.usfca.edu/~galles/visualization/DPLEDIT.html)
- [Wikipedia: Damerau–Levenshtein distance](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance)

---

### 2.4 Jaro-Winkler Similarity

**DSA used:** Strings (1.1), counting with arrays.

**What it solves:** Better than Levenshtein for short strings and proper nouns. Weights prefix agreement more heavily — useful for names like `"Thailand"` vs `"Tailand"`.

**Algorithm — Jaro:**

Two characters are _matching_ if they are identical and not further apart than `floor(max(|s1|,|s2|)/2) - 1`.

```
jaro(s1, s2) = 0                                    if m = 0
jaro(s1, s2) = (m/|s1| + m/|s2| + (m-t)/m) / 3    otherwise

where:
  m = number of matching characters
  t = number of transpositions / 2
```

**Jaro-Winkler adds a prefix bonus:**

```
jaro_winkler(s1, s2) = jaro + p * l * (1 - jaro)

where:
  l = length of common prefix (max 4)
  p = scaling factor (standard: 0.1)
```

```typescript
function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length,
    len2 = s2.length;
  const matchDist = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  let matches = 0,
    transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3
  );
}

function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  const jaroSim = jaro(s1, s2);
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaroSim + prefix * p * (1 - jaroSim);
}
```

**When to prefer over Levenshtein:** Short strings (names, country codes), when prefix matches should score higher, when transpositions are more likely than arbitrary substitutions.

**Resources:**

- [Jaro-Winkler — Wikipedia](https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance)
- [String Similarity Algorithms Compared](https://itnext.io/string-similarity-the-basic-know-your-algorithms-guide-3de3d7346227)

---

### 2.5 N-gram Similarity (Jaccard)

**DSA used:** Hash Sets (1.2), Sliding window technique.

**What it solves:** Handles character-level overlap regardless of insertion/deletion order. Good for longer strings and transliterations where edit distance becomes expensive.

**What is an n-gram?** A contiguous sequence of n characters from a string. For `"cat"` with n=2 (bigrams): `{"ca", "at"}`.

**Jaccard similarity:** The ratio of the intersection to the union of two sets.

```
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

```typescript
function ngrams(s: string, n: number): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i <= s.length - n; i++) {
    result.add(s.slice(i, i + n));
  }
  return result;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

function ngramSimilarity(s1: string, s2: string, n = 2): number {
  const g1 = ngrams(s1, n);
  const g2 = ngrams(s2, n);
  return jaccard(g1, g2);
}

// Example:
// "thailand" bigrams: {th, ha, ai, il, la, an, nd}
// "tailand"  bigrams: {ta, ai, il, la, an, nd}
// intersection: {ai, il, la, an, nd} = 5
// union: 7 + 6 - 5 = 8
// Jaccard = 5/8 = 0.625
```

**Dice coefficient** is a similar metric, often preferred over Jaccard for NLP because it double-weights the intersection:

```
Dice(A, B) = 2 * |A ∩ B| / (|A| + |B|)
```

```typescript
function diceCoefficient(s1: string, s2: string, n = 2): number {
  const g1 = ngrams(s1, n);
  const g2 = ngrams(s2, n);
  let intersection = 0;
  for (const item of g1) if (g2.has(item)) intersection++;
  return (2 * intersection) / (g1.size + g2.size);
}
```

**Choosing n:**

- n=1 (unigrams): catches character overlap, no order information.
- n=2 (bigrams): good balance for short strings.
- n=3 (trigrams): better for longer strings, misses short ones.

**Resources:**

- [N-gram — Wikipedia](https://en.wikipedia.org/wiki/N-gram)
- [Jaccard index — Wikipedia](https://en.wikipedia.org/wiki/Jaccard_index)
- [Dice Coefficient — Wikipedia](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient)

---

### 2.6 Token Sort & Token Set Ratio

**DSA used:** Sorting (1.3), Hash Sets (1.2), Levenshtein (2.3).

**What it solves:** Word-order variation. `"land of smiles the"` should match `"the land of smiles"`. These are extensions of Levenshtein that operate on sorted/deduplicated token sequences rather than raw characters.

#### Token Sort Ratio

Sort both strings' tokens alphabetically, rejoin with spaces, then compute Levenshtein similarity on the resulting strings.

```typescript
function tokenSortRatio(s1: string, s2: string): number {
  const sort = (s: string) =>
    s.trim().toLowerCase().split(/\s+/).sort().join(" ");

  return levenshteinSimilarity(sort(s1), sort(s2));
}

// "land of smiles the"  → sorted: "land of smiles the"  → "land of smiles the"
// "the land of smiles"  → sorted: "land of smiles the"  → "land of smiles the"
// Levenshtein sim = 1.0 ✓
```

#### Token Set Ratio

More powerful: take the intersection of tokens as a common base, then separately append the remainder from each string. Compare the three combinations.

```typescript
function tokenSetRatio(s1: string, s2: string): number {
  const tokens1 = new Set(s1.trim().toLowerCase().split(/\s+/));
  const tokens2 = new Set(s2.trim().toLowerCase().split(/\s+/));

  const intersection: string[] = [];
  const only1: string[] = [];
  const only2: string[] = [];

  for (const t of tokens1) {
    if (tokens2.has(t)) intersection.push(t);
    else only1.push(t);
  }
  for (const t of tokens2) {
    if (!tokens1.has(t)) only2.push(t);
  }

  intersection.sort();
  only1.sort();
  only2.sort();

  const base = intersection.join(" ");
  const str1 = [base, ...only1].join(" ").trim();
  const str2 = [base, ...only2].join(" ").trim();

  return Math.max(
    levenshteinSimilarity(base, str1),
    levenshteinSimilarity(base, str2),
    levenshteinSimilarity(str1, str2),
  );
}
```

**When to use:**

- Token Sort: player might answer in a different word order.
- Token Set: player answer is a subset or superset of the correct answer (e.g. extra filler words).

**Resources:**

- [FuzzyWuzzy — original Python implementation](https://github.com/seatgeek/fuzzywuzzy)
- [How FuzzyWuzzy works — Adam Cohen blog](https://chairnerd.seatgeek.com/fuzzywuzzy-fuzzy-string-matching-in-python/)

---

### 2.7 Soundex (Phonetic Hashing)

**DSA used:** Strings (1.1), encoding tables (hash map).

**What it solves:** Catches phonetically identical but differently spelled answers. `"Smith"` and `"Smyth"` both encode to `S530`. Designed for English names.

**Algorithm (US Census Soundex):**

1. Keep the first letter.
2. Remove all occurrences of H and W.
3. Replace remaining letters according to the table:
   - `B F P V` → 1
   - `C G J K Q S X Z` → 2
   - `D T` → 3
   - `L` → 4
   - `M N` → 5
   - `R` → 6
   - Vowels `A E I O U` → 0 (remove)
4. Remove consecutive duplicate digits.
5. Remove all 0s.
6. Pad or truncate to exactly 4 characters (letter + 3 digits).

```typescript
const SOUNDEX_TABLE: Record<string, string> = {
  B: "1",
  F: "1",
  P: "1",
  V: "1",
  C: "2",
  G: "2",
  J: "2",
  K: "2",
  Q: "2",
  S: "2",
  X: "2",
  Z: "2",
  D: "3",
  T: "3",
  L: "4",
  M: "5",
  N: "5",
  R: "6",
};

function soundex(s: string): string {
  const upper = s.toUpperCase().replace(/[^A-Z]/g, "");
  if (!upper) return "";

  const first = upper[0];
  let code = first;

  let prevDigit = SOUNDEX_TABLE[first] ?? "0";

  for (let i = 1; i < upper.length && code.length < 4; i++) {
    const ch = upper[i];
    if (ch === "H" || ch === "W") continue; // skip HW
    const digit = SOUNDEX_TABLE[ch] ?? "0";
    if (digit !== "0" && digit !== prevDigit) {
      // skip vowels and duplicates
      code += digit;
    }
    prevDigit = digit;
  }

  return code.padEnd(4, "0"); // pad to length 4
}

function soundexMatch(stored: string, player: string): boolean {
  const tokens = stored.split(",").map((s) => s.trim());
  const pCode = soundex(player);
  return tokens.some((t) => soundex(t) === pCode);
}

// soundex("Thailand")  → T543
// soundex("Tailand")   → T453  (different — Soundex is better for simpler names)
// soundex("Smith")     → S530
// soundex("Smyth")     → S530  ✓
```

**Limitation:** Designed for English names, not effective for Thai transliterations or technical terms. Also loses a lot of information — false positive rate is high for short strings.

**Resources:**

- [Soundex — Wikipedia](https://en.wikipedia.org/wiki/Soundex)
- [Original US Census Soundex documentation](https://www.archives.gov/research/census/soundex.html)

---

### 2.8 Double Metaphone

**DSA used:** Strings (1.1), rule-based encoding (finite state logic).

**What it solves:** More accurate phonetic encoding than Soundex. Handles a wider variety of languages including Spanish, Italian, Germanic, and Slavic names that appear in English contexts. Returns two codes (primary and alternate) to handle pronunciation ambiguity.

**Why it's better than Soundex:**

- Context-sensitive rules (e.g. `"GN"` at start → skip `G`).
- Handles silent letters, digraphs (`CH`, `PH`, `TH`).
- Two outputs reduce false negatives.

The full Double Metaphone algorithm is ~400 lines of rule tables. Below is a skeletal implementation showing the structural approach:

```typescript
// Skeletal Double Metaphone — shows structure, not all rules
// Full implementation: https://github.com/words/double-metaphone
function doubleMetaphone(word: string): [string, string] {
  const upper = word.toUpperCase();
  let primary = "",
    secondary = "";
  let pos = 0;

  // Helper to look ahead
  const at = (offset: number, len = 1) =>
    upper.slice(pos + offset, pos + offset + len);

  // Skip silent initial letters
  if (["GN", "KN", "PN", "AE", "WR"].some((p) => upper.startsWith(p))) pos++;

  while (pos < upper.length && (primary.length < 4 || secondary.length < 4)) {
    const ch = upper[pos];

    switch (ch) {
      case "A":
      case "E":
      case "I":
      case "O":
      case "U":
      case "Y":
        if (pos === 0) {
          primary += "A";
          secondary += "A";
        }
        pos++;
        break;

      case "B":
        primary += "P";
        secondary += "P";
        pos += upper[pos + 1] === "B" ? 2 : 1;
        break;

      case "C":
        if (at(1) === "I" || at(1) === "E" || at(1) === "Y") {
          primary += "S";
          secondary += "S"; // "city" → S
        } else if (at(1) === "H") {
          primary += "X";
          secondary += "K"; // "echo" → X / K (ambiguous)
          pos++;
        } else {
          primary += "K";
          secondary += "K";
        }
        pos++;
        break;

      // ... ~30 more cases with full context rules
      default:
        pos++;
        break;
    }
  }

  return [primary.slice(0, 4), secondary.slice(0, 4)];
}

function doubleMetaphoneMatch(stored: string, player: string): boolean {
  const [pp1, pp2] = doubleMetaphone(player);
  return stored.split(",").some((t) => {
    const [tp1, tp2] = doubleMetaphone(t.trim());
    return tp1 === pp1 || tp1 === pp2 || tp2 === pp1;
  });
}
```

**Recommendation:** Use the battle-tested `double-metaphone` npm package for production; study the source for the full rule tables if you want to understand it deeply.

**Resources:**

- [Double Metaphone algorithm — Lawrence Philips (original paper)](https://dl.acm.org/doi/10.5555/349124.349132)
- [Wikipedia: Metaphone](https://en.wikipedia.org/wiki/Metaphone)
- [Full open-source implementation (JavaScript, 340 lines)](https://github.com/words/double-metaphone/blob/main/index.js)

---

## Part 3 — Advanced Data Structures for Scale

The methods in Part 2 work fine for single comparisons. When you need to find the closest match in a **large dictionary of accepted answers** efficiently, you need specialised data structures.

---

### 3.1 Trie (Prefix Tree)

**DSA used:** Trees (1.5), Hash Maps (1.2).

**What it solves:** Efficient prefix matching. Instead of comparing a query against every accepted answer (O(k × n)), a Trie finds all strings that share a prefix in O(m) time where m = query length. Useful for autocorrect-style suggestions.

**Structure:** Each node represents a character. Edges are labelled with characters. A path from root to a marked node spells out a stored string.

```
Stored: ["Thailand", "TH", "Siam"]

         root
        / | \
       T  S  ...
       |  |
       H  i
      /|  |
(TH) a  ...
      |
      i
      ...
    (Thailand)
```

```typescript
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
  value = ""; // store the original string at terminal nodes
}

class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
    node.value = word;
  }

  // Exact search: O(m) where m = word length
  search(word: string): boolean {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }

  // Prefix search: returns all stored words with given prefix
  startsWith(prefix: string): string[] {
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      if (!node.children.has(ch)) return [];
      node = node.children.get(ch)!;
    }
    return this.collectAll(node);
  }

  private collectAll(node: TrieNode): string[] {
    const result: string[] = [];
    if (node.isEnd) result.push(node.value);
    for (const child of node.children.values()) {
      result.push(...this.collectAll(child));
    }
    return result;
  }
}
```

**Extending to fuzzy prefix search:** At each Trie node, track the edit distance accumulated so far. Prune branches where accumulated distance already exceeds the threshold. This gives approximate dictionary lookup in sub-linear time for large dictionaries.

**Complexity:**

- Insert: O(m)
- Exact search: O(m)
- Prefix collect: O(m + output size)
- Space: O(alphabet_size × total_characters_stored)

**Resources:**

- [Trie — Visualgo](https://visualgo.net/en/suffixtree) (click "Trie" tab)
- [Implement Trie — LeetCode 208](https://leetcode.com/problems/implement-trie-prefix-tree/)
- [Fuzzy search in a Trie — blog post](https://medium.com/@pasdan/levenshtein-automaton-faster-string-search-using-trie-82f71ffca6e0)

---

### 3.2 BK-Tree (Burkhard-Keller Tree)

**DSA used:** Trees (1.5), Levenshtein (2.3), triangle inequality.

**What it solves:** Efficiently find all strings in a dictionary within edit distance `d` of a query. Naïve approach: compute Levenshtein against every dictionary entry = O(k × m × n). A BK-Tree prunes branches using the **metric space triangle inequality**: if `dist(root, query) = r`, then any result must satisfy `r - d ≤ dist(root, result) ≤ r + d`.

**Structure:** Each node stores a word. Each edge is labelled with the Levenshtein distance from the parent to the child.

```typescript
interface BKNode {
  word: string;
  children: Map<number, BKNode>;
}

class BKTree {
  root: BKNode | null = null;

  insert(word: string): void {
    if (!this.root) {
      this.root = { word, children: new Map() };
      return;
    }

    let node = this.root;
    while (true) {
      const d = levenshtein(word, node.word);
      if (d === 0) return; // duplicate
      if (!node.children.has(d)) {
        node.children.set(d, { word, children: new Map() });
        return;
      }
      node = node.children.get(d)!;
    }
  }

  // Find all words within edit distance `maxDist` of query
  search(query: string, maxDist: number): string[] {
    if (!this.root) return [];
    const results: string[] = [];
    const stack: BKNode[] = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      const d = levenshtein(query, node.word);

      if (d <= maxDist) results.push(node.word);

      // Only recurse into children where edge label is in [d-maxDist, d+maxDist]
      for (const [edgeDist, child] of node.children) {
        if (Math.abs(edgeDist - d) <= maxDist) stack.push(child);
      }
    }

    return results;
  }
}

// Usage: build once at startup, query on every player answer
const tree = new BKTree();
["Thailand", "TH", "Siam"].forEach((w) => tree.insert(w.toLowerCase()));

tree.search("thialand", 2); // → ["thailand"]  (distance 1)
tree.search("sm", 1); // → []
tree.search("sian", 1); // → ["siam"]       (distance 1)
```

**Why BK-Trees work:** The triangle inequality guarantees that if the distance between the query and a node is `d`, then no descendant connected via an edge with label outside `[d - maxDist, d + maxDist]` can be within `maxDist` of the query. This prunes the majority of the tree.

**Complexity:**

- Build: O(k × n²) where k = dictionary size, n = average word length.
- Search: O(k^(maxDist / alphabet_size)) — sub-linear in practice for small maxDist.

**Resources:**

- [BK-Tree — Wikipedia](https://en.wikipedia.org/wiki/BK-tree)
- [BK-Trees explained — blog post (with diagrams)](https://signal-to-noise.xyz/post/bk-tree/)
- [Original paper: Burkhard & Keller, 1973](https://dl.acm.org/doi/10.1145/362003.362025)

---

### 3.3 Inverted N-gram Index

**DSA used:** Hash Maps (1.2), N-grams (2.5).

**What it solves:** Fast candidate retrieval for n-gram similarity. Instead of computing bigrams for every dictionary entry on each query, pre-index all dictionary bigrams → entry mappings. Query time: extract bigrams from player answer, look up candidates from index, compute exact similarity only for candidates.

```typescript
class NgramIndex {
  private index = new Map<string, Set<string>>(); // bigram → set of words
  private words = new Set<string>();

  add(word: string, n = 2): void {
    this.words.add(word);
    const lower = word.toLowerCase();
    for (let i = 0; i <= lower.length - n; i++) {
      const gram = lower.slice(i, i + n);
      if (!this.index.has(gram)) this.index.set(gram, new Set());
      this.index.get(gram)!.add(word);
    }
  }

  // Returns candidate words sharing at least one n-gram with query
  candidates(query: string, n = 2): Set<string> {
    const result = new Set<string>();
    const lower = query.toLowerCase();
    for (let i = 0; i <= lower.length - n; i++) {
      const gram = lower.slice(i, i + n);
      for (const word of this.index.get(gram) ?? []) {
        result.add(word);
      }
    }
    return result;
  }

  // Full search: get candidates, then rank by dice coefficient
  search(query: string, threshold = 0.5, n = 2): string[] {
    return Array.from(this.candidates(query, n))
      .map((w) => ({ w, score: diceCoefficient(query, w, n) }))
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(({ w }) => w);
  }
}
```

**Complexity:**

- Build: O(k × m) where k = dictionary size, m = avg word length.
- Query: O(m + |candidates| × m) — much faster than O(k × m) naïve scan when candidates << k.

---

## Part 4 — Pipeline Design & Threshold Tuning

### Combining methods

Each method has a different precision/recall tradeoff. Stack them cheapest-first:

```
Player answer
    │
    ▼
[1] Tokenized exact match          — O(1), zero false positives
    │ no match
    ▼
[2] Multi-norm exact (no spaces,   — O(s) per strategy
    stripped punctuation)
    │ no match
    ▼
[3] Levenshtein fuzzy              — O(m×n), catches typos
    threshold ≥ 0.85
    │ no match
    ▼
[4] N-gram / Dice similarity       — O(m), catches reordering
    threshold ≥ 0.60
    │ no match
    ▼
[5] Jaro-Winkler                   — O(m), good for short names
    threshold ≥ 0.88
    │ no match
    ▼
    wrong (or pass to ML layer)
```

### Threshold selection

There is no universal "correct" threshold. Tune empirically:

1. Collect 200+ labelled player answer pairs (correct / wrong).
2. For each method, plot precision-recall at every threshold from 0.5–1.0.
3. Choose the threshold at the desired **F1 score** (harmonic mean of precision and recall).
4. Store thresholds per question type: open-text geography questions may need a looser threshold than food science questions.

### Performance considerations

| Concern                        | Solution                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Large accepted answer set      | Pre-build a BK-Tree at question creation; query it at answer time              |
| High concurrency               | All rule-based methods are stateless and thread-safe; compute in parallel      |
| Thai transliteration variation | Add transliteration normalisation pass before comparison                       |
| Numbers / units                | Normalise `"10 kg"` → `"10kg"` → `10` before comparing                         |
| Abbreviations                  | Expand abbreviations in the stored answer: `"TH"` → `"thailand"` at index time |

---

## Quick Reference

| Method                | DSA                        | Best for                             | Weakness              |
| --------------------- | -------------------------- | ------------------------------------ | --------------------- |
| Tokenized exact       | Hash Set                   | Comma-separated accepted answers     | Exact only            |
| Multi-norm exact      | Hash Map                   | Spacing / punctuation variants       | Exact only            |
| Levenshtein           | DP 2D table                | Typos, misspellings                  | Slow on long strings  |
| Damerau-Levenshtein   | DP + transpositions        | Keyboard transpositions              | Same                  |
| Jaro-Winkler          | Counting arrays            | Short names, prefix matches          | Poor for long text    |
| N-gram / Jaccard      | Hash Sets + sliding window | Reordering, transliteration          | n selection is fiddly |
| Token Sort            | Sort + Levenshtein         | Word order variation                 | Loses positional info |
| Token Set             | Set ops + Levenshtein      | Subset/superset answers              | Complex to tune       |
| Soundex               | Encoding table             | English phonetic names               | English only, lossy   |
| Double Metaphone      | Rule-based encoding        | Multi-language phonetics             | English-centric rules |
| Trie                  | Prefix tree                | Prefix/autocorrect lookup            | Memory intensive      |
| BK-Tree               | Metric tree                | Fuzzy dictionary lookup at scale     | Build cost            |
| Inverted n-gram index | Inverted index             | Large-dictionary candidate retrieval | Index size            |
