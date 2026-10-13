const test = require('node:test');
const assert = require('node:assert/strict');
const TicTacToe = require('../assets/js/games/tic-tac-toe.js');
const PowerGrid = require('../assets/js/games/power-grid.js');

test('o modo imbatível não perde, independentemente de quem começa', () => {
  let endings = 0;

  function visit(board, turn) {
    const outcome = TicTacToe.result(board);
    assert.notEqual(outcome.winner, 'X');
    if (outcome.winner || outcome.draw) {
      endings++;
      return;
    }
    const choices = turn === 'O'
      ? [TicTacToe.chooseMove(board, 'perfect')]
      : TicTacToe.moves(board);
    for (const move of choices) {
      assert.equal(board[move], null);
      const next = board.slice();
      next[move] = turn;
      visit(next, turn === 'O' ? 'X' : 'O');
    }
  }

  visit(Array(9).fill(null), 'X');
  visit(Array(9).fill(null), 'O');
  assert(endings > 500, 'A árvore de partidas deve cobrir todas as respostas humanas.');
});

test('o desafio permite uma vitória humana sem deixar de bloquear ameaças imediatas', () => {
  function canWin(board, turn) {
    const outcome = TicTacToe.result(board);
    if (outcome.winner || outcome.draw) return outcome.winner === 'X';
    const choices = turn === 'X'
      ? TicTacToe.moves(board)
      : [TicTacToe.chooseMove(board, 'challenge', () => 0)];
    return choices.some(move => {
      const next = board.slice();
      next[move] = turn;
      return canWin(next, turn === 'X' ? 'O' : 'X');
    });
  }
  assert(canWin(Array(9).fill(null), 'X'));
  assert.equal(TicTacToe.chooseMove(['X', 'X', null, null, 'O', null, null, null, null], 'challenge', () => 0), 2);
});

test('o robô preserva a entrada e não joga após o fim da partida', () => {
  const board = ['X', null, null, null, 'O', null, null, null, 'X'];
  const before = board.slice();
  const move = TicTacToe.chooseMove(board);
  assert.equal(board[move], null);
  assert.deepEqual(board, before);
  assert.equal(TicTacToe.chooseMove(['X', 'X', 'X', null, 'O', null, null, null, 'O']), null);
  const draw = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
  assert(TicTacToe.result(draw).draw);
  assert.equal(TicTacToe.chooseMove(draw), null);
});

test('as oito linhas de vitória são reconhecidas para ambos os jogadores', () => {
  for (const line of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) {
    for (const player of ['X', 'O']) {
      const board = Array(9).fill(null);
      line.forEach(index => { board[index] = player; });
      assert.equal(TicTacToe.result(board).winner, player);
      assert.deepEqual(TicTacToe.result(board).line, line);
    }
  }
});

test('450 redes começam embaralhadas e têm uma solução conectada alcançável por rotações', () => {
  for (const size of [3, 4, 5]) {
    for (let seed = 0; seed < 150; seed++) {
      const puzzle = PowerGrid.create(size, seed);
      assert(PowerGrid.inspect(puzzle, puzzle.solution).solved);
      assert(!PowerGrid.inspect(puzzle, puzzle.tiles).solved);
      assert.equal(puzzle.tiles[puzzle.source], puzzle.solution[puzzle.source]);
      assert(puzzle.homes.length > 0);
      puzzle.tiles.forEach((mask, index) => {
        const orientations = [mask];
        for (let i = 0; i < 3; i++) orientations.push(PowerGrid.rotate(orientations.at(-1)));
        assert(orientations.includes(puzzle.solution[index]));
      });
      const tiles = puzzle.tiles.slice();
      let hints = 0;
      while (!PowerGrid.inspect(puzzle, tiles).solved) {
        const hint = PowerGrid.hint(puzzle, tiles);
        assert(hint);
        assert.notEqual(hint.index, puzzle.source);
        tiles[hint.index] = hint.mask;
        assert(++hints < tiles.length);
      }
      assert.equal(PowerGrid.hint(puzzle, tiles), null);
    }
  }
});

test('rotação e fronteiras da rede não criam conexões entre bordas opostas', () => {
  for (let mask = 1; mask < 16; mask++) {
    let rotated = mask;
    for (let i = 0; i < 4; i++) rotated = PowerGrid.rotate(rotated);
    assert.equal(rotated, mask);
  }
  assert.equal(PowerGrid.neighbor(2, PowerGrid.directions[1], 3), -1);
  assert.equal(PowerGrid.neighbor(3, PowerGrid.directions[3], 3), -1);
  assert.equal(PowerGrid.neighbor(0, PowerGrid.directions[0], 3), -1);
  assert.equal(PowerGrid.neighbor(8, PowerGrid.directions[2], 3), -1);
  assert.throws(() => PowerGrid.create(2, 100), RangeError);
});

test('a mesma semente reproduz a rede e as três fases iniciais têm solução', () => {
  for (const [size, seed] of [[3, 210], [4, 761], [5, 1401]]) {
    const puzzle = PowerGrid.create(size, seed);
    assert.deepEqual(puzzle, PowerGrid.create(size, seed));
    assert(PowerGrid.inspect(puzzle, puzzle.solution).solved);
    assert(!PowerGrid.inspect(puzzle, puzzle.tiles).solved);
  }
});
