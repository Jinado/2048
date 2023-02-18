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
        .addEventListener('click', this.setGrid.bind(this));
};

Simulation.prototype.setGrid = function () {
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
};

Simulation.prototype.getRandomTileValue = function () {
    return Math.random() < (this.spawnChance2 / 100) ? 2 : 4;
};

Simulation.prototype.changeSpawnChance = function (e) {
    this.spawnChance2 = Number(e.target.value);
};

Simulation.prototype.changeMaxDepth = function (e) {
    this.maxDepth = Number(e.target.value);
};

/*
{
    "grid": {
        "size": 4,
        "cells": [
            [
                {
                    "position": {
                        "x": 0,
                        "y": 0
                    },
                    "value": 2
                },
                null,
                null,
                null
            ],
            [
                null,
                null,
                null,
                null
            ],
            [
                null,
                null,
                null,
                {
                    "position": {
                        "x": 2,
                        "y": 3
                    },
                    "value": 2
                }
            ],
            [
                null,
                null,
                null,
                null
            ]
        ]
    },
    "score": 0,
    "over": false,
    "won": false,
    "keepPlaying": false
}
 */

Simulation.prototype.generateScore = function (board, currentDepth) {
    if(currentDepth >= this.maxDepth) {
        return calculateFinalScore(board);
    }

    let totalScore = 0;
    return totalScore; // TODO: Calculate the total score
};

Simulation.prototype.areBoardsEqual = function (a, b) {
    if(a === b) return true;
    if(a === null || b === null) return false;

    for(let i = 0; i < 4; j++) {
        for(let j = 0; j < 4; j++) {
            if(a[i][j] === null && b[i][j] !== null) {
                return false;
            }

            if(a[i][j] !== null && b[i][j] === null) {
                return false;
            }

            if(a[i][j].value !== b[i][j].value) {
                return false;
            }
        }
    }

    return true;
};

Simulation.prototype.simulateMove = function (board, direction) {
    const clone = GameManager.createBackgroundClone(board);
    clone.move(direction);

    return clone.grid.cells;
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

    let bestMove = null;
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

    switch(this.optimalMove) {
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

    this.optimalMove = this.getNextMove();
    this.updateOptimalMoveText();

    if(this.game.over) {
        this.handleGameOver();
        return;
    }

    if(this.autoPlay) {
        setTimeout(this.playNextMove.bind(this), 100);
    }
};

window.requestAnimationFrame(function () {
    new Simulation();
});