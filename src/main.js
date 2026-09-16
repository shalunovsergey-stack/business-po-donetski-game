import { SHIFT_SECONDS, adjustTemperature, collectCheese, createGameState, phaseLabel, resolveEvent, resultRank, resultStory, startCooking, tick } from './game.js';
import { brand } from './brand-config.js';

const app = document.querySelector('#app');
let game = createGameState();
let timerId = null;
let lastTick = 0;

const formatTime = (seconds) => {
  const total = Math.ceil(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const percent = (value) => `${Math.round(value)}%`;

function startScreen() {
  stopLoop();
  app.innerHTML = `<section class="screen start-screen" aria-labelledby="game-title"><div class="ambient ambient-one"></div><div class="ambient ambient-two"></div><img class="brand-logo" src="./assets/brand/sergeev-syr-mark.svg" alt="${brand.brandName}"><div class="start-content"><p class="eyebrow">РЕМЕСЛЕННАЯ СЫРОВАРНЯ · ДОНЕЦК</p><h1 id="game-title">БИЗНЕС<br><span>ПО-ДОНЕЦКИ</span></h1><p class="tagline">Свари сыр. Сохрани нервы.</p><div class="start-hints"><span>Следи за температурой</span><span>Вари сыр</span><span>Решай проблемы</span></div><button class="primary-button start-button" type="button">НАЧАТЬ СМЕНУ <span aria-hidden="true">→</span></button><p class="hint">По мотивам реальной сыроварни «${brand.brandName}» · ${SHIFT_SECONDS} секунд</p></div><footer>Сергеев СырЪ · ремесленная сыроварня</footer></section>`;
  app.querySelector('.start-button').addEventListener('click', startShift);
}

function startShift() {
  game = createGameState();
  renderGame();
  lastTick = performance.now();
  timerId = window.setInterval(update, 250);
}

function stopLoop() { if (timerId) window.clearInterval(timerId); timerId = null; }

function update() {
  const now = performance.now();
  const elapsed = Math.min((now - lastTick) / 1000, 0.5);
  lastTick = now;
  game = tick(game, elapsed);
  renderGame();
  if (game.phase === 'ENDED') stopLoop();
}

function renderGame() {
  if (game.phase === 'ENDED') return renderResult();
  const isCooking = game.phase === 'COOKING';
  const productionProgress = game.phase === 'HEATING' ? game.heatingProgress : ['COOKING', 'READY', 'AFTER_COOK'].includes(game.phase) ? game.cookingProgress : 0;
  const stateText = game.phase === 'HEATING' ? `Нагрев: ${Math.round(game.heatingProgress * 100)}%` : game.phase === 'COOKING' ? `Температура: ${game.temperature.toFixed(1)} °C` : phaseLabel(game.phase);
  const action = game.phase === 'IDLE' ? `<button class="primary-button action-button" data-action="start">ЗАПУСТИТЬ ВАРКУ</button>` : game.phase === 'READY' ? `<button class="primary-button action-button ready-button" data-action="collect">ДОСТАТЬ СЫР <span>+4 кг</span></button>` : '';
  const controls = isCooking ? `<div class="temperature-controls"><button class="heat-button" data-action="heat">🔥<span>НАГРЕВ</span></button><button class="cool-button" data-action="cool">❄<span>УБАВИТЬ</span></button></div>` : '';
  app.innerHTML = `<section class="screen game-screen ${game.flash ? 'is-flashing' : ''} ${game.activeEvent?.id ? `event-${game.activeEvent.id}` : ''}" aria-label="Игровая смена"><header class="game-header"><div><p class="eyebrow">СМЕНА · ${formatTime(game.remaining)}</p><h2>Сыроварня</h2></div><div class="production-badge"><span class="status-dot ${game.phase.toLowerCase()}"></span>${phaseLabel(game.phase)}</div></header><div class="hud" aria-label="Показатели смены">${hudCard('Деньги', `${game.money.toLocaleString('ru-RU')} ₽`, '₽')}${hudCard('Нервы', percent(game.nerves), '⚡')}${hudCard('Сыр', `${game.cheese} кг`, '◒')}${hudCard('Электричество', percent(game.power), '⌁')}</div><div class="shift-timer"><span>Смена</span><div><i style="width:${(game.remaining / SHIFT_SECONDS) * 100}%"></i></div><strong>${formatTime(game.remaining)}</strong></div>${factoryScene(game, stateText, productionProgress)}<p class="feedback" aria-live="polite">${game.feedback}</p>${game.zeroNerves ? '<p class="zero-nerves">НЕРВЫ: 0% · РЕЖИМ: МНЕ УЖЕ ВСЁ РАВНО</p>' : ''}${controls}${action}${game.flash ? `<div class="floating-feedback">${game.flash}</div>` : ''}${game.activeEvent ? eventOverlay(game.activeEvent) : ''}</section>`;
  bindActions();
}

function factoryScene(game, stateText, productionProgress) {
  const characterState = game.zeroNerves ? 'unbothered' : game.nerves < 40 ? 'stressed' : 'normal';
  const cheeseReward = game.cheese > 0 ? `<div class="cheese-reward" aria-label="Готовый сыр"><i></i><i></i><i></i><b>+${game.cheese} КГ</b></div>` : '';
  return `<section class="factory-scene ${game.phase.toLowerCase()}" aria-label="Сцена сыроварни"><div class="wall-sign">${brand.brandName}</div><div class="sales-poster"><b>ГДЕ НАЙТИ<br>${brand.brandName}</b><span>${brand.salesPoints.join(' · ')}</span></div><div class="door"><i></i></div><div class="shelf"><i></i><i></i><i></i><b>ФОРМЫ</b></div><div class="fridge"><span>СЫРЪ</span><i></i></div><div class="worktable"><span>МОЛОКО</span><i></i></div><div class="crate crate-one">БУРРАТА.<br>НЕ ТРОГАТЬ.</div><div class="crate crate-two">СЫРЪ</div><div class="power-box">⚡<small>НЕ ТРОГАТЬ</small></div><div class="milk-can"><i></i></div><div class="cheesemaker ${characterState}" aria-label="Сыровар"><i class="head"></i><i class="apron">СЫРЪ</i></div>${cheeseReward}<div class="vat"><div class="steam steam-one"></div><div class="steam steam-two"></div><div class="vat-lid"></div><div class="vat-liquid"></div><div class="vat-core"><p class="vat-state">${stateText}</p><div class="progress-track"><i style="width:${productionProgress * 100}%"></i></div><p class="safe-zone">Рабочая зона: <b>82–86 °C</b></p></div></div></section>`;
}

function eventOverlay(event) {
  return `<div class="incident-overlay" role="dialog" aria-modal="true" aria-labelledby="event-title"><section class="incident-card"><p class="eyebrow">${event.marker} БИЗНЕС-ХАОС</p><h3 id="event-title">${event.title}</h3><p class="event-text">${event.text}</p>${event.options.map((option, index) => `<button class="choice-button ${index ? 'danger-choice' : ''}" data-event-choice="${option.id}">${option.label}<small>${option.hint}</small></button>`).join('')}</section></div>`;
}

function renderResult() {
  const message = game.cheese >= 4 ? 'Сыр есть. Деньги вроде тоже. Уже успех.' : game.eventHistory.length >= 2 ? 'Сыра мало. Историй зато много.' : 'Главное — смена закончилась.';
  const rank = resultRank(game);
  const sharePhrase = game.nerves === 0 ? 'Сыроварня работает. Я — уже не очень.' : game.nerves > 70 ? 'Оказывается, ещё не всё потеряно.' : 'Сыр есть. Нервы были.';
  const shareText = `Я пережил смену в «Бизнесе по-донецки» 🧀\nСварил: ${game.cheese} кг\nНервы: ${percent(game.nerves)}\nРанг: ${rank}\n${sharePhrase}\nА ты продержишься?`;
  const ctas = [brand.whereToBuyUrl && `<a class="result-cta" href="${brand.whereToBuyUrl}">ГДЕ КУПИТЬ</a>`, brand.mainChannelUrl && `<a class="result-cta muted" href="${brand.mainChannelUrl}">НАШ КАНАЛ</a>`].filter(Boolean).join('');
  const qr = brand.qrAsset ? `<figure class="qr-block"><img src="${brand.qrAsset}" alt="QR-код: Что сегодня на сыроварне"><figcaption>Что сегодня на сыроварне</figcaption></figure>` : '';
  app.innerHTML = `<section class="screen result-screen"><div class="result-content"><p class="eyebrow">РЕЗУЛЬТАТ СМЕНЫ</p><h1>СМЕНА<br><span>ОКОНЧЕНА</span></h1><div class="result-rank"><small>ВАШ РАНГ</small><b>${rank}</b></div><p class="result-message">${message}</p><p class="result-story">${resultStory(game)}</p><div class="result-grid score-grid"><p><span>🧀 Сыр</span><b>${game.cheese} кг</b></p><p><span>💰 Деньги</span><b>${game.money.toLocaleString('ru-RU')} ₽</b></p><p><span>❤️ Нервы</span><b>${percent(game.nerves)}</b></p><p><span>⚡ Электричество</span><b>${percent(game.power)}</b></p><p><span>💥 События</span><b>${game.eventHistory.length}</b></p></div><button class="primary-button restart-button">ЕЩЁ ОДНА СМЕНА</button><button class="share-button" data-share-text="${encodeURIComponent(shareText)}">ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ</button><section class="share-card" aria-label="Карточка результата"><p>БИЗНЕС ПО-ДОНЕЦКИ</p><strong>Я пережил смену<br>в «${brand.brandName}»</strong><div>🧀 ${game.cheese} кг <span>❤️ ${percent(game.nerves)}</span><span>⚡ ${percent(game.power)}</span></div><b>${rank}</b><small>${sharePhrase}</small></section><section class="brand-outro"><img src="./assets/brand/sergeev-syr-mark.svg" alt="${brand.brandName}"><p>${brand.brandTagline}</p>${qr}${ctas ? `<div class="result-ctas">${ctas}</div>` : ''}</section></div></section>`;
  app.querySelector('.restart-button').addEventListener('click', startShift);
  app.querySelector('.share-button').addEventListener('click', () => shareResult(shareText));
}

async function shareResult(text) {
  const data = { title: 'БИЗНЕС ПО-ДОНЕЦКИ', text, ...(brand.mainChannelUrl ? { url: brand.mainChannelUrl } : {}) };
  const button = app.querySelector('.share-button');
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); button.textContent = 'РЕЗУЛЬТАТ СКОПИРОВАН'; }
    else { button.textContent = 'СКОПИРУЙТЕ ТЕКСТ ИЗ КАРТОЧКИ'; }
  } catch (error) { if (error.name !== 'AbortError') button.textContent = 'НЕ УДАЛОСЬ ПОДЕЛИТЬСЯ'; }
}

function bindActions() {
  app.querySelector('[data-action="start"]')?.addEventListener('click', () => { game = startCooking(game); renderGame(); });
  app.querySelector('[data-action="collect"]')?.addEventListener('click', () => { game = collectCheese(game); renderGame(); });
  app.querySelector('[data-action="heat"]')?.addEventListener('click', () => { game = adjustTemperature(game, 'up'); renderGame(); });
  app.querySelector('[data-action="cool"]')?.addEventListener('click', () => { game = adjustTemperature(game, 'down'); renderGame(); });
  app.querySelectorAll('[data-event-choice]').forEach((button) => button.addEventListener('click', () => { game = resolveEvent(game, button.dataset.eventChoice); renderGame(); }));
}

function hudCard(label, value, icon) { return `<article class="hud-card"><span class="hud-icon" aria-hidden="true">${icon}</span><div><p>${label}</p><strong>${value}</strong></div></article>`; }

startScreen();
