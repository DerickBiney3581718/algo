let isFinished = false;

function isSolution(perm, permLen, meta) {
  return permLen === meta.subsetSize;
}

function processSolution(perm, permLen, meta) {
  console.log("***", perm);
}

function generateCandidates(perm, permLen, meta) {
  return meta.options.filter((val) => !perm.slice(0, permLen).includes(val));
}

function backtracking(perm, permLen, meta) {
  // check if current solution vector is a solution
  if (isSolution(perm, permLen, meta)) processSolution(perm, permLen, meta);
  else {
    permLen++;
    const candidates = generateCandidates(perm, permLen, meta);

    for (let i = 0; i < candidates.length; i++) {
      perm[permLen] = candidates[i];
      // todo:  make some move
      backtracking(perm, permLen, meta);
      //   todo: unmake some move
      if (isFinished) return;
    }
  }
}

const DISTINCT_INTS = 3;
const perm = Array.from({ length: DISTINCT_INTS + 1 });
const options = Array.from({ length: DISTINCT_INTS }).map((_, idx) => idx + 1);

backtracking(perm, 0, { options, subsetSize: DISTINCT_INTS });
