function binomialCoefficient(n, c) {
  const rows = Array.from({ length: n + 1 });
  rows.forEach((col, idx) => {
    rows[idx] = Array.from({ length: idx + 1 });
    rows[idx][0] = 1;
    rows[idx][idx] = 1;
  });

  console.log("rows; ", rows);
  for (let idx = 2; idx <= n; idx++) {
    const colsLen = rows[idx].length;
    for (let col = 1; col < colsLen; col++) {
      const topLeft = rows[idx - 1][col - 1];
      const topRight = rows[idx - 1][col] || 0;

      console.log("top right:", topRight, "top left: ", topLeft);
      rows[idx][col] = topLeft + topRight;
    }
  }
  console.log("after rows; ", rows);

  return rows[n][c];
}

const result = binomialCoefficient(5, 5);
console.log("result: ", result);
