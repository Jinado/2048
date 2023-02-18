function Simulation() {
    this.game = window.game;
    this.spawnChance2 = document.querySelector('#spawn-chance-2').value;
    this.autoPlay = false;
    this.optimalMove = null;

    this.Keys = {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3
    };

    this.maxDepth = 3;

    this.init();
}

Simulation.prototype.init = function () {
    document.querySelector('#spawn-chance-2')
        .addEventListener('change', this.changeSpawnChance.bind(this));

    document.querySelector('#btn-autoplay')
        .addEventListener('click', this.handleAutoplayButton.bind(this));

    document.querySelector('#btn-manual-play')
        .addEventListener('click', this.playNextMove.bind(this));
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
    this.spawnChance2 = e.target.value;
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

Simulation.prototype.simulateMove = function (board, move) {
    // TODO: Simulate the move
    return this.normalizeBoard(board);
};

Simulation.prototype.calculateScore = function (board, move) {
  const newBoard = this.simulateMove(board, move);

  if(this.areBoardsEqual(board, newBoard)) {
      return 0;
  }

  return this.generateScore(newBoard, 0);
};

Simulation.prototype.normalizeBoard = function (board) {
    return board; // TODO: Normalize the board
};

Simulation.prototype.getCurrentBoard = function ()  {
    const board = this.game.serialize().grid.cells;
    return this.normalizeBoard(board);
};

Simulation.prototype.getNextMove = function () {
    const currentBoard = this.getCurrentBoard();

    let bestMove = null;
    let bestScore = 0;

    for(let move in Object.values(this.Keys)) {
        const score = this.calculateScore(currentBoard, move);
        if(score > bestScore) {
            bestScore = score;
            bestMove = move;
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