const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const money = (game, amount) => Math.max(0, game.money + amount);
const nerves = (game, amount) => clamp(game.nerves + amount, 0, 100);
const power = (game, amount) => clamp(game.power + amount, 0, 100);

export const EVENTS = [
  { id: 'blackout', marker: '⚡', title: 'СВЕТ ПРОПАЛ', text: 'Ну конечно. Варка идёт.', options: [{ id: 'generator', label: 'ЗАВЕСТИ ГЕНЕРАТОР', hint: '−300 ₽ · −7% нервов', apply: (g) => ({ ...g, money: money(g, -300), nerves: nerves(g, -7), power: power(g, 22), feedback: 'Генератор загудел. Свет вернулся.', flash: '−300 ₽ · +22% электричества' }) }, { id: 'wait', label: 'ЖДАТЬ', hint: '−4 сек · −16% нервов', apply: (g) => ({ ...g, nerves: nerves(g, -16), power: power(g, 10), temperature: g.phase === 'COOKING' ? g.temperature - 2 : g.temperature, remaining: Math.max(0, g.remaining - 4), feedback: 'Свет вернулся. Ванна успела остыть.', flash: '−16 нервов · −4 сек' }) }] },
  { id: 'water', marker: '💧', title: 'ВОДЫ НЕТ', text: 'А оборудование мыть чем?', options: [{ id: 'reserve', label: 'ОТКРЫТЬ ЗАПАС', hint: '−180 ₽ · −7% нервов', apply: (g) => ({ ...g, money: money(g, -180), nerves: nerves(g, -7), feedback: 'Запас воды спас смену.', flash: '−180 ₽ · −7 нервов' }) }, { id: 'save', label: 'ЭКОНОМИТЬ', hint: '−13% нервов · медленнее', apply: (g) => ({ ...g, nerves: nerves(g, -13), cookingProgress: Math.max(0, g.cookingProgress - .18), feedback: 'Экономим. Ванна обиделась.', flash: '−13 нервов' }) }] },
  { id: 'restaurant', marker: '📞', title: 'РЕСТОРАН ЗВОНИТ', text: 'Нам бы 12 кг бурраты. Сегодня.', options: [{ id: 'yes', label: 'КОНЕЧНО', hint: '−12% нервов · шанс на бонус', apply: (g) => ({ ...g, nerves: nerves(g, -12), urgentOrder: true, feedback: 'Срочный заказ принят. Смело.', flash: 'СРОЧНЫЙ ЗАКАЗ · −12 нервов' }) }, { id: 'no', label: 'НЕ СЕГОДНЯ', hint: '−100 ₽ · −6% нервов', apply: (g) => ({ ...g, money: money(g, -100), nerves: nerves(g, -6), feedback: 'Ресторан переживёт. Наверное.', flash: '−100 ₽ · −6 нервов' }) }] },
  { id: 'fridge', marker: '🧊', title: 'ХОЛОДИЛЬНИК РЕШИЛ СТАТЬ ШКАФОМ', text: 'Холодит примерно никак.', options: [{ id: 'fix', label: 'ЧИНИТЬ', hint: '−400 ₽ · −8% нервов', apply: (g) => ({ ...g, money: money(g, -400), nerves: nerves(g, -8), feedback: 'Холодильник снова изображает холодильник.', flash: '−400 ₽ · −8 нервов' }) }, { id: 'watch', label: 'НАБЛЮДАТЬ', hint: '−17% нервов · риск сыра', apply: (g) => ({ ...g, nerves: nerves(g, -17), cheese: g.cheese > 0 && Math.random() < .45 ? Math.max(0, g.cheese - 1) : g.cheese, feedback: 'Наблюдаем. Он тоже наблюдает.', flash: g.cheese > 0 ? '−17 нервов · риск 1 кг' : '−17 нервов' }) }] },
  { id: 'mercury', marker: '🧾', title: 'МЕРКУРИЙ', text: 'Решил, что у вас слишком много свободного времени.', options: [{ id: 'now', label: 'РАЗОБРАТЬСЯ СЕЙЧАС', hint: '−4 сек · −11% нервов', apply: (g) => ({ ...g, nerves: nerves(g, -11), remaining: Math.max(0, g.remaining - 4), feedback: 'Разобрались. Время исчезло.', flash: '−11 нервов · −4 сек' }) }, { id: 'later', label: 'ОТЛОЖИТЬ', hint: '−8% нервов · −100 ₽', apply: (g) => ({ ...g, nerves: nerves(g, -8), money: money(g, -100), feedback: 'Будущий геморрой уже в календаре.', flash: '−100 ₽ · −8 нервов' }) }] },
  { id: 'milk', marker: '🥛', title: 'МОЛОКО ПОДОРОЖАЛО', text: 'Потому что почему бы и нет.', options: [{ id: 'buy', label: 'БЕРЁМ', hint: '−300 ₽ · −6% нервов', apply: (g) => ({ ...g, money: money(g, -300), nerves: nerves(g, -6), feedback: 'Берём. Варка продолжается.', flash: '−300 ₽ · −6 нервов' }) }, { id: 'bargain', label: 'ТОРГУЕМСЯ', hint: '70% скидка 100 ₽ · −5% нервов', apply: (g) => { const win = Math.random() < .7; return { ...g, money: money(g, win ? -200 : -300), nerves: nerves(g, -5), feedback: win ? 'Скинули 100 ₽. Победа века.' : 'Не скинули ничего. Классика.', flash: win ? 'Скинули 100 ₽ · −5 нервов' : '−300 ₽ · −5 нервов' }; } }] },
  { id: 'alert', marker: '🚨', title: 'ВОЗДУШНАЯ ТРЕВОГА', text: 'Производство подождёт.', options: [{ id: 'safe', label: 'В БЕЗОПАСНОЕ МЕСТО', hint: '−10% нервов · −4 сек', apply: (g) => ({ ...g, nerves: nerves(g, -10), remaining: Math.max(0, g.remaining - 4), feedback: 'Сыр подождёт. Идём.', flash: 'ПАУЗА · −10 нервов' }) }, { id: 'cheese', label: 'А СЫР?', hint: 'Сыр подождёт. Идём.', apply: (g) => ({ ...g, nerves: nerves(g, -10), remaining: Math.max(0, g.remaining - 4), feedback: 'Сыр подождёт. Идём.', flash: 'ПАУЗА · −10 нервов' }) }] },
  { id: 'calm', marker: '✅', title: 'ВСЁ РАБОТАЕТ', text: 'Свет есть. Вода есть. Холодильник холодит.', rare: true, options: [{ id: 'enjoy', label: 'НЕ ДЫШАТЬ', hint: '+5% нервов', apply: (g) => ({ ...g, nerves: nerves(g, 5), feedback: 'Что-то подозрительно…', flash: '+5 нервов' }) }, { id: 'check', label: 'ПРОВЕРИТЬ ЕЩЁ РАЗ', hint: '+5% нервов', apply: (g) => ({ ...g, nerves: nerves(g, 5), feedback: 'Да. Всё ещё работает. Подозрительно.', flash: '+5 нервов' }) }] },
];

