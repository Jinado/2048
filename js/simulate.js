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
        FIXED: 10000,
        EMPTY: 50,
        MERGES: 90,
        POSITION: 70
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
        .addEventListener('click', this.clearGridTextFields.bind(this));
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

Simulation.prototype.calculateFinalScore = function (board) {
    let score = this.ScoreWeight.FIXED;
    const emptySpaces = this.getTotalEmptySpaces(board);
    score = (score + (emptySpaces * this.ScoreWeight.EMPTY)) / 100;

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
    if(Number(currentDepth) >= Number(this.maxDepth)) {
        return this.calculateFinalScore(board);
    }

    let totalScore = 0;
    for(let y = 0; y < this.game.size; y++) {
        const row = board[y];
        for(let x = 0; x < this.game.size; x++) {
            const cell = row[x];
            if(cell !== null && cell.value !== null) continue;

            const weight2 = this.spawnChance2 / 100;
            const weight4 = (100 - this.spawnChance2) / 100;

            // Simulate spawning a 2 in this cell
            const newBoard2 = board;
            newBoard2[y][x] = { position: { x, y }, value: 2 };
            const moveScore2 = this.calculateMoveScore(newBoard2, currentDepth);
            totalScore += (weight2 * moveScore2);

            // Simulate spawning a 4 in this cell
            const newBoard4 = board;
            newBoard4[y][x] = { position: { x, y }, value: 4 };
            const moveScore4 = this.calculateMoveScore(newBoard4, currentDepth);
            totalScore += (weight4 * moveScore4);
        }
    }

    return totalScore;
};

Simulation.prototype.areBoardsEqual = function (a, b) {
    if(a === b) return true;
    if(a === null || b === null) return false;

    for(let y = 0; y < this.game.size; y++) {
        for(let x = 0; x < this.game.size; x++) {
            let aValue, bValue;

            if(a[y][x] === null) aValue = null;
            else aValue = Number(a[y][x].value);

            if(b[y][x] === null) bValue = null;
            else bValue = Number(b[y][x].value);

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

Simulation.prototype.clearGridTextFields = function () {
    const fields = Array.from(document.querySelectorAll('.grid-value'));
    fields.forEach(field => field.value = null);
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