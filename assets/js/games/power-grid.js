'use strict';

const PowerGrid = (() => {
  const directions = [
    { bit: 1, opposite: 4, row: -1, col: 0, name: 'cima' },
    { bit: 2, opposite: 8, row: 0, col: 1, name: 'direita' },
    { bit: 4, opposite: 1, row: 1, col: 0, name: 'baixo' },
    { bit: 8, opposite: 2, row: 0, col: -1, name: 'esquerda' }
  ];

  function rotate(mask) {
    return ((mask << 1) & 15) | (mask >> 3);
  }

  function neighbor(index, direction, size) {
    const row = Math.floor(index / size) + direction.row;
    const col = index % size + direction.col;
    return row >= 0 && row < size && col >= 0 && col < size ? row * size + col : -1;
  }

  function randomFrom(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let value = Math.imul(state ^ state >>> 15, 1 | state);
      value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function inspect(puzzle, tiles) {
    const powered = new Set([puzzle.source]);
    const queue = [puzzle.source];
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head];
      for (const direction of directions) {
        if (!(tiles[index] & direction.bit)) continue;
        const next = neighbor(index, direction, puzzle.size);
        if (next !== -1 && (tiles[next] & direction.opposite) && !powered.has(next)) {
          powered.add(next);
          queue.push(next);
        }
      }
    }

    const loose = [];
    tiles.forEach((mask, index) => {
      for (const direction of directions) {
        if (!(mask & direction.bit)) continue;
        const next = neighbor(index, direction, puzzle.size);
        if (next === -1 || !(tiles[next] & direction.opposite)) loose.push({ index, bit: direction.bit });
      }
    });

    const litHomes = puzzle.homes.filter(index => powered.has(index)).length;
    return { powered, loose, litHomes, solved: powered.size === tiles.length && loose.length === 0 };
  }

  function create(size, seed) {
    if (![3, 4, 5].includes(size)) throw new RangeError('O tabuleiro deve ter 3, 4 ou 5 colunas.');
    const random = randomFrom(seed);
    const source = Math.floor(size / 2) * size + Math.floor(size / 2);
    const solution = Array(size * size).fill(0);
    const visited = new Set([source]);

    // Cresce uma árvore a partir da usina. Isso garante uma solução conectada.
    while (visited.size < solution.length) {
      const frontier = [];
      for (const index of visited) {
        for (const direction of directions) {
          const next = neighbor(index, direction, size);
          if (next !== -1 && !visited.has(next)) frontier.push({ index, next, direction });
        }
      }
      const edge = frontier[Math.floor(random() * frontier.length)];
      solution[edge.index] |= edge.direction.bit;
      solution[edge.next] |= edge.direction.opposite;
      visited.add(edge.next);
    }

    const homes = solution.flatMap((mask, index) =>
      index !== source && (mask & (mask - 1)) === 0 ? [index] : []);
    const tiles = solution.map((mask, index) => {
      if (index === source) return mask;
      const turns = Math.floor(random() * 4);
      for (let turn = 0; turn < turns; turn++) mask = rotate(mask);
      return mask;
    });
    const puzzle = { size, seed, source, solution, homes, tiles };
    if (inspect(puzzle, tiles).solved) {
      const index = tiles.findIndex((mask, i) => i !== source && rotate(mask) !== mask);
      tiles[index] = rotate(tiles[index]);
    }
    return puzzle;
  }

  function hint(puzzle, tiles) {
    if (inspect(puzzle, tiles).solved) return null;
    // Faz parte da solução gerada, sem afirmar que ela é a única possível.
    const index = tiles.findIndex((mask, i) => i !== puzzle.source && mask !== puzzle.solution[i]);
    return index === -1 ? null : { index, mask: puzzle.solution[index] };
  }

  return Object.freeze({ directions, rotate, neighbor, randomFrom, create, inspect, hint });
})();

if (typeof module !== 'undefined') module.exports = PowerGrid;
