function matrixMux(matrixA, matrixB, matrixARows, matrixACols, matrixBCols) {
  // assume matrices are compatible
  let matrixC = [];
  for (let idx = 0; idx < matrixARows; idx++) {
    matrixC.push([]);
    for (let idx2 = 0; idx2 < matrixBCols; idx2++) {
      matrixC[idx].push(0);
      for (let idx3 = 0; idx3 < matrixACols; idx3++) {
        //   perform dot product
        matrixC[idx][idx2] += matrixA[idx][idx3] * matrixB[idx3][idx2];
      }
    }
  }
  return matrixC;
}

const m1 = [
  [1, 2, 3],
  [4, 5, 6],
];
const m2 = [
  [1, 2],
  [2, 4],
  [5, 6],
];
m1Rows = m1.length;
m1Cols = m1[0].length;
m2Cols = m2[0].length;
console.log(`m1: ${m1}`);
console.log(`m2: ${m2}`);
console.log(`m1 rows: ${m1Rows}`);
console.log(`m1 cols: ${m1Cols}`);
console.log(`m2 cols: ${m2Cols}`);

console.log(matrixMux(m1, m2, m1Rows, m1Cols, m2Cols));
