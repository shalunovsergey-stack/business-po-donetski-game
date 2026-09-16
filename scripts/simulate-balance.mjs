import { EVENTS } from '../src/events.js';
import { adjustTemperature, collectCheese, createGameState, resolveEvent, resultRank, startCooking, tick } from '../src/game.js';

function rng(seed) { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }
function run(seed, strategy) {
  const saved = Math.random; Math.random = rng(seed);
  let game = startCooking(createGameState());
  while (game.phase !== 'ENDED') {
    if (game.activeEvent) {
      const options = game.activeEvent.options;
      const option = strategy === 'money' ? options[1] : strategy === 'nerves' ? options[0] : options[Math.floor(Math.random() * options.length)];
      game = resolveEvent(game, option.id);
    } else if (game.phase === 'READY') game = collectCheese(game);
    else {
      if (game.phase === 'COOKING') {
        const careless = strategy === 'random' && Math.random() < .38;
        if (!careless && game.adjustments < 2) game = adjustTemperature(game, game.adjustments ? 'down' : 'up');
        else if (!careless && game.temperature > 34.7) game = adjustTemperature(game, 'down');
        else if (!careless && game.temperature < 33.1) game = adjustTemperature(game, 'up');
      }
      game = tick(game, .5);
    }
  }
  Math.random = saved; return game;
}
function stats(games) {
  const avg = (key) => +(games.reduce((sum, game) => sum + game[key], 0) / games.length).toFixed(1);
  return { runs: games.length, money: avg('money'), nerves: avg('nerves'), cheese: avg('cheese'), success4kg: +(games.filter((game) => game.cheese >= 4).length / games.length * 100).toFixed(1), zeroNerves: +(games.filter((game) => game.zeroNerves).length / games.length * 100).toFixed(1), events: +(games.reduce((sum, game) => sum + game.eventHistory.length, 0) / games.length).toFixed(1), ranks: Object.fromEntries([...new Set(games.map(resultRank))].map((rank) => [rank, games.filter((game) => resultRank(game) === rank).length])) };
}
const strategies = ['random', 'money', 'nerves'];
const groups = Object.fromEntries(strategies.map((strategy, group) => [strategy, Array.from({ length: 100 }, (_, index) => run(3000 + group * 1000 + index, strategy))]));
const all = Object.values(groups).flat();
const frequency = Object.fromEntries(EVENTS.map((event) => [event.id, all.reduce((sum, game) => sum + game.eventHistory.filter((id) => id === event.id).length, 0)]));
console.log(JSON.stringify({ byStrategy: Object.fromEntries(Object.entries(groups).map(([name, games]) => [name, stats(games)])), aggregate: stats(all), eventFrequency: frequency }, null, 2));
