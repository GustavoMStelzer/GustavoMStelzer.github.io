'use strict';

const TicTacToe = (() => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  const preference = [4, 0, 2, 6, 8, 1, 3, 5, 7];

  function result(board) {
    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line, draw: false };
      }
    }
    return { winner: null, line: [], draw: board.every(Boolean) };
  }

  function moves(board) {
    return preference.filter(index => !board[index]);
  }

  function score(board, turn, depth) {
    const outcome = result(board);
    if (outcome.winner === 'O') return 10 - depth;
    if (outcome.winner === 'X') return depth - 10;
    if (outcome.draw) return 0;

    const scores = moves(board).map(index => {
      const next = board.slice();
      next[index] = turn;
      return score(next, turn === 'O' ? 'X' : 'O', depth + 1);
    });
    return turn === 'O' ? Math.max(...scores) : Math.min(...scores);
  }

  function winningMove(board, player) {
    return moves(board).find(index => {
      const next = board.slice();
      next[index] = player;
      return result(next).winner === player;
    });
  }

  function chooseMove(board, difficulty = 'perfect', random = Math.random) {
    const outcome = result(board);
    if (outcome.winner || outcome.draw) return null;
    const available = moves(board);

    if (difficulty === 'challenge') {
      const win = winningMove(board, 'O');
      if (win !== undefined) return win;
      const block = winningMove(board, 'X');
      if (block !== undefined) return block;
      // O desafio deixa brechas; o modo perfeito nunca usa aleatoriedade.
      if (random() < 0.3) return available[Math.floor(random() * available.length)];
    }

    let best = available[0];
    let bestScore = -Infinity;
    for (const index of available) {
      const next = board.slice();
      next[index] = 'O';
      const value = score(next, 'X', 0);
      if (value > bestScore) {
        bestScore = value;
        best = index;
      }
    }
    return best;
  }

  return Object.freeze({ result, moves, chooseMove });
})();

if (typeof module !== 'undefined') module.exports = TicTacToe;
