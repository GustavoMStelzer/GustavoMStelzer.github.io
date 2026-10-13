'use strict';

(() => {
  const game = document.querySelector('[data-power-grid]');
  if (!game) return;
  const boardElement = game.querySelector('[data-board]');
  const difficulty = game.querySelector('[data-level]');
  const status = game.querySelector('[data-status]');
  const caption = game.querySelector('[data-caption]');
  const hintButton = game.querySelector('[data-hint]');
  const nextButton = game.querySelector('[data-next]');
  const levels = [
    { size: 3, seed: 210, title: 'Café sem energia', quip: 'A cafeteira parou. A situação é oficialmente grave.' },
    { size: 4, seed: 761, title: 'Bairro sem Wi-Fi', quip: 'O bairro já reiniciou o roteador. Agora é com você.' },
    { size: 5, seed: 1401, title: 'Plantão da cidade', quip: 'Só mais esse chamado e a gente vai embora. Confia.' }
  ];
  const points = { 1: '50 0', 2: '100 50', 4: '50 100', 8: '0 50' };
  const tips = { 1: [50, 4], 2: [96, 50], 4: [50, 96], 8: [4, 50] };
  let puzzle;
  let tiles;
  let turns = 0;
  let hints = 0;
  let solved = false;
  let highlighted = -1;
  let cells = [];

  function tileGraphic(mask, index, state) {
    const wire = PowerGrid.directions.filter(direction => mask & direction.bit)
      .map(direction => `<path d="M50 50L${points[direction.bit]}"/>`).join('');
    const ends = state.loose.filter(end => end.index === index)
      .map(end => `<circle cx="${tips[end.bit][0]}" cy="${tips[end.bit][1]}" r="4"/>`).join('');
    const symbol = index === puzzle.source
      ? '<rect x="33" y="31" width="34" height="38" rx="11"/><path class="tile-ink" d="m53 37-13 17h11l-5 11 16-18H51Z"/>'
      : puzzle.homes.includes(index)
        ? '<path d="m30 48 20-18 20 18v23H30Z"/><path class="tile-ink" d="M45 55h10v16H45z"/><path class="house-roof" d="m25 49 25-23 25 23"/>'
        : '<circle cx="50" cy="50" r="9"/>';
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g class="wires">${wire}</g><g class="tile-symbol">${symbol}</g><g class="loose-ends">${ends}</g></svg>`;
  }

  function render(message) {
    const state = PowerGrid.inspect(puzzle, tiles);
    solved = state.solved;
    cells.forEach((cell, index) => {
      const powered = state.powered.has(index);
      const source = index === puzzle.source;
      const home = puzzle.homes.includes(index);
      const exits = PowerGrid.directions.filter(direction => tiles[index] & direction.bit).map(direction => direction.name).join(', ');
      cell.innerHTML = tileGraphic(tiles[index], index, state);
      cell.classList.toggle('is-powered', powered);
      cell.classList.toggle('is-source', source);
      cell.classList.toggle('is-home', home);
      cell.classList.toggle('is-hint', highlighted === index);
      cell.setAttribute('aria-disabled', String(source || solved));
      cell.setAttribute('aria-label', `Linha ${Math.floor(index / puzzle.size) + 1}, coluna ${index % puzzle.size + 1}. ${source ? 'Usina fixa' : home ? 'Casa' : 'Cabo'} ${powered ? 'com energia' : 'sem energia'}. Conexões: ${exits}.${source ? '' : ' Ative para girar 90 graus.'}`);
    });
    game.querySelector('[data-homes]').textContent = `${state.litHomes}/${puzzle.homes.length}`;
    game.querySelector('[data-loose]').textContent = state.loose.length;
    game.querySelector('[data-turns]').textContent = turns;
    game.querySelector('[data-hints]').textContent = hints;
    boardElement.classList.toggle('is-solved', solved);
    hintButton.disabled = solved;
    nextButton.hidden = !solved;
    if (solved) {
      status.textContent = 'Pode ligar a cafeteira!';
      caption.textContent = `Rede resolvida em ${turns} giro${turns === 1 ? '' : 's'} e ${hints} dica${hints === 1 ? '' : 's'}. A cidade agradece. O café também.`;
      nextButton.textContent = Number(difficulty.value) < levels.length - 1 ? 'Próximo plantão →' : 'Mais um plantão →';
    } else if (message) {
      status.textContent = message;
      caption.textContent = `${state.litHomes} de ${puzzle.homes.length} casas acesas. ${state.loose.length} pontas soltas. Conecte todos os cabos à usina.`;
    }
  }

  function turn(index) {
    if (solved || index === puzzle.source) return;
    tiles[index] = PowerGrid.rotate(tiles[index]);
    turns++;
    highlighted = -1;
    render('Um giro de cada vez.');
  }

  function start(seed = levels[Number(difficulty.value)].seed) {
    const level = levels[Number(difficulty.value)];
    puzzle = PowerGrid.create(level.size, seed);
    tiles = puzzle.tiles.slice();
    turns = 0;
    hints = 0;
    solved = false;
    highlighted = -1;
    boardElement.replaceChildren();
    boardElement.style.setProperty('--grid-size', puzzle.size);
    cells = tiles.map((_, index) => {
      const cell = document.createElement('button');
      cell.className = 'power-cell';
      cell.type = 'button';
      cell.addEventListener('click', () => turn(index));
      cell.addEventListener('keydown', event => {
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -puzzle.size, ArrowDown: puzzle.size };
        if (!(event.key in offsets)) return;
        event.preventDefault();
        cells[(index + offsets[event.key] + tiles.length) % tiles.length].focus();
      });
      boardElement.appendChild(cell);
      return cell;
    });
    status.textContent = level.title;
    caption.textContent = level.quip;
    render();
  }

  hintButton.addEventListener('click', () => {
    const hint = PowerGrid.hint(puzzle, tiles);
    if (!hint) return;
    tiles[hint.index] = hint.mask;
    highlighted = hint.index;
    hints++;
    render(`Dei uma luz na linha ${Math.floor(hint.index / puzzle.size) + 1}, coluna ${hint.index % puzzle.size + 1}.`);
    if (solved) nextButton.focus();
  });
  game.querySelector('[data-restart]').addEventListener('click', () => start(puzzle.seed));
  game.querySelector('[data-shuffle]').addEventListener('click', () => start(Math.floor(Math.random() * 0xFFFFFFFF)));
  nextButton.addEventListener('click', () => {
    const next = Number(difficulty.value) + 1;
    if (next < levels.length) {
      difficulty.value = String(next);
      start();
    } else start(Math.floor(Math.random() * 0xFFFFFFFF));
    cells.find((_, index) => index !== puzzle.source).focus();
  });
  difficulty.addEventListener('change', () => start());
  game.hidden = false;
  start();
})();
