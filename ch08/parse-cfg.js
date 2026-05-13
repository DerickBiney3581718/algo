const GRAMMAR_XYZ = [
  ["noun-phrase", "article", "noun"],
  ["verb-phrase", "verb", "noun-phrase"],
  ["sentence", "noun-phrase", "verb-phrase"],
];

const GRAMMAR_XA = [
  ["noun", "cat", "milk"],
  ["article", "the", "a"],
  ["verb", "drank"],
];

function getWordLabels(word) {
  const labels = [];
  GRAMMAR_XA.forEach((rule) => {
    if (rule.includes(word, 1)) labels.push(rule[0]);
  });
  return labels;
}

function getNewLabels(leftLabels, rightLabels) {
  const newLabels = [];
  for (let leftIdx = 0; leftIdx < leftLabels.length; leftIdx++) {
    for (let rightIdx = 0; rightIdx < rightLabels.length; rightIdx++) {
      for (let [label, ruleLeftLabel, ruleRightLabel] of GRAMMAR_XYZ) {
        const currLeftLabel = leftLabels[leftIdx];
        const currRightLabel = rightLabels[rightIdx];

        console.log(
          "curr left: ",
          currLeftLabel,
          "curr right: ",
          currRightLabel,
          "rule left: ",
          ruleLeftLabel,
          "rule right: ",
          ruleRightLabel,
          "label",
          label,
          currLeftLabel === ruleLeftLabel && currRightLabel === ruleRightLabel,
        );

        if (
          currLeftLabel === ruleLeftLabel &&
          currRightLabel === ruleRightLabel
        )
          newLabels.push(label);
      }
    }
  }
  return newLabels;
}

function initGrid(text) {
  const wordsList = text.trim().split(" ");
  wordsList.unshift(" ");
  const wordsListLength = wordsList.length;
  const grid = Array.from({ length: wordsListLength }).map((_, rowIdx) => {
    if (rowIdx === 0) {
      return;
    }
    if (rowIdx === 1) return wordsList.map((word) => getWordLabels(word));
    return Array.from({ length: wordsListLength - rowIdx + 1 }).map((_) => []);
  });
  return grid;
}

function parseCfg(text) {
  const grid = initGrid(text);
  console.log("grid: ", grid);
  const rows = grid.length;

  for (let chunk = 2; chunk < rows; chunk++) {
    const row = grid[chunk];
    const cols = row.length;

    // console.log("\n**********Need ", chunk, " chunks");

    for (let tokenCount = 1; tokenCount < cols; tokenCount++) {
      const newLabels = [];
      // console.log("\n---------------up to the", tokenCount, "th word");

      for (let splitIdx = 1; splitIdx < chunk; splitIdx++) {
        const leftLabels = grid[splitIdx][tokenCount];
        // console.log(
        //   "lft idx: ",
        //   splitIdx,
        //   tokenCount,
        //   "lft labels: ",
        //   leftLabels,
        // );

        const remainingChunk = chunk - splitIdx;
        const nextWord = tokenCount + splitIdx;
        const rightLabels = grid[remainingChunk][nextWord];

        // console.log(
        //   "remaining chunk",
        //   remainingChunk,
        //   "next word",
        //   nextWord,
        //   "right labels: ",
        //   rightLabels,
        // );

        console.log(
          "left labels: ",
          leftLabels,
          " right labels: ",
          rightLabels,
        );

        newLabels.push(...getNewLabels(leftLabels, rightLabels));
      }
      grid[chunk][tokenCount] = newLabels;
    }
  }

  console.log("grid: ", grid);
}

parseCfg("the cat drank the milk");
