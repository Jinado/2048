function Simulation() {
    this.game = window.game;
    this.spawnChance2 = Number(document.querySelector('#spawn-chance-2').value);
    this.autoPlay = false;
    this.optimalMove = null;

    this.Keys = {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3
    };

    this.ScoreWeight = {
        EMPTY: 50,
        MERGES: 10,
        POSITION: 20,
        MAX_TILE: 10000
    };

    this.maxDepth = Number(document.querySelector('#max-depth').value);

    this.init();
}

Simulation.prototype.init = function () {
    document.querySelector('#spawn-chance-2')
        .addEventListener('change', this.changeSpawnChance.bind(this));

    document.querySelector('#max-depth')
        .addEventListener('change', this.changeMaxDepth.bind(this));

    document.querySelector('#btn-autoplay')
        .addEventListener('click', this.handleAutoplayButton.bind(this));

    document.querySelector('#btn-manual-play')
        .addEventListener('click', this.playNextMove.bind(this));

    document.querySelector('#btn-set-grid')
        .addEventListener('click', this.handleSetGridButton.bind(this));

    document.querySelector('a.restart-button')
        .addEventListener('click', this.restartHandler.bind(this));

    document.querySelector('a.retry-button')
        .addEventListener('click', this.restartHandler.bind(this));

    document.querySelector('#score-weight-empty')
        .addEventListener('change', this.updateScoreWeightEmpty.bind(this));

    document.querySelector('#score-weight-merges')
        .addEventListener('change', this.updateScoreWeightMerges.bind(this));

    document.querySelector('#score-weight-position')
        .addEventListener('change', this.updateScoreWeightPosition.bind(this));

    document.querySelector('#score-weight-max-tile')
        .addEventListener('change', this.updateScoreWeightMaxTile.bind(this));
};

Simulation.prototype.updateScoreWeightEmpty = function () {
  this.ScoreWeight.EMPTY = Number(document.querySelector('#score-weight-empty').value);
};

Simulation.prototype.updateScoreWeightMerges = function () {
    this.ScoreWeight.MERGES = Number(document.querySelector('#score-weight-merges').value);
};

Simulation.prototype.updateScoreWeightPosition = function () {
    this.ScoreWeight.POSITION = Number(document.querySelector('#score-weight-position').value);
};

Simulation.prototype.updateScoreWeightMaxTile = function () {
    this.ScoreWeight.MAX_TILE = Number(document.querySelector('#score-weight-max-tile').value);
};

Simulation.prototype.getTileValue = function (board, x, y) {
  const tile = (board[x] || null)[y] || null;
  return tile ? tile.value : 0;
};

Simulation.prototype.handleSetGridButton = function () {
    const values = document.querySelectorAll('.grid-value');
    const normalizedGrid = Array.from(values).map(el => {
       const position = { x: Number(el.dataset.x), y: Number(el.dataset.y) };
       const value = Number(el.value) || null;

       return { position, value };
    }).reduce((grid, cell, idx) => {
        grid[idx % 4].push(cell.value ? cell : null);
        return grid;
    }, [[], [], [], []]);

    this.game.setGrid(normalizedGrid);

    this.game.actuator.actuate(this.game.grid, {
        score:      this.game.score,
        over:       this.game.over,
        won:        this.game.won,
        bestScore:  this.game.storageManager.getBestScore(),
        terminated: this.game.isGameTerminated()
    });

    this.optimalMove = this.getNextMove();
    this.updateOptimalMoveText();
};

Simulation.prototype.handleAutoplayButton = function (e) {
  const button = e.target;
  const btnManual = document.querySelector('#btn-manual-play');

  if(!this.autoPlay) {
      this.autoPlay = true;
      button.innerText = 'Cancel';

      btnManual.disabled = true;

      this.playNextMove();
      return;
  }

  this.autoPlay = false;
  button.innerText = 'Autoplay';
  btnManual.disabled = false;

  this.optimalMove = this.getNextMove();
  this.updateOptimalMoveText();
  this.optimalMove = null;
  this.copyBoardToTextFields();
};

