class Board {
  matrix;
  freeCount;
  matrixDegrees;
  moves;

  constructor(rows, cols, initMatrix) {
    if (
      typeof rows !== "number" ||
      rows <= 0 ||
      typeof cols !== "number" ||
      cols <= 0
    )
      throw new Error("rows and columns must be positive integers");

    this.matrix = Array.from({ length: rows });
    this.matrixDegrees = Array.from({ length: rows });

    for (let idx = 0; idx < rows; idx++) {
      this.matrix[idx] = Array.from({ length: cols });
      this.matrixDegrees[idx] = Array.from({ length: cols }).map(() => cols);
    }
    this.freeCount = rows * cols;
  }

  fillSquare({ row: tempRow, col: tempCol }, value) {
    const [row, col, rowId, colId] = this.getRowAndColIds({
      tempCol,
      tempRow,
    });
    this.matrix[row][col] = value;
    --this.freeCount;
    this.updateMatrixDegrees({ row, col, rowId, colId });
  }

  emptySquare({ row: tempRow, col: tempCol }) {
    const [row, col, rowId, colId] = this.getRowAndColIds({
      tempRow,
      tempCol,
    });
    this.matrix[row][col] = null;
    ++this.freeCount;
    this.updateMatrixDegrees({ row, col, rowId, colId });
  }

  updateMatrixDegrees({ row, col, rowId, colId }) {
    const { rowDegrees, colDegrees, subMatrixDegrees } = this.getAllDegrees({
      row,
      col,
    });
    this.updateAllColValues(col, colDegrees);
    this.updateAllRowValues(row, rowDegrees);
    this.updateSubMatrix({ rowId, colId, currentDegree: subMatrixDegrees });
  }

  updateAllColValues(col, currentDegree) {
    this.matrixDegrees.forEach((row) => (row[col] = currentDegree));
  }

  updateSubMatrix({ rowId, colId, currentDegree }) {
    let [rowStart, rowEnd] = this.getSliceFromId(rowId);
    let [colStart, colEnd] = this.getSliceFromId(colId);

    this.matrixDegrees.slice(rowStart, rowEnd).forEach((row, rowIdx) => {
      row.slice(colStart, colEnd).forEach((val, colIdx) => {
        this.matrixDegrees[rowIdx][colIdx] = currentDegree;
      });
    });
  }

  updateAllRowValues(row, currentDegree) {
    this.matrixDegrees[row].forEach(
      (_, idx) => (this.matrixDegrees[row][idx] = currentDegree),
    );
  }

  getAllDegrees({ row: tempRow, col: tempCol }) {
    const [row, col, rowId, colId] = this.getRowAndColIds({ tempRow, tempCol });

    const allColValues = this.getAllColumnValues(col);

    const allRowValues = this.getAllRowValues(row);

    const allSubMatrixValues = this.getSubMatrixValues(rowId, colId);

    return {
      colDegrees: allColValues.length,
      rowDegrees: allRowValues.length,
      subMatrixDegrees: allSubMatrixValues.length,
    };
  }

  getInvalidOptions({ row: tempRow, col: tempCol }) {
    const [row, col, rowId, colId] = this.getRowAndColIds({ tempRow, tempCol });

    const allColValues = this.getAllColumnValues(col);

    const allRowValues = this.getAllRowValues(row);

    const allSubMatrixValues = this.getSubMatrixValues(rowId, colId);

    const valueSet = new Set([
      ...allColValues,
      ...allRowValues,
      ...allSubMatrixValues,
    ]);

    return Array.from(valueSet);
  }

  getSliceFromId(id) {
    switch (id) {
      case 0:
        return [0, 3];

      case 1:
        return [3, 6];

      case 2:
        return [6, 9];
      default:
        throw new Error(`Invalid row or column id:${id}`);
    }
  }

  getNextSquare() {
    let min = DIMENSIONS;
    let position = null;

    for (let rowIdx = 0; rowIdx < this.matrixDegrees.length; rowIdx++) {
      for (
        let colIdx = 0;
        colIdx < this.matrixDegrees[rowIdx].length;
        colIdx++
      ) {
        const currDegree = this.matrixDegrees[rowIdx][colIdx];
        const curr = this.matrix[rowIdx][colIdx];

        if (curr === undefined && currDegree <= min) {
          min = currDegree;
          position = { row: rowIdx, col: colIdx };
        }
      }
    }

    console.log("min...position", min, position);
    return position;
  }

  getAllRowValues(row) {
    return this.matrix[row].filter((val) => val);
  }

  getAllColumnValues(col) {
    return this.matrix.map((row) => row[col]).filter((val) => val);
  }

  getSubMatrixValues(rowId, colId) {
    let [rowStart, rowEnd] = this.getSliceFromId(rowId);
    let [colStart, colEnd] = this.getSliceFromId(colId);

    return this.matrix
      .slice(rowStart, rowEnd)
      .flatMap((row) => row.slice(colStart, colEnd))
      .filter((val) => val);
  }

  getRowAndColIds({ counter, tempRow, tempCol }) {
    const row = tempRow ?? Math.floor(counter / DIMENSIONS);
    const col = tempCol ?? counter % DIMENSIONS;

    const rowId = Math.floor(row / SUB_MATRIX);
    const colId = Math.floor(col / SUB_MATRIX);
    return [row, col, rowId, colId];
  }
}

let isFinished = false;

function isSolution(perm, permLen, meta) {
  isFinished = meta.board.freeCount === 0;
  return isFinished;
}

function processSolution(perm, permLen, meta) {
  console.log("processing...", meta.board);
}

function generateCandidates(perm, permLen, meta) {
  const nextSquare = meta.board.getNextSquare(); //using most constrained square and looking ahead for squares with no option returns coordinates
  if (nextSquare === null) return [];
  perm[permLen] = nextSquare;
  const invalidOptions = meta.board.getInvalidOptions(nextSquare);
  return meta.options.filter((val) => !invalidOptions.includes(val));
}

function backtracking(perm, permLen, meta) {
  // check if current solution vector is a solution
  if (isSolution(perm, permLen, meta)) processSolution(perm, permLen, meta);
  else {
    permLen++;
    const candidates = generateCandidates(perm, permLen, meta);

    const currentSquare = perm[permLen];
    console.log(
      "permLen;currentSquare, candidates: ",
      permLen,
      currentSquare,
      candidates,
    );
    for (let i = 0; i < candidates.length; i++) {
      meta.board.fillSquare(currentSquare, candidates[i]); // todo:  make some move
      backtracking(perm, permLen, meta);
      meta.board.emptySquare(currentSquare); //   todo: unmake some move

      if (isFinished) return;
    }
  }
}

const DIMENSIONS = 9;
const NCELLS = DIMENSIONS * DIMENSIONS;
const SUB_MATRIX = 3;

const perm = Array.from({ length: NCELLS });
const options = Array.from({ length: DIMENSIONS }).map((_, idx) => idx + 1);

const board = new Board(DIMENSIONS, DIMENSIONS);

backtracking(perm, -1, { options, board, nCells: NCELLS });
