import assert from 'node:assert/strict';
import { EVENTS } from '../src/events.js';
import { createGameState, resolveEvent, tick } from '../src/game.js';

for (const event of EVENTS) {
  for (const option of event.options) {
    const game = { ...createGameState(), phase: 'COOKING', activeEvent: event, remaining: 40, cheese: 4 };
    const result = resolveEvent(game, option.id);
    assert.equal(result.activeEvent, null, `${event.id}/${option.id} closes event`);
    assert.ok(result.money >= 0 && result.nerves >= 0 && result.nerves <= 100 && result.power >= 0 && result.power <= 100 && result.cheese >= 0, `${event.id}/${option.id} stays guarded`);
  }
}

const zeroStart = { ...createGameState(), phase: 'COOKING', nerves: 3, activeEvent: EVENTS.find((event) => event.id === 'water') };
const zeroResult = resolveEvent(zeroStart, 'save');
assert.equal(zeroResult.nerves, 0);
assert.equal(zeroResult.zeroNerves, true);
const running = tick({ ...zeroResult, activeEvent: null }, 1);
assert.notEqual(running.phase, 'ENDED');
console.log(`PASS: ${EVENTS.length} events, ${EVENTS.reduce((count, event) => count + event.options.length, 0)} choices, zero-nerves mode`);