Simulation.prototype.changeSpawnChance = function (e) {
    this.spawnChance2 = Number(e.target.value);

    document.querySelector('#spawn-chance-2-help-text')
        .innerText = this.spawnChance2;

    document.querySelector('#spawn-chance-4-help-text')
        .innerText = 100 - this.spawnChance2;
};

Simulation.prototype.changeMaxDepth = function (e) {
    this.maxDepth = Number(e.target.value);
};

Simulation.prototype.getTotalEmptySpaces = function (board) {
    let total = 0;

    board.forEach(row => {
        row.forEach(col => {
           if(col !== null) return;
           total++;
        });
    });

    return total;
};

Simulation.prototype.areCellsOfEqualValue = function (a, b) {
  if(!a || !b) return false;
  return Number(a.value) === Number(b.value);
};

Simulation.prototype.getTotalPossibleMerges = function (board) {
    let total = 0;

    for(let x = 0; x < this.game.size; x++) {
        for(let y = 0; y < this.game.size; y++) {
            const cell = board[x][y];

            const cellAbove = board[x][y + 1] || null;
            const cellRight = (board[x + 1] || [])[y] || null;

            if(this.areCellsOfEqualValue(cell, cellAbove)) {
                total++;
            }

            if(this.areCellsOfEqualValue(cell, cellRight)) {
                total++;
            }
        }
    }

    return total;
};

Simulation.prototype.isHighestValueTileInTopRight = function (board) {
    let highestValueIsInCorner = false;
    let highestValue = 0;

    for(let x = 0; x < this.game.size; x++) {
        for(let y = 0; y < this.game.size; y++) {
            const cell = board[x][y];
            if(!cell) continue;

            highestValue = Math.max(cell.value, highestValue);
            if(cell.value === highestValue) {
                // Top right corner
                highestValueIsInCorner = Number(x) === 3 && Number(y) === 0;
            }
        }
    }

    return highestValueIsInCorner;
};

Simulation.prototype.getPositionScore = function (board) {
    let total = 0;

    const x0y0 = this.getTileValue(board, 0, 0);
    const x1y0 = this.getTileValue(board, 1, 0);
    const x2y0 = this.getTileValue(board, 2, 0);
    const x3y0 = this.getTileValue(board, 3, 0);

    // Tiles are ordered in the top row going low to high, left to right
    if((x0y0 < x1y0) && (x1y0 < x2y0) && (x2y0 < x3y0)) {
        total++;
    }

    // Each next tile is exactly one tile larger than the previous tile
    if((x0y0 === (x1y0 / 2)) && (x1y0 === (x2y0 / 2)) && (x2y0 === (x3y0 / 2))) {
        total += 5;
    }

    return total;
};

Simulation.prototype.calculateFinalScore = function (board) {
    let score = 0;

    const position = this.getPositionScore(board);
    score = score + (position * this.ScoreWeight.POSITION);

    const maxValueIsInCorner = this.isHighestValueTileInTopRight(board);
    score = score + (maxValueIsInCorner ? this.ScoreWeight.MAX_TILE : 0);

    const emptySpaces = this.getTotalEmptySpaces(board);
    score = score + (emptySpaces * this.ScoreWeight.EMPTY);

    const merges = this.getTotalPossibleMerges(board);
    score = score + (merges * this.ScoreWeight.MERGES);

    return score;
};

Simulation.prototype.calculateMoveScore = function (board, currentDepth) {
    let bestScore = 0;

    for(let direction in Object.values(this.Keys)) {
        const newBoard = this.simulateMove(board, direction);
        if(this.areBoardsEqual(board, newBoard)) continue;

        const score = this.generateScore(newBoard, currentDepth + 1);
        bestScore = Math.max(score, bestScore);
    }

    return bestScore;
};

