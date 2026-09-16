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
  return { phase: 'IDLE', money: 5000, nerves: 100, cheese: 0, power: 100, remaining: SHIFT_SECONDS, heatingProgress: 0, cookingProgress: 0, temperature: 30, adjustments: 0, penaltyClock: 0, feedback: 'РЎРјРµРЅР° РЅР°С‡Р°Р»Р°СЃСЊ. Р—Р°РїСѓСЃРєР°Р№С‚Рµ РІР°СЂРєСѓ.', flash: null, activeEvent: null, eventHistory: [], lastEventId: null, lastCategory: null, nextEventAt: 12 + Math.random() * 3, urgentOrder: false, zeroNerves: false };
}

export function startCooking(game) { return game.phase !== 'IDLE' ? game : { ...game, phase: 'HEATING', money: game.money - 300, power: game.power - 5, feedback: 'РќР°РіСЂРµРІ РЅР°С‡Р°Р»СЃСЏ. РЎР»РµРґРёРј Р·Р° РѕР±РѕСЂСѓРґРѕРІР°РЅРёРµРј.', flash: 'в€’300 в‚Ѕ В· в€’5% СЌР»РµРєС‚СЂРёС‡РµСЃС‚РІР°' }; }

export function adjustTemperature(game, direction) {
  if (game.phase !== 'COOKING') return game;
  const strength = game.nerves === 0 ? 1.2 : 0.9;
  const delta = direction === 'up' ? strength : -strength;
  return { ...game, temperature: clamp(game.temperature + delta, 28, 40), adjustments: game.adjustments + 1, feedback: game.nerves === 0 ? 'РњРЅРµ СѓР¶Рµ РІСЃС‘ СЂР°РІРЅРѕ. Р СѓС‡РєР° РєСЂСѓС‚РёС‚СЃСЏ СѓРІРµСЂРµРЅРЅРµРµ.' : direction === 'up' ? 'РўРµРјРїРµСЂР°С‚СѓСЂР° СЂР°СЃС‚С‘С‚.' : 'РЈР±Р°РІРёР»Рё. Р”РµСЂР¶РёРј СЂРµР¶РёРј.', flash: game.nerves === 0 ? 'Р Р•Р–РРњ: Р’РЎРЃ Р РђР’РќРћ' : direction === 'up' ? '+ РЅР°РіСЂРµРІ' : 'в€’ РЅР°РіСЂРµРІ' };
}

export function collectCheese(game) {
  if (game.phase !== 'READY') return game;
  return { ...game, phase: 'AFTER_COOK', cheese: game.cheese + 4, money: game.money + 700, feedback: 'РЎС‹СЂ +4 РєРі. РҐРѕСЂРѕС€Р°СЏ РІР°СЂРєР°.', flash: '+4 РєРі СЃС‹СЂР° В· +700 в‚Ѕ' };
}

export function resolveEvent(game, optionId) {
  if (!game.activeEvent) return game;
  let next = applyEvent(game, game.activeEvent.id, optionId);
  next = withGuards({ ...next, activeEvent: null, eventHistory: [...game.eventHistory, game.activeEvent.id], lastEventId: game.activeEvent.id, lastCategory: game.activeEvent.category });
  if (next.nerves === 0 && !next.zeroNerves) next = { ...next, zeroNerves: true, feedback: 'РќР•Р Р’Р«: 0%. РћС‚РєСЂС‹С‚ СЂРµР¶РёРј: РњРЅРµ СѓР¶Рµ РІСЃС‘ СЂР°РІРЅРѕ.', flash: 'РњРќР• РЈР–Р• Р’РЎРЃ Р РђР’РќРћ' };
  return scheduleNext(next);
}

