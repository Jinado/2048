function Simulation() {
    this.game = window.game;
    this.board = this.game.serialize();
    this.spawnChance2 = document.querySelector('#spawn-chance-2').value;
    this.autoPlay = false;
    this.optimalMove = null;

    this.Keys = {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3
    };

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

Simulation.prototype.getNextMove = function () {

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