// TABLE

const MATCH_SUB = 0;
const INSERT = 1;
const DELETE = 2;

function stringMatch(pattern, text, metadata) {
  const INDEL_COST = 1;
  console.log("pattern: ", pattern, "text: ", text);

  const patternLen = pattern.length;
  const textLen = text.length;

  const grid = Array.from({ length: patternLen + 1 }).map((row) =>
    Array.from({ length: textLen + 1 }),
  );

  function getCost(rowIdx, colIdx) {
    return grid[rowIdx][colIdx].cost;
  }

  function setCost(rowIdx, colIdx, cost, parent = null) {
    grid[rowIdx][colIdx] = { cost, parent };
  }

  metadata.initGrid(grid);
  for (let rowIdx = 1; rowIdx <= patternLen; rowIdx++) {
    for (let colIdx = 1; colIdx <= textLen; colIdx++) {
      const editCosts = [];
      editCosts[MATCH_SUB] =
        getCost(rowIdx - 1, colIdx - 1) +
        metadata.isMatched(pattern, text, colIdx, rowIdx);
      editCosts[INSERT] = getCost(rowIdx, colIdx - 1) + INDEL_COST;
      editCosts[DELETE] = getCost(rowIdx - 1, colIdx) + INDEL_COST;

      const lowestCostIdx = editCosts.reduce(
        (prevCostIdx, currCost, currIdx, editCosts) => {
          if (prevCostIdx === -1) return currIdx;
          return editCosts[prevCostIdx] > editCosts[currIdx]
            ? currIdx
            : prevCostIdx;
        },
        -1,
      );

      setCost(rowIdx, colIdx, editCosts[lowestCostIdx], lowestCostIdx);
    }
  }

  //   any custom method
  metadata.postMatchFn(grid, patternLen, textLen);
  return grid[patternLen][textLen];
}

function initRows(grid) {}

function postMatchFn(grid, rowIdx, colIdx, fromStart) {
  function reconstructStr(grid, rowIdx, colIdx, editPath, fromStart = true) {
    if (rowIdx < 0 || colIdx < 0) return;
    const { cost, parent } = grid[rowIdx][colIdx];
    if (parent === null) return;

    let nextRowIdx = null;
    let nextColIdx = null;
    let editPrefix = null;

    switch (parent) {
      case MATCH_SUB:
        nextRowIdx = rowIdx - 1;
        nextColIdx = colIdx - 1;
        prevCost = grid[nextRowIdx][nextColIdx].cost;

        editPrefix = prevCost === cost ? "M" : "S";
        break;
      case INSERT:
        nextRowIdx = rowIdx;
        nextColIdx = colIdx - 1;
        editPrefix = "I";

      case DELETE:
        nextRowIdx = rowIdx - 1;
        nextColIdx = colIdx;
        editPrefix = "D";
        break;
    }

    if (fromStart) editPath.push(editPrefix);
    reconstructStr(grid, nextRowIdx, nextColIdx, editPath);
    if (!fromStart) editPath.push(editPrefix);
  }
  const editPath = [];
  reconstructStr(grid, rowIdx, colIdx, editPath);
  console.log("reconstructing...", editPath);
}

const isMatched = (pattern, text, colIdx, rowIdx) => {
  // this is for longest common subSequence: LCS
  return text[colIdx - 1] !== pattern[rowIdx - 1] ? Number.MAX_SAFE_INTEGER : 0;
};

const PATTERN = "thou shalt not";
const TEXT = "you should not";
const res = stringMatch(PATTERN, TEXT, {
  initGrid,
  postMatchFn,
  isMatched,
});
console.log(res);
