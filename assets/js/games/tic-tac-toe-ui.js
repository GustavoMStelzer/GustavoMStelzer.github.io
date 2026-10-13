'use strict';

(() => {
  const game = document.querySelector('[data-tic-tac-toe]');
  if (!game) return;
  const boardElement = game.querySelector('[data-board]');
  const status = game.querySelector('[data-status]');
  const caption = game.querySelector('[data-caption]');
  const difficulty = game.querySelector('[data-difficulty]');
  const starter = game.querySelector('[data-starter]');
  const modeNote = game.querySelector('[data-mode-note]');
  const storageKey = 'gs-arcade-score-v1';
  const emptyScore = () => ({ X: 0, O: 0, draw: 0 });
  let scores = { challenge: emptyScore(), perfect: emptyScore() };
  let board = Array(9).fill(null);
  let busy = false;
  let finished = false;
  let pendingMove;

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    for (const mode of ['challenge', 'perfect']) {
      for (const key of ['X', 'O', 'draw']) {
        const value = saved?.[mode]?.[key];
        if (Number.isSafeInteger(value) && value >= 0) scores[mode][key] = value;
      }
    }
  } catch { /* O jogo continua quando o navegador bloqueia o armazenamento. */ }

  const cells = board.map((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tic-cell';
    button.addEventListener('click', () => play(index));
    button.addEventListener('keydown', event => {
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
      if (!(event.key in offsets)) return;
      event.preventDefault();
      cells[(index + offsets[event.key] + 9) % 9].focus();
    });
    boardElement.appendChild(button);
    return button;
  });

  function announce(title, text) {
    status.textContent = title;
    caption.textContent = text;
  }

  function render() {
    const outcome = TicTacToe.result(board);
    cells.forEach((cell, index) => {
      const mark = board[index];
      cell.innerHTML = mark
        ? `<img src="../assets/img/${mark === 'X' ? 'coffee' : 'robot'}.svg" alt=""><span class="cell-mark">${mark}</span>`
        : '<span class="cell-placeholder" aria-hidden="true">+</span>';
      cell.classList.toggle('is-winning', outcome.line.includes(index));
      cell.dataset.mark = mark || '';
      cell.setAttribute('aria-label', `Linha ${Math.floor(index / 3) + 1}, coluna ${index % 3 + 1}: ${mark === 'X' ? 'seu café, X' : mark === 'O' ? 'robô, O' : 'vazia'}`);
      cell.setAttribute('aria-disabled', String(Boolean(mark) || busy || finished));
    });
    boardElement.setAttribute('aria-busy', String(busy));
    for (const key of ['X', 'O', 'draw']) {
      game.querySelector(`[data-score="${key}"]`).textContent = scores[difficulty.value][key];
    }
  }

  function endIfNeeded() {
    const outcome = TicTacToe.result(board);
    if (!outcome.winner && !outcome.draw) return false;
    finished = true;
    scores[difficulty.value][outcome.winner || 'draw']++;
    try { sessionStorage.setItem(storageKey, JSON.stringify(scores)); } catch { /* Placar em memória. */ }
    if (outcome.winner === 'X') announce('Você ganhou!', 'O robô pediu revisão do VAR. Pedido negado.');
    else if (outcome.winner === 'O') announce('Ponto do robô.', '“Vitória adicionada ao meu LinkedIn.” — o robô');
    else announce('Deu velha.', difficulty.value === 'perfect'
      ? 'Empatar com o imbatível é sair invicto. Pode comemorar.'
      : 'Ninguém perdeu. O café, infelizmente, esfriou.');
    render();
    return true;
  }

  function robotTurn() {
    busy = true;
    announce('Robô pensando…', 'Calculando jogadas e uma desculpa, por precaução.');
    render();
    pendingMove = window.setTimeout(() => {
      pendingMove = undefined;
      const move = TicTacToe.chooseMove(board, difficulty.value);
      if (move !== null) board[move] = 'O';
      busy = false;
      if (!endIfNeeded()) {
        announce('Sua vez, humano.', 'Escolha uma casa vazia. O café acredita em você.');
        render();
      }
    }, 420);
  }

  function play(index) {
    if (busy || finished || board[index]) return;
    board[index] = 'X';
    if (!endIfNeeded()) robotTurn();
  }

  function restart() {
    window.clearTimeout(pendingMove);
    pendingMove = undefined;
    board = Array(9).fill(null);
    busy = false;
    finished = false;
    modeNote.textContent = difficulty.value === 'perfect'
      ? 'Imbatível: o robô joga sem erros. Seu objetivo é empatar.'
      : 'Desafio: ele joga bem, mas deixa brechas. Dá para ganhar.';
    announce('Sua vez, humano.', 'Três cafés na mesma linha. Simples assim. Em teoria.');
    render();
    if (starter.value === 'robot') robotTurn();
  }

  game.querySelector('[data-restart]').addEventListener('click', restart);
  game.querySelector('[data-reset-score]').addEventListener('click', () => {
    scores[difficulty.value] = emptyScore();
    try { sessionStorage.setItem(storageKey, JSON.stringify(scores)); } catch { /* Placar em memória. */ }
    restart();
    if (!busy) announce('Placar zerado.', 'A história foi reescrita. O robô não gostou.');
  });
  difficulty.addEventListener('change', restart);
  starter.addEventListener('change', restart);
  window.addEventListener('pagehide', () => window.clearTimeout(pendingMove));
  window.addEventListener('pageshow', event => { if (event.persisted && busy) robotTurn(); });
  game.hidden = false;
  restart();
})();
