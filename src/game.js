import { applyEvent, EVENT_META, pickEvent } from './events.js';

export const SHIFT_SECONDS = 65;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const withGuards = (game) => ({ ...game, money: Math.max(0, game.money), nerves: clamp(game.nerves, 0, 100), power: clamp(game.power, 0, 100), cheese: Math.max(0, game.cheese) });
const scheduleNext = (game) => {
  const elapsed = SHIFT_SECONDS - game.remaining;
  const cooldown = game.eventHistory.length === 1 ? 6 + Math.random() * 2 : 9 + Math.random() * 3;
  return { ...game, nextEventAt: elapsed + cooldown };
};

export function createGameState() {
  return { phase: 'IDLE', money: 5000, nerves: 100, cheese: 0, power: 100, remaining: SHIFT_SECONDS, heatingProgress: 0, cookingProgress: 0, temperature: 30, adjustments: 0, penaltyClock: 0, feedback: 'Смена началась. Запускайте варку.', flash: null, activeEvent: null, eventHistory: [], lastEventId: null, lastCategory: null, nextEventAt: 12 + Math.random() * 3, urgentOrder: false, zeroNerves: false };
}

export function startCooking(game) { return game.phase !== 'IDLE' ? game : { ...game, phase: 'HEATING', money: game.money - 300, power: game.power - 5, feedback: 'Нагрев начался. Следим за оборудованием.', flash: '−300 ₽ · −5% электричества' }; }

export function adjustTemperature(game, direction) {
  if (game.phase !== 'COOKING') return game;
  const strength = game.nerves === 0 ? 1.2 : 0.9;
  const delta = direction === 'up' ? strength : -strength;
  return { ...game, temperature: clamp(game.temperature + delta, 28, 40), adjustments: game.adjustments + 1, feedback: game.nerves === 0 ? 'Мне уже всё равно. Ручка крутится увереннее.' : direction === 'up' ? 'Температура растёт.' : 'Убавили. Держим режим.', flash: game.nerves === 0 ? 'РЕЖИМ: ВСЁ РАВНО' : direction === 'up' ? '+ нагрев' : '− нагрев' };
}

export function collectCheese(game) {
  if (game.phase !== 'READY') return game;
  return { ...game, phase: 'AFTER_COOK', cheese: game.cheese + 4, money: game.money + 700, feedback: 'Сыр +4 кг. Хорошая варка.', flash: '+4 кг сыра · +700 ₽' };
}

export function resolveEvent(game, optionId) {
  if (!game.activeEvent) return game;
  let next = applyEvent(game, game.activeEvent.id, optionId);
  next = withGuards({ ...next, activeEvent: null, eventHistory: [...game.eventHistory, game.activeEvent.id], lastEventId: game.activeEvent.id, lastCategory: game.activeEvent.category });
  if (next.nerves === 0 && !next.zeroNerves) next = { ...next, zeroNerves: true, feedback: 'НЕРВЫ: 0%. Открыт режим: Мне уже всё равно.', flash: 'МНЕ УЖЕ ВСЁ РАВНО' };
  return scheduleNext(next);
}

export function tick(game, seconds) {
  if (game.phase === 'ENDED') return game;
  let next = { ...game, remaining: Math.max(0, game.remaining - seconds), flash: null };
  if (next.remaining <= 0) return finish(next);
  if (game.activeEvent) return withGuards(next);
  if (next.phase === 'HEATING') {
    next.heatingProgress = clamp(next.heatingProgress + seconds / 9, 0, 1);
    next.temperature = clamp(next.temperature + seconds * (4 / 9), 28, 40);
    next.power = clamp(next.power - seconds * .55, 0, 100);
    if (next.heatingProgress >= 1) { next.phase = 'COOKING'; next.temperature = 34; next.feedback = 'Варка. Держите температуру 33–35 °C.'; next.flash = 'ВАРКА'; }
  } else if (next.phase === 'COOKING') {
    next.temperature = clamp(next.temperature + seconds * .18, 28, 40); next.power = clamp(next.power - seconds * .78, 0, 100);
    if (next.temperature >= 33 && next.temperature <= 35) next.cookingProgress = clamp(next.cookingProgress + seconds / 16, 0, 1);
    else { next.penaltyClock += seconds; next.feedback = next.temperature > 35 ? 'Слишком горячо! Убавляйте.' : 'Слишком холодно! Добавьте нагрев.'; if (next.penaltyClock >= 2) { next.nerves = clamp(next.nerves - 8, 0, 100); next.penaltyClock = 0; next.flash = '−8 нервов'; } }
    if (next.cookingProgress >= 1 && next.adjustments >= 2) { next.phase = 'READY'; next.feedback = 'Сыр готов. Достаньте его из ванны.'; next.flash = 'СЫР ГОТОВ'; return next; }
  }
  if (next.nerves === 0 && !next.zeroNerves) next = { ...next, zeroNerves: true, feedback: 'НЕРВЫ: 0%. Открыт режим: Мне уже всё равно.', flash: 'МНЕ УЖЕ ВСЁ РАВНО' };
  const elapsed = SHIFT_SECONDS - next.remaining;
  if (next.eventHistory.length < 3 && elapsed >= next.nextEventAt && next.phase !== 'IDLE') next = { ...next, activeEvent: pickEvent(next.lastEventId, next.lastCategory), feedback: 'Жизнь снова звонит в дверь.', flash: 'БИЗНЕС-ХАОС' };
  return withGuards(next);
}

function finish(game) {
  let next = { ...game, phase: 'ENDED', activeEvent: null, feedback: 'Смена окончена.' };
  if (next.urgentOrder && next.cheese >= 4) next = { ...next, money: next.money + 500, feedback: 'Срочный заказ закрыт. Ресторан заплатил.' };
  return withGuards(next);
}

export function phaseLabel(phase) { return { IDLE: 'Ожидание', HEATING: 'Нагрев', COOKING: 'Варка', READY: 'Сыр готов', AFTER_COOK: 'Смена идёт', ENDED: 'Смена окончена' }[phase]; }

export function resultStory(game) {
  const summaries = game.eventHistory.map((id) => EVENT_META[id]?.summary).filter(Boolean);
  if (!summaries.length) return game.cheese ? 'Тихая смена. Подозрительно, но сыр есть.' : 'Тихо было только в отчёте.';
  if (game.eventHistory.includes('blackout') && game.eventHistory.includes('water')) return game.cheese ? 'Света не было. Воды не было. Сыр есть. Уже неплохо.' : 'Света не было. Воды не было. Сыра тоже не было.';
  return `Сегодня вы ${summaries.slice(0, 2).join(' и ')}${game.cheese ? ', но всё-таки сварили сыр.' : '.'}`;
}

export function resultRank(game) {
  if (game.zeroNerves) return 'Мне уже всё равно';
  if (game.cheese >= 4 && game.money >= 5600 && game.nerves >= 85) return 'Сырный магнат';
  if (game.cheese >= 4 && game.nerves >= 80) return 'Мастер смены';
  if (game.cheese >= 4) return 'Сыровар';
  if (game.nerves >= 60) return 'Молочный падаван';
  return 'Первый день на сыроварне';
}
