let isFinished = false;

function isSolution(subset, subsetLen, meta) {
  return subsetLen === meta.subsetSize;
}

function processSolution(subset, subsetLen, meta) {
  const soln = [];
  for (let idx = 0; idx <= subsetLen; idx++) {
    if (subset[idx]) soln.push(idx);
  }
  console.log(soln.join());
}

function generateCandidates(subset, subsetLen, meta) {
  return [true, false];
}

function backtracking(subset, subsetLen, meta) {
  // check if current solution vector is a solution
  if (isSolution(subset, subsetLen, meta))
    processSolution(subset, subsetLen, meta);
  else {
    subsetLen++;
    const candidates = generateCandidates(subset, subsetLen, meta);

    for (let i = 0; i < candidates.length; i++) {
      subset[subsetLen] = candidates[i];
      // todo:  make some move
      backtracking(subset, subsetLen, meta);
      //   todo: unmake some move
      if (isFinished) return;
    }
  }
}

const subset = Array.from({ length: 8 });
backtracking(subset, 0, { subsetSize: 3 });