export const EVENT_META = {
  blackout: { category: 'infrastructure', weight: 12, summary: 'пережили свет' },
  water: { category: 'production', weight: 11, summary: 'искали воду' },
  restaurant: { category: 'business', weight: 9, summary: 'отвечали ресторану' },
  fridge: { category: 'infrastructure', weight: 8, summary: 'уговаривали холодильник' },
  mercury: { category: 'bureaucracy', weight: 8, summary: 'спорили с Меркурием' },
  milk: { category: 'business', weight: 11, summary: 'торговались за молоко' },
  alert: { category: 'safety', weight: 6, summary: 'делали паузу' },
  calm: { category: 'relief', weight: 1, summary: 'застали редкий порядок' },
};

export function pickEvent(lastId, lastCategory, random = Math.random) {
  const rare = EVENTS.find((event) => event.rare);
  if (random() < .08) return { ...rare, ...EVENT_META[rare.id] };
  let candidates = EVENTS.filter((event) => !event.rare && event.id !== lastId && EVENT_META[event.id].category !== lastCategory);
  if (!candidates.length) candidates = EVENTS.filter((event) => !event.rare && event.id !== lastId);
  const total = candidates.reduce((sum, event) => sum + EVENT_META[event.id].weight, 0);
  let cursor = random() * total;
  const picked = candidates.find((event) => (cursor -= EVENT_META[event.id].weight) <= 0) ?? candidates.at(-1);
  return { ...picked, ...EVENT_META[picked.id] };
}

export function applyEvent(game, eventId, optionId) {
  const event = EVENTS.find((item) => item.id === eventId);
  const option = event?.options.find((item) => item.id === optionId);
  if (!option) return game;
  return option.apply(game);
}