Simulation.prototype.generateScore = function (board, currentDepth) {
    const maxDepth = Number(this.maxDepth);

    if(maxDepth === 1 || (Number(currentDepth) >= maxDepth)) {
        return this.calculateFinalScore(board);
    }

    return this.calculateMoveScore(board, currentDepth);
};

Simulation.prototype.areBoardsEqual = function (a, b) {
    if(a === b) return true;
    if(a === null || b === null) return false;

    for(let x = 0; x < this.game.size; x++) {
        for(let y = 0; y < this.game.size; y++) {
            let aValue, bValue;

            if(a[x][y] === null) aValue = null;
            else aValue = Number(a[x][y].value);

            if(b[x][y] === null) bValue = null;
            else bValue = Number(b[x][y].value);

            if(aValue !== bValue) {
                return false;
            }
        }
    }

    return true;
};

Simulation.prototype.simulateMove = function (board, direction) {
    const clone = GameManager.createBackgroundClone(board);
    clone.move(direction);

    return clone.serialize().grid.cells;
};

Simulation.prototype.calculateScore = function (board, direction) {
  const newBoard = this.simulateMove(board, direction);

  if(this.areBoardsEqual(board, newBoard)) {
      return 0;
  }

  return this.generateScore(newBoard, 0);
};

Simulation.prototype.getCurrentBoard = function ()  {
    return this.game.serialize().grid.cells;
};

Simulation.prototype.getNextMove = function () {
    const currentBoard = this.getCurrentBoard();

    let bestMove = this.Keys.RIGHT;
    let bestScore = 0;

    for(let direction in Object.values(this.Keys)) {
        const score = this.calculateScore(currentBoard, direction);
        if(score > bestScore) {
            bestScore = score;
            bestMove = direction;
        }
    }

    return bestMove;
};

Simulation.prototype.updateOptimalMoveText = function () {
    const text = document.querySelector('#next-move');

    if(this.optimalMove === null) {
        text.innerText = 'N/A';
        return;
    }

    switch(Number(this.optimalMove)) {
        case this.Keys.UP:
            text.innerText = 'UP';
            break;
        case this.Keys.RIGHT:
            text.innerText = 'RIGHT';
            break;
        case this.Keys.DOWN:
            text.innerText = 'DOWN';
            break;
        case this.Keys.LEFT:
            text.innerText = 'LEFT';
    }
};

Simulation.prototype.handleGameOver = function () {
  this.autoPlay = false;
  document.querySelector('#btn-autoplay').innerText = 'Autoplay';
  document.querySelector('#btn-manual-play').disabled = false;
  document.querySelector('#next-move').innerText = 'N/A';
  this.copyBoardToTextFields();
};

Simulation.prototype.playNextMove = function () {
    let move = this.optimalMove;

    if(move === null) {
        move = this.getNextMove();
    }

    this.game.inputManager.emit('move', move);

    if(!this.autoPlay) {
        this.optimalMove = this.getNextMove();
        this.updateOptimalMoveText();
        this.copyBoardToTextFields();
    }

    if(this.game.over) {
        this.handleGameOver();
        return;
    }

    if(this.autoPlay) {
        setTimeout(this.playNextMove.bind(this), 100);
    }
};

Simulation.prototype.restartHandler = function () {
    this.optimalMove = null;
    this.updateOptimalMoveText();
    this.copyBoardToTextFields();
};

Simulation.prototype.copyBoardToTextFields = function () {
  const currentBoard = this.getCurrentBoard();

  for(let x = 0; x < this.game.size; x++) {
      for(let y = 0; y < this.game.size; y++) {
          const element = document.querySelector(`.grid-value[data-x="${x}"][data-y="${y}"]`);
          const cell = currentBoard[x][y];
          element.value = cell ? cell.value : null;
      }
  }
};

window.requestAnimationFrame(function () {
    new Simulation();
});