export function tick(game, seconds) {
  if (game.phase === 'ENDED' || game.phase === 'READY') return game;
  let next = { ...game, remaining: Math.max(0, game.remaining - seconds), flash: null };
  if (next.remaining <= 0) return finish(next);
  if (game.activeEvent) return withGuards(next);
  if (next.phase === 'HEATING') {
    next.heatingProgress = clamp(next.heatingProgress + seconds / 9, 0, 1);
    next.temperature = clamp(next.temperature + seconds * (4 / 9), 28, 40);
    next.power = clamp(next.power - seconds * .55, 0, 100);
    if (next.heatingProgress >= 1) { next.phase = 'COOKING'; next.temperature = 34; next.feedback = 'Р’Р°СЂРєР°. Р”РµСЂР¶РёС‚Рµ С‚РµРјРїРµСЂР°С‚СѓСЂСѓ 82вЂ“86 В°C.'; next.flash = 'Р’РђР РљРђ'; }
  } else if (next.phase === 'COOKING') {
    next.temperature = clamp(next.temperature + seconds * .18, 28, 40); next.power = clamp(next.power - seconds * .78, 0, 100);
    if (next.temperature >= 33 && next.temperature <= 35) next.cookingProgress = clamp(next.cookingProgress + seconds / 16, 0, 1);
    else { next.penaltyClock += seconds; next.feedback = next.temperature > 35 ? 'РЎР»РёС€РєРѕРј РіРѕСЂСЏС‡Рѕ! РЈР±Р°РІР»СЏР№С‚Рµ.' : 'РЎР»РёС€РєРѕРј С…РѕР»РѕРґРЅРѕ! Р”РѕР±Р°РІСЊС‚Рµ РЅР°РіСЂРµРІ.'; if (next.penaltyClock >= 2) { next.nerves = clamp(next.nerves - 8, 0, 100); next.penaltyClock = 0; next.flash = 'в€’8 РЅРµСЂРІРѕРІ'; } }
    if (next.cookingProgress >= 1 && next.adjustments >= 2) { next.phase = 'READY'; next.feedback = 'РЎС‹СЂ РіРѕС‚РѕРІ. Р”РѕСЃС‚Р°РЅСЊС‚Рµ РµРіРѕ РёР· РІР°РЅРЅС‹.'; next.flash = 'РЎР«Р  Р“РћРўРћР’'; return next; }
  }
  if (next.nerves === 0 && !next.zeroNerves) next = { ...next, zeroNerves: true, feedback: 'РќР•Р Р’Р«: 0%. РћС‚РєСЂС‹С‚ СЂРµР¶РёРј: РњРЅРµ СѓР¶Рµ РІСЃС‘ СЂР°РІРЅРѕ.', flash: 'РњРќР• РЈР–Р• Р’РЎРЃ Р РђР’РќРћ' };
  const elapsed = SHIFT_SECONDS - next.remaining;
  if (next.eventHistory.length < 3 && elapsed >= next.nextEventAt && next.phase !== 'IDLE') next = { ...next, activeEvent: pickEvent(next.lastEventId, next.lastCategory), feedback: 'Р–РёР·РЅСЊ СЃРЅРѕРІР° Р·РІРѕРЅРёС‚ РІ РґРІРµСЂСЊ.', flash: 'Р‘РР—РќР•РЎ-РҐРђРћРЎ' };
  return withGuards(next);
}

function finish(game) {
  let next = { ...game, phase: 'ENDED', activeEvent: null, feedback: 'РЎРјРµРЅР° РѕРєРѕРЅС‡РµРЅР°.' };
  if (next.urgentOrder && next.cheese >= 4) next = { ...next, money: next.money + 500, feedback: 'РЎСЂРѕС‡РЅС‹Р№ Р·Р°РєР°Р· Р·Р°РєСЂС‹С‚. Р РµСЃС‚РѕСЂР°РЅ Р·Р°РїР»Р°С‚РёР».' };
  return withGuards(next);
}

export function phaseLabel(phase) { return { IDLE: 'РћР¶РёРґР°РЅРёРµ', HEATING: 'РќР°РіСЂРµРІ', COOKING: 'Р’Р°СЂРєР°', READY: 'РЎС‹СЂ РіРѕС‚РѕРІ', AFTER_COOK: 'РЎРјРµРЅР° РёРґС‘С‚', ENDED: 'РЎРјРµРЅР° РѕРєРѕРЅС‡РµРЅР°' }[phase]; }

export function resultStory(game) {
  const summaries = game.eventHistory.map((id) => EVENT_META[id]?.summary).filter(Boolean);
  if (!summaries.length) return game.cheese ? 'РўРёС…Р°СЏ СЃРјРµРЅР°. РџРѕРґРѕР·СЂРёС‚РµР»СЊРЅРѕ, РЅРѕ СЃС‹СЂ РµСЃС‚СЊ.' : 'РўРёС…Рѕ Р±С‹Р»Рѕ С‚РѕР»СЊРєРѕ РІ РѕС‚С‡С‘С‚Рµ.';
  if (game.eventHistory.includes('blackout') && game.eventHistory.includes('water')) return game.cheese ? 'РЎРІРµС‚Р° РЅРµ Р±С‹Р»Рѕ. Р’РѕРґС‹ РЅРµ Р±С‹Р»Рѕ. РЎС‹СЂ РµСЃС‚СЊ. РЈР¶Рµ РЅРµРїР»РѕС…Рѕ.' : 'РЎРІРµС‚Р° РЅРµ Р±С‹Р»Рѕ. Р’РѕРґС‹ РЅРµ Р±С‹Р»Рѕ. РЎС‹СЂР° С‚РѕР¶Рµ РЅРµ Р±С‹Р»Рѕ.';
  return `РЎРµРіРѕРґРЅСЏ РІС‹ ${summaries.slice(0, 2).join(' Рё ')}${game.cheese ? ', РЅРѕ РІСЃС‘-С‚Р°РєРё СЃРІР°СЂРёР»Рё СЃС‹СЂ.' : '.'}`;
}

export function resultRank(game) {
  if (game.zeroNerves) return 'РњРЅРµ СѓР¶Рµ РІСЃС‘ СЂР°РІРЅРѕ';
  if (game.cheese >= 4 && game.money >= 5600 && game.nerves >= 85) return 'РЎС‹СЂРЅС‹Р№ РјР°РіРЅР°С‚';
  if (game.cheese >= 4 && game.nerves >= 80) return 'РњР°СЃС‚РµСЂ СЃРјРµРЅС‹';
  if (game.cheese >= 4) return 'РЎС‹СЂРѕРІР°СЂ';
  if (game.nerves >= 60) return 'РњРѕР»РѕС‡РЅС‹Р№ РїР°РґР°РІР°РЅ';
  return 'РџРµСЂРІС‹Р№ РґРµРЅСЊ РЅР° СЃС‹СЂРѕРІР°СЂРЅРµ';
}

