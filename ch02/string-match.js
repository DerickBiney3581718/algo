function stringMatch(text, pattern) {
  const textLen = text.length;
  const patternLen = pattern.length;

  for (let ind = 0; ind <= textLen - patternLen; ind++) {
    let nestIdx = 0;
    while (nestIdx < patternLen && text[ind + nestIdx] == pattern[nestIdx])
      nestIdx += 1;

    if (nestIdx == patternLen) return ind;
  }
  return;
}

const text = "bostonia";
console.log(stringMatch(text, "oston"));
