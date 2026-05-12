function initGrid(seq, kParts) {
  const seqLen = seq.length;

  const grid = Array.from({ length: seqLen + 1 }).map((_, seqIdx) => {
    const minSums = Array.from({ length: kParts + 1 });
    if (seqIdx === 0) return minSums;
    if (seqIdx === 1) minSums.fill(seq[0]);
    minSums[1] = seq
      .slice(0, seqIdx)
      .reduce((currSum, currVal) => currSum + currVal, 0);
    return minSums;
  });
  return grid;
}

function partition(seq, kParts, grid) {
  const seqLen = seq.length;

  // 1. Pre-calculate prefix sums for speed
  const prefixSum = [0];
  for (let i = 0; i < seqLen; i++) prefixSum[i + 1] = prefixSum[i] + seq[i];

  for (let seqIdx = 2; seqIdx < seqLen + 1; seqIdx++) {
    for (let kPartIdx = 2; kPartIdx < kParts + 1; kPartIdx++) {
      let bestMaxForThisCell = Number.MAX_SAFE_INTEGER;

      for (let jIdx = 1; jIdx < seqIdx; jIdx++) {
        const rightSideCost = prefixSum[seqIdx] - prefixSum[jIdx]; // Sum from j to i
        const currentMax = Math.max(grid[jIdx][kPartIdx - 1], rightSideCost);

        if (currentMax < bestMaxForThisCell) {
          bestMaxForThisCell = currentMax;
        }
      }
      grid[seqIdx][kPartIdx] = bestMaxForThisCell;
    }
  }
}

function intPartition(seq, kParts) {
  const grid = initGrid(seq, kParts);
  console.log(grid);
  partition(seq, kParts, grid);
  console.log(grid);
}

const res = intPartition([100, 200, 300, 400, 500, 600, 700, 800, 900], 3);
