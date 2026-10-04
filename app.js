(() => {
'use strict';
// ====================== basics ======================
const START = '2026-10-01', END = '2027-04-01';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const todayISO = () => iso(new Date());
const dayIndex = s => Math.round((parse(s) - parse(START)) / 864e5) + 1;
const WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pretty = s => { const d = parse(s); return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MO[d.getMonth()]; };
const shortD = s => { const d = parse(s); return WD[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MO[d.getMonth()]; };
const r0 = n => Math.round(n);
const r1 = n => Math.round(n * 10) / 10;
const SESSION_TXT = {1:'Lower A + 15 min incline walk', 2:'Upper A + 15 min incline walk', 3:'40 min easy cardio', 4:'Lower B + 15 min incline walk', 5:'Upper B + 15 min incline walk', 6:'40 min easy cardio', 0:'Rest · weigh-in · long walk · meal prep'};

function sched(s) {
  const wd = parse(s).getDay(), idx = dayIndex(s);
  return { wash: wd === 1 || wd === 4 || wd === 6, bpo: idx > 14 ? true : (wd === 1 || wd === 3 || wd === 5), beard: wd === 3 || wd === 0, weigh: wd === 0, session: SESSION_TXT[wd] };
}

// ====================== storage (IndexedDB, this phone only) ======================
const STORES = ['photos', 'meta', 'days', 'pantry', 'mealLog', 'shopping', 'kv'];
let db;
const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open('glowup', 2);
  r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const tx = (store, mode, fn) => new Promise((res, rej) => {
  const t = db.transaction(store, mode), s = t.objectStore(store), q = fn(s);
  t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
});
const dbPut = (store, key, val) => tx(store, 'readwrite', s => s.put(val, key));
const dbDel = (store, key) => tx(store, 'readwrite', s => s.delete(key));
const dbClear = store => tx(store, 'readwrite', s => s.clear());
const dbEntries = store => new Promise((res, rej) => {
  const out = [], c = db.transaction(store).objectStore(store).openCursor();
  c.onsuccess = () => { const k = c.result; if (k) { out.push({k: k.key, v: k.value}); k.continue(); } else res(out); };
  c.onerror = () => rej(c.error);
});

const S = { days: {}, pantry: {}, shop: {}, log: [], set: {plan: {}, basics: {}}, photos: [], scans: [], prod: {} };
const ui = { view: 'today', mealsDate: null, open: {}, pt: 'take', tlSlot: 'face', cmpSlot: 'face', food: 'pantry', prog: 'photos', areas: 'face' };
const LINE_START = '2026-10-04', HOLD_SUNDAYS = ['2026-11-22'], WEEKS = 26;

async function loadAll() {
  S.days = {}; S.pantry = {}; S.shop = {}; S.log = [];
  for (const e of await dbEntries('days')) S.days[e.k] = e.v;
  for (const e of await dbEntries('pantry')) S.pantry[e.k] = e.v;
  for (const e of await dbEntries('shopping')) S.shop[e.k] = e.v;
  for (const e of await dbEntries('mealLog')) S.log.push(Object.assign({key: e.k}, e.v));
  S.log.sort((a, b) => a.ts - b.ts);
  const kv = (await dbEntries('kv')).find(e => e.k === 'settings');
  S.set = Object.assign({plan: {}, basics: {}}, kv ? kv.v : {});
  const kvAll = await dbEntries('kv'); const sc = kvAll.find(e => e.k === 'scans'); S.scans = sc ? sc.v : [];
  S.prod = {}; for (const e of kvAll) if (typeof e.k === 'string' && e.k.startsWith('prod:')) S.prod[e.k.slice(5)] = e.v;
  await reloadPhotos();
}
const saveSet = () => dbPut('kv', 'settings', S.set);
const saveScans = () => dbPut('kv', 'scans', S.scans);
async function saveDay(date, patch) { S.days[date] = Object.assign({}, S.days[date], patch); await dbPut('days', date, S.days[date]); }
async function setPantry(id, patch) {
  const cur = S.pantry[id] || {id};
  const next = Object.assign({}, cur, patch);
  if (!(next.g > 0.0001)) { delete S.pantry[id]; await dbDel('pantry', id); }
  else { next.g = Math.round(next.g * 100) / 100; S.pantry[id] = next; await dbPut('pantry', id, next); }
}
async function saveShop(id) {
  const e = S.shop[id];
  if (!e) return dbDel('shopping', id);
  e.g = Object.values(e.from || {}).reduce((a, b) => a + b, 0);
  if (!(e.g > 0.0001)) { delete S.shop[id]; return dbDel('shopping', id); }
  return dbPut('shopping', id, e);
}

// ====================== food & recipe maths ======================
const foodOf = id => FOODS[id] || (S.pantry[id] && S.pantry[id].custom ? S.pantry[id] : null);
const fname = id => { const f = foodOf(id); return f ? (f.n || f.name || id) : id; };
function macros(ing) {
  const m = {k: 0, p: 0, c: 0, f: 0};
  for (const [id, g] of ing) { const f = foodOf(id); if (!f) continue; m.k += (f.k || 0) * g / 100; m.p += (f.p || 0) * g / 100; m.c += (f.c || 0) * g / 100; m.f += (f.f || 0) * g / 100; }
  return m;
}
function amt(id, g) {
  const f = foodOf(id);
  if (f && f.piece) { const n = g / f.piece; if (Math.abs(n - Math.round(n)) < 0.06 && Math.round(n) >= 1) { const q = Math.round(n); return q + ' ' + (f.unit || 'pc') + (q > 1 ? 's' : '') + ' (' + r0(g) + ' g)'; } }
  return r0(g) + ' g';
}
const have = id => (S.pantry[id] && S.pantry[id].g) || 0;
function missingOf(r) {
  const out = [];
  for (const [id, g] of r.ing) { const f = FOODS[id]; if (!f || f.staple) continue; const h = have(id); if (h + 1e-6 < g) out.push({id, need: g, have: h, short: g - h}); }
  return out;
}
function plannedId(date, slot) {
  const o = S.set.plan[date] && S.set.plan[date][slot];
  if (o && RECIPES[o]) return o;
  const wd = parse(date).getDay();
  return slot === 'lunch' || slot === 'dinner' ? ROTATION[slot][wd] : ROTATION[slot];
}
const logsFor = (date, slot) => S.log.filter(e => e.date === date && (!slot || e.slot === slot));
function totals(date) {
  const t = {k: 0, p: 0, c: 0, f: 0};
  for (const e of logsFor(date)) { t.k += e.k; t.p += e.p; t.c += e.c; t.f += e.f; }
  return t;
}
const priceOf = (id, g) => { const f = foodOf(id); if (!f || !f.pack || !f.price) return 0; return Math.ceil(g / f.pack - 1e-9) * f.price; };

// ====================== streak ======================
const CORE = ['am', 'pm', 'spf'];
const isCore = d => { const x = S.days[d] || {}; return CORE.every(k => x[k]) && x.pA && x.pB; };
const coreCount = d => { const x = S.days[d] || {}; return CORE.filter(k => x[k]).length + (x.pA && x.pB ? 1 : 0); };
function streak() {
  const t = todayISO(); let d = isCore(t) ? t : addDays(t, -1), n = 0;
  while (dayIndex(d) >= 1 && isCore(d)) { n++; d = addDays(d, -1); }
  return n;
}

// ====================== UI helpers ======================
let toastT;
function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hide'), 2600);
}
function sheet(html) { $('#sheetroot').innerHTML = '<div class="sheetbg" data-act="sheetbg"><div class="sheet" id="sheetbody">' + html + '</div></div>'; }
const closeSheet = () => { $('#sheetroot').innerHTML = ''; };
const btn = (act, label, data, cls) => '<button class="' + (cls || '') + '" data-act="' + act + '"' + Object.entries(data || {}).map(([k, v]) => ' data-' + k + '="' + esc(v) + '"').join('') + '>' + label + '</button>';
const chip = (txt, cls) => '<span class="chip ' + (cls || '') + '">' + txt + '</span>';
function tick(k, label, sub, on) {
  return '<button class="tick' + (on ? ' on' : '') + '" data-act="tick" data-k="' + k + '"><span class="box">' + (on ? '✓' : '') + '</span><span class="grow"><div class="t">' + label + '</div>' + (sub ? '<div class="h">' + sub + '</div>' : '') + '</span></button>';
}
function macBars(t) {
  const bar = (label, val, target, over) => '<div class="' + (over ? 'over' : '') + '"><b>' + r0(val) + '</b><span>' + label + '</span><div class="fill"><i style="width:' + Math.min(100, target ? val / target * 100 : 0) + '%"></i></div></div>';
  return '<div class="mac">' + bar('kcal / ' + TARGET.kcal, t.k, TARGET.kcal, t.k > TARGET.kcal * 1.08) + bar('protein g / ' + TARGET.p, t.p, TARGET.p, false) + bar('carbs g', t.c, 220, false) + bar('fat g (aim 40+)', t.f, 40, false) + '</div>';
}

// ====================== views ======================
const root = $('#app');
const ALIAS = {pantry: ['food', 'pantry'], shop: ['food', 'shop'], photos: ['progress', 'photos'], backup: ['more']};
function show(v) {
  if (ALIAS[v]) { const [vv, sub] = ALIAS[v]; if (vv === 'food') ui.food = sub; if (vv === 'progress') ui.prog = sub; v = vv; }
  ui.view = v;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === (v === 'prompts' ? 'more' : v)));
  render(); window.scrollTo(0, 0);
}
function render() {
  const fn = {today: vToday, meals: vMeals, food: vFood, areas: vAreas, progress: vProgress, more: vBackup, prompts: vPrompts}[ui.view];
  root.innerHTML = fn();
  if (ui.view === 'progress' && ui.prog === 'photos' && ui.pt === 'compare') bindCompare();
}
const subSeg = (cur, act, items) => '<div class="seg">' + items.map(([k, l]) => '<button data-act="' + act + '" data-id="' + k + '" class="' + (cur === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
function vFood() { return subSeg(ui.food, 'fsub', [['pantry', 'Pantry'], ['shop', 'Shop']]) + (ui.food === 'shop' ? vShop() : vPantry()); }
function vProgress() { return subSeg(ui.prog, 'psub', [['photos', 'Photos'], ['weight', 'Weight'], ['scans', 'Scans']]) + (ui.prog === 'weight' ? vWeight() : ui.prog === 'scans' ? vScans() : vPhotos()); }

// ---------- TODAY ----------
function vToday() {
  const d = todayISO(), x = S.days[d] || {}, sc = sched(d), idx = dayIndex(d);
  const left = Math.max(0, Math.round((parse(END) - parse(d)) / 864e5));
  const pct = Math.min(100, Math.max(0, (idx - 1) / Math.round((parse(END) - parse(START)) / 864e5) * 100));
  let h = '<h1>' + (idx < 1 ? 'Starts 1 October' : 'Day ' + idx) + '</h1><p class="sub">' + pretty(d) + ' · ' + left + ' days to 1 April 2027 · streak ' + streak() + '</p><div class="bar"><i style="width:' + pct + '%"></i></div>';

  h += '<div class="card"><div class="row" style="margin-bottom:8px"><h2 class="grow" style="margin:0">Routine</h2>' + chip(coreCount(d) + '/4 core', coreCount(d) === 4 ? 'ok' : '') + '</div>';
  h += tick('am', 'Morning skin', 'Cleanser, then moisturiser', x.am);
  h += tick('spf', 'Sun cream SPF 50', 'Two finger-lengths, face and neck. Every day, even indoors', x.spf);
  h += tick('pm', 'Evening skin', sc.bpo ? 'Cleanser. <b>Benzaknen tonight</b> on cheeks and jaw, wait 10 min, moisturiser' : 'Cleanser, moisturiser. No Benzaknen tonight', x.pm);
  h += tick('pA', 'Posture set A', 'Chin tucks ×10 · wall slides ×10', x.pA);
  h += tick('pB', 'Posture set B', 'Dead bugs 2×10 · glute bridges 2×15 · hip-flexor stretch 30 s each side', x.pB);
  if (sc.wash) h += tick('wash', 'Hair wash day', 'Shampoo on scalp, conditioner on ends, leave-in, gel, plop 10 min', x.wash);
  if (sc.beard) h += tick('beard', 'Beard trim', 'Trimmer at 3–4 mm. No razor', x.beard);
  h += tick('water', 'Water 3 litres', 'Part of the cut plan', x.water) + tick('sleep', 'Slept 7 hours or more', '', x.sleep);
  h += btn('goareas', 'How to use each product', {}, 'sec sm') + '</div>';

  h += '<div class="card"><h2>Training today</h2>' + tick('sess', sc.session, sc.weigh ? 'Weigh in this morning, after the toilet, before food' : '', x.sess) + '</div>';

  h += '<div class="card"><h2>Walking</h2><div class="row"><div class="grow"><div class="note">Steps today (aim 10,000)</div><input type="number" inputmode="numeric" data-chg="steps" value="' + (x.steps == null ? '' : x.steps) + '" placeholder="0"></div>' +
       '<div style="text-align:center"><div class="note">Walks</div><div class="row">' + btn('walk', '−', {d: -1}, 'sec sm') + '<b style="min-width:22px;text-align:center">' + (x.walks || 0) + '</b>' + btn('walk', '+', {d: 1}, 'sec sm') + '</div></div></div>' +
       '<div style="margin-top:10px" class="note">Walk minutes today</div><input type="number" inputmode="numeric" data-chg="walkMin" value="' + (x.walkMin == null ? '' : x.walkMin) + '" placeholder="0"></div>';

  h += '<div class="card"><h2>Meals today</h2>';
  for (const sl of SLOTS) {
    const done = logsFor(d, sl.id).filter(e => !e.extra), rid = plannedId(d, sl.id), r = RECIPES[rid], miss = missingOf(r).length;
    const st = done.length ? chip('Cooked', 'dn') : (miss ? chip('Blocked', 'no') : chip('Ready', 'ok'));
    h += '<button class="tick" data-act="gomeal" data-slot="' + sl.id + '"><span class="grow"><div class="t">' + sl.label + ' · ' + sl.time + '</div><div class="h">' + esc(done.length ? done[done.length - 1].n : r.n) + '</div></span>' + st + '</button>';
  }
  h += macBars(totals(d)) + '</div>';

  h += '<div class="card"><h2>Weight</h2><div class="row"><div class="grow"><input type="number" step="0.1" inputmode="decimal" data-chg="weight" value="' + (x.weight == null ? '' : x.weight) + '" placeholder="kg"></div></div><div class="note" style="margin-top:6px">Sunday morning only. The daily number is noise.</div></div>';

  const pc = SLOT_PHOTOS.filter(s => S.photos.some(p => p.date === d && p.slot === s.id)).length;
  h += '<div class="card"><div class="row"><div class="grow"><div class="t">Progress photos</div><div class="h">' + pc + ' of 3 taken today</div></div>' + btn('go', 'Open', {v: 'photos'}, 'sec sm') + '</div></div>';
  return h;
}

// ---------- MEALS ----------
function vMeals() {
  const d = ui.mealsDate || todayISO(), isToday = d === todayISO();
  let h = '<h1>Meals</h1><div class="row" style="margin:6px 0 12px">' + btn('mdate', '←', {d: -1}, 'sec sm') + '<div class="grow" style="text-align:center"><b>' + (isToday ? 'Today' : pretty(d)) + '</b><div class="note">' + pretty(d) + '</div></div>' + btn('mdate', '→', {d: 1}, 'sec sm') + '</div>';
  h += '<div class="card" style="padding:10px 14px"><div class="note">Eaten so far</div>' + macBars(totals(d)) + '</div>';
  for (const sl of SLOTS) {
    const rid = plannedId(d, sl.id), r = RECIPES[rid], m = macros(r.ing), miss = missingOf(r), cooked = logsFor(d, sl.id).filter(e => !e.extra);
    const key = d + '|' + sl.id, open = ui.open[key];
    const st = cooked.length ? chip('Cooked', 'dn') : (miss.length ? chip('Blocked', 'no') : chip('Ready', 'ok'));
    h += '<div class="card" id="slot-' + sl.id + '"><button class="tick" style="margin:0;border:0;background:transparent;padding:0" data-act="mopen" data-key="' + esc(key) + '"><span class="grow"><div class="t">' + sl.label + ' · ' + sl.time + '</div><div class="h">' + esc(r.n) + ' · ' + r0(m.k) + ' kcal · ' + r0(m.p) + ' g protein</div></span>' + st + '</button>';
    if (cooked.length) {
      for (const e of cooked) h += '<div class="row" style="margin-top:8px"><div class="grow note">Logged: ' + esc(e.n) + ' · ' + r0(e.k) + ' kcal · ' + r0(e.p) + ' g protein</div>' + btn('undo', 'Undo', {key: e.key}, 'sec sm') + '</div>';
    }
    if (open) {
      h += '<div style="margin-top:10px">';
      for (const [id, g] of r.ing) {
        const f = FOODS[id], hv = have(id), short = !f.staple && hv + 1e-6 < g;
        h += '<div class="ing"><span>' + esc(f.staple ? f.n.split(' (')[0] : f.n) + (f.staple ? ' <span class="note">(basics)</span>' : '') + '</span><span class="' + (short ? 'need' : '') + '">' + amt(id, g) + (f.staple ? '' : (short ? ' · have ' + r0(hv) + ' g' : ' ✓')) + '</span></div>';
      }
      h += '<div class="note" style="margin-top:6px">Weights are raw or dry, before cooking. 40 g dry rice is about 120 g cooked.</div>';
      h += '<ol class="st">' + r.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
      if (r.v) h += '<a class="lnk" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + esc(r.v) + '">▶ ' + esc(r.vt || 'Watch how') + '</a>';
      h += '<div class="row" style="margin-top:12px;flex-wrap:wrap">';
      h += miss.length ? btn('need', 'What do I need to buy?', {rid, date: d}, '') : btn('cook', 'Cook this', {rid, slot: sl.id, date: d}, '');
      h += btn('change', 'Change meal', {slot: sl.id, date: d}, 'sec') + '</div></div>';
    }
    h += '</div>';
  }
  h += '<div class="card"><div class="row"><div class="grow"><div class="t">Ate something else?</div><div class="h">Log it so the day’s totals stay honest</div></div>' + btn('extra', 'Add', {date: d}, 'sec sm') + '</div></div>';
  const extras = logsFor(d).filter(e => e.extra);
  for (const e of extras) h += '<div class="row note" style="margin:0 4px 8px"><div class="grow">' + esc(e.n) + ' · ' + r0(e.k) + ' kcal · ' + r0(e.p) + ' g protein</div>' + btn('undo', 'Undo', {key: e.key}, 'sec sm') + '</div>';
  return h;
}

function openChange(date, slot) {
  const cur = plannedId(date, slot);
  let h = '<h2>Change ' + SLOTS.find(s => s.id === slot).label.toLowerCase() + '</h2><p class="note">Ready means everything is in your pantry.</p>';
  for (const r of Object.values(RECIPES).filter(r => r.slots.includes(slot))) {
    const m = macros(r.ing), miss = missingOf(r).length;
    h += '<button class="tick' + (r.id === cur ? ' on' : '') + '" data-act="pick" data-date="' + date + '" data-slot="' + slot + '" data-rid="' + r.id + '"><span class="grow"><div class="t">' + esc(r.n) + '</div><div class="h">' + r0(m.k) + ' kcal · ' + r0(m.p) + ' g protein</div></span>' + (miss ? chip('Blocked', 'no') : chip('Ready', 'ok')) + '</button>';
  }
  sheet(h + btn('closesheet', 'Close', {}, 'sec'));
}

function openNeed(rid, date) {
  const r = RECIPES[rid], miss = missingOf(r);
  let h = '<h2>' + esc(r.n) + '</h2><p class="note">You are missing:</p>', cost = 0;
  for (const x of miss) { const c = priceOf(x.id, x.short); cost += c; h += '<div class="ing"><span>' + esc(fname(x.id)) + '</span><span class="need">' + amt(x.id, x.short) + (c ? ' · ~€' + c.toFixed(2) : '') + '</span></div>'; }
  h += '<p class="note">About €' + cost.toFixed(2) + ' for the packs.</p><div class="row" style="flex-wrap:wrap">' + btn('addneed', 'Add to shopping list', {rid, date}, '') + btn('closesheet', 'Close', {}, 'sec') + '</div>';
  sheet(h);
}
async function addNeed(rid, date) {
  const r = RECIPES[rid];
  for (const x of missingOf(r)) {
    const e = S.shop[x.id] || (S.shop[x.id] = {id: x.id, from: {}});
    e.from[rid + '@' + date] = x.short; await saveShop(x.id);
  }
  closeSheet(); toast('Added to your shopping list'); render();
}

function openCook(rid, slot, date) {
  const r = RECIPES[rid];
  let h = '<h2>Cook ' + esc(r.n) + '</h2><p class="note">Raw or dry weights. Change an amount if you used a different one. It is taken from your pantry.</p>';
  r.ing.forEach(([id, g], i) => {
    const f = FOODS[id];
    h += '<div class="ing"><span class="grow" style="padding-top:8px">' + esc(f.staple ? f.n.split(' (')[0] : f.n) + (f.staple ? ' <span class="note">(basics)</span>' : '') + '</span><span style="width:96px"><input type="number" inputmode="decimal" id="ck' + i + '" data-ck="' + id + '" value="' + g + '"></span></div>';
  });
  h += '<div id="ckmac"></div><div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('cookgo', 'Cook and log it', {rid, slot, date}, '') + btn('closesheet', 'Cancel', {}, 'sec') + '</div>';
  sheet(h);
  const upd = () => { const ing = [...document.querySelectorAll('[data-ck]')].map(i => [i.dataset.ck, parseFloat(i.value) || 0]); $('#ckmac').innerHTML = macBars(macros(ing)); };
  document.querySelectorAll('[data-ck]').forEach(i => i.oninput = upd); upd();
}
async function doCook(rid, slot, date) {
  const r = RECIPES[rid];
  const ing = [...document.querySelectorAll('[data-ck]')].map(i => [i.dataset.ck, parseFloat(i.value) || 0]);
  for (const [id, g] of ing) { const f = FOODS[id]; if (!f.staple && g > have(id) + 1e-6) { toast('Not enough ' + f.n + ' in the pantry (' + r0(have(id)) + ' g)', true); return; } }
  const used = ing.filter(([id, g]) => !FOODS[id].staple && g > 0);
  for (const [id, g] of used) await setPantry(id, {g: have(id) - g});
  const m = macros(ing), ts = Date.now(), key = date + '|' + ts + '|' + Math.random().toString(36).slice(2, 6);
  const entry = {date, slot, rid, n: r.n, k: m.k, p: m.p, c: m.c, f: m.f, used, ts, extra: false};
  await dbPut('mealLog', key, entry); S.log.push(Object.assign({key}, entry));
  closeSheet(); toast('Logged · ' + r0(m.k) + ' kcal, ' + r0(m.p) + ' g protein'); render();
}
async function undoLog(key) {
  const e = S.log.find(x => x.key === key); if (!e) return;
  for (const [id, g] of (e.used || [])) await setPantry(id, {g: have(id) + g});
  S.log = S.log.filter(x => x.key !== key); await dbDel('mealLog', key); toast('Undone, ingredients returned to the pantry'); render();
}

function openExtra(date) {
  const opts = Object.entries(FOODS).filter(([, f]) => !f.staple).map(([id, f]) => '<option value="' + id + '">' + esc(f.n) + '</option>').join('') +
    Object.values(S.pantry).filter(p => p.custom).map(p => '<option value="' + p.id + '">' + esc(p.n) + '</option>').join('');
  let h = '<h2>Log something else</h2><p class="note">Pick a food and the grams, or type the numbers yourself.</p>' +
    '<select id="exfood"><option value="">Something else (type numbers)</option>' + opts + '</select>' +
    '<div class="note" style="margin-top:10px">Grams</div><input type="number" inputmode="decimal" id="exg" placeholder="100">' +
    '<div id="exman" style="margin-top:10px"><input type="text" id="exn" placeholder="What was it?"><div class="row" style="margin-top:8px"><input type="number" id="exk" placeholder="kcal"><input type="number" id="exp" placeholder="protein g"></div><div class="row" style="margin-top:8px"><input type="number" id="exc" placeholder="carbs g"><input type="number" id="exf" placeholder="fat g"></div></div>' +
    '<label class="note" id="expl" style="display:block;margin-top:10px"><input type="checkbox" id="extake" checked> Take it from my pantry too</label>' +
    '<div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('extrago', 'Log it', {date}, '') + btn('closesheet', 'Cancel', {}, 'sec') + '</div>';
  sheet(h);
  const sync = () => { const v = $('#exfood').value; $('#exman').classList.toggle('hide', !!v); $('#expl').classList.toggle('hide', !v); };
  $('#exfood').onchange = sync; sync();
}
async function doExtra(date) {
  const id = $('#exfood').value, ts = Date.now(), key = date + '|' + ts + '|' + Math.random().toString(36).slice(2, 6);
  let entry;
  if (id) {
    const g = parseFloat($('#exg').value); if (!(g > 0)) return toast('Enter the grams', true);
    const m = macros([[id, g]]); const take = $('#extake').checked && !FOODS[id]?.staple;
    if (take) { if (g > have(id) + 1e-6) return toast('Only ' + r0(have(id)) + ' g in the pantry. Untick "take it from my pantry" or fix the grams.', true); await setPantry(id, {g: have(id) - g}); }
    entry = {date, slot: 'extra', rid: '', n: fname(id) + ' ' + r0(g) + ' g', k: m.k, p: m.p, c: m.c, f: m.f, used: take ? [[id, g]] : [], ts, extra: true};
  } else {
    const n = $('#exn').value.trim() || 'Something else', k = parseFloat($('#exk').value) || 0;
    if (!(k > 0)) return toast('Enter at least the calories', true);
    entry = {date, slot: 'extra', rid: '', n, k, p: parseFloat($('#exp').value) || 0, c: parseFloat($('#exc').value) || 0, f: parseFloat($('#exf').value) || 0, used: [], ts, extra: true};
  }
  await dbPut('mealLog', key, entry); S.log.push(Object.assign({key}, entry)); closeSheet(); toast('Logged'); render();
}

// ---------- PANTRY ----------
function vPantry() {
  const items = Object.values(S.pantry);
  let h = '<h1>Pantry</h1><p class="sub">The food you have at home right now. Cooking takes from it, shopping adds to it.</p><div class="row" style="margin-bottom:12px">' + btn('padd', 'Add food', {}, '') + '</div>';
  if (!items.length) return h + '<div class="empty">Your pantry is empty.<br>Open the Shop tab, or tap Add food to enter what you already have.</div>';
  const cats = {};
  for (const p of items) { const f = foodOf(p.id); const c = p.custom ? 'Other' : (f ? f.cat : 'Other'); (cats[c] = cats[c] || []).push(p); }
  for (const c of Object.keys(cats).sort()) {
    h += '<div class="card"><h2>' + esc(c) + '</h2>';
    for (const p of cats[c].sort((a, b) => fname(a.id).localeCompare(fname(b.id)))) {
      const f = foodOf(p.id), low = f && f.pack > 1 && !p.custom && p.g < f.pack * 0.15;
      h += '<div class="ing" style="align-items:center"><span class="grow">' + esc(fname(p.id)) + (low ? ' ' + chip('low', 'no') : '') + '</span><span style="margin-right:8px"><b>' + amt(p.id, p.g) + '</b></span>' + btn('pset', 'Edit', {id: p.id}, 'sec sm') + '</div>';
    }
    h += '</div>';
  }
  return h;
}
function openPantrySet(id) {
  const p = S.pantry[id];
  sheet('<h2>' + esc(fname(id)) + '</h2><p class="note">Set the exact amount you have now (grams). 0 removes it.</p><input type="number" inputmode="decimal" id="psg" value="' + (p ? p.g : '') + '">' +
    '<div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('psgo', 'Save', {id}, '') + btn('closesheet', 'Cancel', {}, 'sec') + '</div>');
}
function openPantryAdd() {
  const opts = Object.entries(FOODS).filter(([, f]) => !f.staple).sort((a, b) => a[1].n.localeCompare(b[1].n)).map(([id, f]) => '<option value="' + id + '">' + esc(f.n) + '</option>').join('');
  sheet('<h2>Add food to the pantry</h2><select id="pafood"><option value="">Something not on the list</option>' + opts + '</select>' +
    '<div class="note" style="margin-top:10px">Grams you have</div><input type="number" inputmode="decimal" id="pag" placeholder="500">' +
    '<div id="paman" style="margin-top:10px"><input type="text" id="pan" placeholder="Name"><div class="note" style="margin-top:6px">Per 100 g (optional, used for the macros)</div><div class="row"><input type="number" id="pak" placeholder="kcal"><input type="number" id="pap" placeholder="protein"></div><div class="row" style="margin-top:8px"><input type="number" id="pac" placeholder="carbs"><input type="number" id="paf" placeholder="fat"></div></div>' +
    '<div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('pago', 'Add', {}, '') + btn('closesheet', 'Cancel', {}, 'sec') + '</div>');
  const sync = () => $('#paman').classList.toggle('hide', !!$('#pafood').value); $('#pafood').onchange = sync; sync();
}
async function doPantryAdd() {
  const id = $('#pafood').value, g = parseFloat($('#pag').value);
  if (!(g > 0)) return toast('Enter the grams', true);
  if (id) await setPantry(id, {g: have(id) + g});
  else {
    const n = $('#pan').value.trim(); if (!n) return toast('Enter a name', true);
    const cid = 'c_' + Date.now().toString(36);
    await setPantry(cid, {id: cid, custom: true, n, g, k: parseFloat($('#pak').value) || 0, p: parseFloat($('#pap').value) || 0, c: parseFloat($('#pac').value) || 0, f: parseFloat($('#paf').value) || 0, cat: 'Other'});
  }
  closeSheet(); toast('Added to the pantry'); render();
}

// ---------- SHOP ----------
function vShop() {
  const items = Object.values(S.shop).filter(e => e.g > 0);
  let h = '<h1>Shop</h1><p class="sub">What to buy. Tick an item when you have bought it and it goes into your pantry.</p><div class="row" style="margin-bottom:12px;flex-wrap:wrap">' + btn('week', 'Fill the list for the next 7 days', {}, '') + '</div>';
  let total = 0;
  if (!items.length) h += '<div class="empty">Your shopping list is empty.<br>Tap the button above, or open a blocked meal and tap “What do I need to buy?”</div>';
  else {
    h += '<div class="card">';
    for (const e of items.sort((a, b) => fname(a.id).localeCompare(fname(b.id)))) {
      const f = foodOf(e.id), packs = f && f.pack ? Math.ceil(e.g / f.pack - 1e-9) : 1, cost = priceOf(e.id, e.g); total += cost;
      h += '<div class="ing" style="align-items:center"><button class="chk" aria-label="Bought" data-act="bought" data-id="' + e.id + '"></button><span class="grow">' + esc(fname(e.id)) + '<div class="note">need ' + amt(e.id, e.g) + (f && f.pack > 1 ? ' · ' + packs + ' × ' + (f.unit && f.piece ? r0(f.pack / f.piece) + ' ' + f.unit + 's' : r0(f.pack) + ' g') : '') + '</div></span><span>' + (cost ? '~€' + cost.toFixed(2) : '') + '</span>' + btn('shopdel', '×', {id: e.id}, 'sec sm') + '</div>';
    }
    h += '<div class="row" style="margin-top:10px"><b class="grow">Estimated total</b><b>~€' + total.toFixed(2) + '</b></div></div>';
  }
  const basics = Object.entries(FOODS).filter(([, f]) => f.staple);
  h += '<div class="card"><h2>Basics (buy once)</h2><p class="note">Always assumed at home. Tick what you already have.</p>';
  let bt = 0;
  for (const [id, f] of basics) { const have_ = S.set.basics[id]; if (!have_) bt += f.price; h += tick('basic:' + id, esc(f.n), '~€' + f.price.toFixed(2), have_); }
  h += '<div class="note">Still to buy: ~€' + bt.toFixed(2) + '</div></div><p class="note">Prices are approximate. Items marked with my estimate are not verified; check the shelf.</p>';
  return h;
}
function openBought(id) {
  const e = S.shop[id], f = foodOf(id), packs = f && f.pack ? Math.ceil(e.g / f.pack - 1e-9) : 1, def = f && f.pack ? packs * f.pack : e.g;
  sheet('<h2>Bought ' + esc(fname(id)) + '</h2><p class="note">How many grams did you buy in total? It is filled in with the full packs.</p><input type="number" inputmode="decimal" id="bg" value="' + def + '">' +
    '<div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('boughtgo', 'Add to pantry', {id}, '') + btn('closesheet', 'Cancel', {}, 'sec') + '</div>');
}
async function weekFill() {
  const today = todayISO(), need = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    for (const sl of SLOTS) {
      if (logsFor(d, sl.id).some(e => !e.extra)) continue;
      for (const [id, g] of RECIPES[plannedId(d, sl.id)].ing) if (!FOODS[id].staple) need[id] = (need[id] || 0) + g;
    }
  }
  let n = 0;
  for (const id of new Set([...Object.keys(need), ...Object.keys(S.shop)])) {
    const short = Math.max(0, (need[id] || 0) - have(id)), e = S.shop[id] || (S.shop[id] = {id, from: {}});
    if (short > 0) { e.from.week = short; n++; } else delete e.from.week;
    await saveShop(id);
  }
  toast(n ? n + ' items added for the next 7 days' : 'Your pantry already covers the next 7 days'); render();
}


// ---------- AREAS ----------

const promptMan = id => MAN_PREFIX + PICS_TEXT[id].act + MAN_END;
const promptProd = id => PROD_PREFIX + PICS_TEXT[id].pp + PROD_END;
function picsRow(id) {
  const pc = PICS[id] || {};
  const box = (src, label) => src ? '<div style="background-image:url(' + esc(src) + ')"></div>' : '<div>' + label + '<br>(picture not added yet)</div>';
  return '<div class="pics">' + box(pc.p, 'The product') + box(pc.m, 'How to use it') + '</div>';
}
function vPrompts() {
  const done = S.set.picsDone || {};
  let h = btn('go', '\u2190 Back', {v: 'more'}, 'sec sm') + '<h1 style="margin-top:12px">Picture prompts</h1><p class="sub">16 prompts for the Gemini app: the man, then one picture of him using each product. Free.</p>';
  h += '<div class="card"><h2>How to do it</h2><ol class="st"><li>Open the <b>Gemini</b> app and start a new chat.</li><li>Copy prompt <b>#0</b>, paste it, send it. Save the picture of the man. If you do not like him, ask again.</li><li>For <b>#1 to #15</b>: tap <b>+</b>, attach that saved picture of the man, then paste the prompt. This keeps the same man in every picture.</li><li>Send the pictures to me in our chat with their number, five at a time. I check them and put them into the app.</li><li>The product photos are real photos: five are already in, and for the rest use \u201cUse my own photo\u201d on the product card when you buy it.</li></ol></div>';
  const row = (key, label, text) => '<div class="card"><div class="row"><div class="grow"><span class="pnum">' + key + '</span><b>' + esc(label) + '</b></div>' + btn('picdone', done[key] ? '\u2713 Done' : 'Mark done', {key}, done[key] ? '' : 'sec sm') + '</div><div class="prompt">' + esc(text) + '</div>' + btn('copypic', 'Copy prompt', {key}, 'sec sm') + '</div>';
  h += row('#0', 'The man (make this first)', MAN_REF_PROMPT);
  PICS_ORDER.forEach((id, i) => { h += row('#' + (i + 1), PRODUCTS[id].short + ' (attach #0)', promptMan(id)); });
  return h;
}
function promptByKey(key) {
  if (key === '#0') return MAN_REF_PROMPT;
  return promptMan(PICS_ORDER[Number(key.slice(1)) - 1]);
}
function stripFor(p) {
  if (p.onDemand) return '<div class="note">Only when a spot needs it.</div>';
  const t = todayISO(); let h = '<div class="wk">';
  for (let i = 0; i < 7; i++) { const d = addDays(t, i), wd = parse(d).getDay(), on = p.days(sched(d), wd); h += '<div class="' + (on ? 'y' : '') + (i === 0 ? ' today' : '') + '">' + WD[wd].slice(0, 2) + '<br>' + (on ? '\u2713' : '\u2013') + '</div>'; }
  return h + '</div>';
}
const promptOf = p => PROMPT_BASE + 'he is ' + p.act + PROMPT_END;
const prodUrls = new Map();
function ownUrl(id) { const b = S.prod[id]; if (!b) return null; if (!prodUrls.has(id)) prodUrls.set(id, URL.createObjectURL(b)); return prodUrls.get(id); }
function picPair(id) {
  const pc = PICS[id] || {}, own = ownUrl(id), n = PICS_ORDER.indexOf(id) + 1, src = own || pc.p;
  let left = '<div><div class="tile prod">' + (src ? '<img alt="Product" src="' + esc(src) + '">' : '<span style="color:#666">No product photo yet</span>') + '</div><div class="cap">' + (own ? 'Your photo' : (pc.p ? esc(pc.credit || '') : 'Take one when you buy it')) + '</div>' +
    '<div class="row" style="margin-top:6px;flex-wrap:wrap;gap:6px">' + btn('ownpic', own ? 'Change my photo' : 'Use my own photo', {id}, 'sec sm') + (own ? btn('ownpicdel', 'Remove', {id}, 'sec sm') : '') + '</div></div>';
  let right = '<div><div class="tile man">' + (pc.m ? '<img alt="How to use it" src="' + esc(pc.m) + '">' : '<span>Picture #' + n + '<br>not made yet</span>') + '</div><div class="cap">' + (pc.m ? 'How to use it' : 'More \u203a Picture prompts') + '</div></div>';
  return '<div class="pair">' + left + right + '</div>' + (pc.note && !own ? '<div class="note">' + esc(pc.note) + '</div>' : '');
}
function prodCard(id) {
  const p = PRODUCTS[id], open = ui.open['p:' + id], how = ui.open['h:' + id], d = todayISO(), on = !p.onDemand && p.days(sched(d), parse(d).getDay()), ci = CARD_INFO[id] || {};
  let h = '<div class="card"><button class="tick" style="margin:0;border:0;background:transparent;padding:0" data-act="prodopen" data-id="' + id + '"><span class="grow"><div class="t">' + esc(p.short) + '</div><div class="h">' + esc(p.n) + '</div></span>' + (p.onDemand ? chip('as needed') : (on ? chip('Use today', 'ok') : chip('Not today', ''))) + '</button>';
  if (open) {
    h += '<div class="price">' + esc(p.where ? p.where.split(/[.(]/)[0].trim() : '') + (p.price ? ' \u00b7 ~' + p.price.toFixed(2) + ' EUR' : '') + ' <span class="note">(' + esc(p.priceNote) + ')</span></div>';
    if (PICS_TEXT[id]) h += picPair(id);
    h += '<div class="info"><div class="lab">WHEN</div><div>' + esc(p.when) + '</div><div class="lab">HOW</div><div>' + esc(ci.how || '') + '</div><div class="lab">ORDER</div><div>' + esc(ci.order || '') + '</div><div class="lab">CAREFUL</div><div><b>' + esc(p.skip[0]) + '</b></div></div>';
    h += btn('howopen', (how ? '\u25bc' : '\u25b6') + ' How to use it', {id}, 'ghost');
    if (how) {
      h += '<div class="sec-t">This week</div>' + stripFor(p);
      h += '<div class="sec-t">Step by step</div><ol class="st">' + p.steps.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
      h += '<div class="sec-t">When NOT to use it</div><ul class="st" style="list-style:disc">' + p.skip.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
      if (p.url) h += '<a class="lnk" target="_blank" rel="noopener" href="' + esc(p.url) + '">Open the product page</a><br>';
      h += '<a class="lnk" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(p.search) + '">\u25b6 Search videos on how to do it</a>';
    }
  }
  return h + '</div>';
}
function areaCard(a) {
  const open = ui.open['a:' + a.id];
  let h = '<div class="card"><button class="tick" style="margin:0;border:0;background:transparent;padding:0" data-act="areaopen" data-id="' + a.id + '"><span class="grow"><div class="t">' + esc(a.n) + '</div><div class="h">' + esc(a.goal) + '</div></span><span class="note">' + (open ? '\u2212' : '+') + '</span></button>';
  if (open) {
    h += '<div class="sec-t">Where you are</div><div class="note">' + esc(a.now) + '</div>';
    h += '<div class="sec-t">What actually moves it</div><ul class="st" style="list-style:disc">' + a.moves.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    if (a.products.length) {
      h += '<div class="sec-t">Products</div>';
      for (const id of a.products) { const p = PRODUCTS[id]; h += '<div class="ing" style="align-items:center"><span class="grow">' + esc(p.short) + '<div class="note">' + (p.price ? '~\u20ac' + p.price.toFixed(2) + ' \u00b7 ' : '') + esc(p.when) + '</div></span>' + btn('gotoprod', 'How', {id}, 'sec sm') + '</div>'; }
    }
    if (a.cant) h += '<div class="sec-t">What will not change</div><div class="note">' + esc(a.cant) + '</div>';
  }
  return h + '</div>';
}
function vAreas() {
  let h = '<h1>Areas</h1><p class="sub">Every part of the face and body: where it is, what moves it, and what to buy</p>' + subSeg(ui.areas, 'asub', [['face', 'Face'], ['body', 'Body'], ['products', 'Products'], ['vitamins', 'Vitamins']]);
  if (ui.areas === 'face' || ui.areas === 'body') h += AREAS.filter(a => a.group.toLowerCase() === ui.areas).map(areaCard).join('');
  else if (ui.areas === 'products') {
    let total = 0; for (const id of PRODUCT_ORDER) total += PRODUCTS[id].price || 0;
    h += '<p class="note">All ' + PRODUCT_ORDER.length + ' products you use, with the days. Total if you bought everything new: about \u20ac' + total.toFixed(0) + '.</p>' + PRODUCT_ORDER.map(prodCard).join('');
  } else {
    h += '<p class="note">What the evidence supports for health and skin. Nothing here is started without the Hausarzt visit.</p>' + SUPPS.map(x => '<div class="card"><div class="row"><div class="t grow">' + esc(x.n) + '</div>' + chip(esc(x.status), x.status === 'No' ? 'no' : (x.status === 'Optional' ? '' : 'dn')) + '</div><div class="note" style="margin-top:6px">' + esc(x.text) + '</div></div>').join('');
  }
  return h;
}
function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true).catch(() => false);
  const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return Promise.resolve(ok);
}

// ---------- PHOTOS ----------
const SLOT_PHOTOS = [
  {id: 'face', label: 'Face', facing: 'user', hint: 'Straight on, neutral face, hair back, same light every day'},
  {id: 'front', label: 'Body front', facing: 'environment', hint: 'Arms relaxed, full body, same spot and distance'},
  {id: 'side', label: 'Body side', facing: 'environment', hint: 'Left side, arms relaxed, stand tall'}
];
const urls = new Map();
const purl = p => { const k = p.date + '|' + p.slot; if (!urls.has(k)) urls.set(k, URL.createObjectURL(p.blob)); return urls.get(k); };
async function reloadPhotos() { S.photos = (await tx('photos', 'readonly', s => s.getAll())).sort((a, b) => a.date.localeCompare(b.date)); }
const slotPhotos = id => S.photos.filter(p => p.slot === id);
const lastBefore = (slot, date) => slotPhotos(slot).filter(p => p.date < date).pop();
const segHtml = (cur, act) => '<div class="seg">' + SLOT_PHOTOS.map(s => '<button data-act="' + act + '" data-id="' + s.id + '" class="' + (cur === s.id ? 'on' : '') + '">' + s.label + '</button>').join('') + '</div>';

function vPhotos() {
  const sub = '<div class="seg">' + [['take', 'Take'], ['timeline', 'Timeline'], ['compare', 'Compare']].map(([k, l]) => '<button data-act="pt" data-id="' + k + '" class="' + (ui.pt === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
  let h = sub;
  if (ui.pt === 'take') {
    const d = todayISO();
    for (const s of SLOT_PHOTOS) {
      const mine = S.photos.find(p => p.date === d && p.slot === s.id), prev = lastBefore(s.id, d), shown = mine || prev;
      h += '<div class="card"><div class="row"><div class="thumb" style="' + (shown ? 'background-image:url(' + purl(shown) + ')' : '') + '">' + (shown ? '' : 'No photo yet') + '</div><div class="grow"><div class="t">' + s.label + '</div><div class="h">' + (mine ? '<span class="done">Done today</span>' : esc(s.hint)) + '</div>' +
           (prev && !mine ? '<div class="h">Showing last photo (' + prev.date + ')</div>' : '') + '<div style="margin-top:10px">' + btn('cap', mine ? 'Retake' : 'Take photo', {id: s.id}, '') + '</div></div></div></div>';
    }
  } else if (ui.pt === 'timeline') {
    const list = slotPhotos(ui.tlSlot).slice().reverse();
    h += segHtml(ui.tlSlot, 'tls');
    h += list.length ? '<div class="grid">' + list.map(p => '<div class="g" data-act="pview" data-key="' + p.date + '|' + p.slot + '" style="background-image:url(' + purl(p) + ')"><span>' + p.date.slice(5) + '</span></div>').join('') + '</div>' : '<div class="empty">No photos in this view yet.</div>';
  } else {
    const list = slotPhotos(ui.cmpSlot);
    h += segHtml(ui.cmpSlot, 'cms');
    if (list.length < 2) h += '<div class="empty">You need at least two photos of this kind to compare.</div>';
    else {
      const opts = sel => list.map(p => '<option value="' + p.date + '"' + (p.date === sel ? ' selected' : '') + '>' + p.date + '</option>').join('');
      h += '<div class="row" style="margin-bottom:10px"><select id="ca">' + opts(list[0].date) + '</select><select id="cb">' + opts(list[list.length - 1].date) + '</select></div>' +
           '<div class="cmp"><img id="ib" alt=""><img id="ia" class="top" alt=""><div class="line" id="ln"></div><span class="lab" style="left:8px" id="la"></span><span class="lab" style="right:8px" id="lb"></span></div>' +
           '<input type="range" id="sl" min="0" max="100" value="50" style="margin-top:12px"><div class="row" style="margin-top:10px">' + btn('play', 'Play all photos', {}, 'sec grow') + '</div>';
    }
  }
  return h;
}
let flip = null;
function bindCompare() {
  clearInterval(flip);
  const list = slotPhotos(ui.cmpSlot); if (list.length < 2) return;
  const set = () => { const a = list.find(p => p.date === $('#ca').value), b = list.find(p => p.date === $('#cb').value); $('#ia').src = purl(a); $('#ib').src = purl(b); $('#la').textContent = a.date; $('#lb').textContent = b.date; };
  const move = () => { const v = $('#sl').value; $('#ia').style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; $('#ln').style.left = v + '%'; };
  $('#ca').onchange = set; $('#cb').onchange = set; $('#sl').oninput = move; set(); move();
}
function playAll() {
  const list = slotPhotos(ui.cmpSlot); clearInterval(flip); let i = 0;
  $('#ia').style.clipPath = 'inset(0 100% 0 0)'; $('#ln').classList.add('hide');
  flip = setInterval(() => { const p = list[i % list.length]; $('#ib').src = purl(p); $('#lb').textContent = p.date; $('#la').textContent = ''; i++; }, 280);
}

// camera
let stream = null, curSlot = null, facing = 'user', busy = false;
async function capture(slot) {
  curSlot = slot; facing = slot.facing;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return fallbackPick();
  try { await startCam(); } catch (e) { fallbackPick(); }
}
async function startCam() {
  stopCam();
  stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: facing}, width: {ideal: 1920}, height: {ideal: 1440}}, audio: false});
  $('#vid').srcObject = stream;
  const prev = lastBefore(curSlot.id, todayISO()), gh = $('#ghost');
  if (prev) { gh.src = purl(prev); gh.classList.remove('hide'); } else gh.classList.add('hide');
  gh.style.opacity = $('#gh').value / 100; $('#cam').classList.remove('hide');
}
function stopCam() { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; }
function closeCam() { stopCam(); $('#cam').classList.add('hide'); $('#count').classList.add('hide'); busy = false; }
$('#camclose').onclick = closeCam;
$('#camflip').onclick = async () => { facing = facing === 'user' ? 'environment' : 'user'; try { await startCam(); } catch (e) {} };
$('#gh').oninput = () => { $('#ghost').style.opacity = $('#gh').value / 100; };
$('#shutter').onclick = async () => {
  if (busy) return; busy = true;
  let n = parseInt($('#timer').value, 10); const c = $('#count');
  while (n > 0) { c.textContent = n; c.classList.remove('hide'); await new Promise(r => setTimeout(r, 1000)); n--; }
  c.classList.add('hide'); await snap(); busy = false;
};
async function snap() {
  const v = $('#vid'), w = v.videoWidth, h = v.videoHeight; if (!w) return;
  const k = Math.min(1, 1600 / Math.max(w, h)), cv = document.createElement('canvas');
  cv.width = Math.round(w * k); cv.height = Math.round(h * k); cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
  await savePhoto(await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.88)));
}
async function savePhoto(blob) {
  const d = todayISO(); await dbPut('photos', d + '|' + curSlot.id, {date: d, slot: curSlot.id, blob, ts: Date.now()});
  urls.delete(d + '|' + curSlot.id); await reloadPhotos(); closeCam(); render();
}
function fallbackPick() {
  const f = $('#fallback'); f.setAttribute('capture', curSlot.facing === 'user' ? 'user' : 'environment'); f.value = '';
  f.onchange = async () => {
    const file = f.files[0]; if (!file) return;
    const img = await createImageBitmap(file), k = Math.min(1, 1600 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    await savePhoto(await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.88)));
  };
  f.click();
}


// ---------- WEIGHT + SCANS ----------
const weightDays = () => Object.keys(S.days).filter(d => S.days[d].weight != null).sort();
const baseline = () => { const w = weightDays(); return w.length ? S.days[w[0]].weight : 85; };
function targetLine() {
  const base = baseline(); const rows = []; let sun = LINE_START, target = base;
  for (let k = 1; k <= WEEKS; k++) {
    if (k > 1 && !HOLD_SUNDAYS.includes(sun)) target = target > 75 ? Math.max(75, target - 0.75) : Math.max(72.5, target - 0.5);
    rows.push({k, sun, target: Math.round(target * 10) / 10, hold: HOLD_SUNDAYS.includes(sun)});
    sun = addDays(sun, 7);
  }
  return rows;
}
function chartSvg(series, opts) {
  // series: [{pts:[[x,y]], color, dash}], x = day number, y = value
  const W = 340, Hh = 170, pl = 34, pr = 8, pt = 10, pb = 22;
  const all = series.flatMap(s => s.pts); if (!all.length) return '';
  let x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
  if (x1 === x0) x1 = x0 + 1; const pad_ = (y1 - y0) * 0.15 || 1; y0 -= pad_; y1 += pad_;
  const X = x => pl + (x - x0) / (x1 - x0) * (W - pl - pr), Y = y => pt + (1 - (y - y0) / (y1 - y0)) * (Hh - pt - pb);
  let g = '';
  for (let i = 0; i <= 3; i++) { const v = y0 + (y1 - y0) * i / 3, yy = Y(v); g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#262a33"/><text x="2" y="' + (yy + 4) + '" fill="#9aa1ad" font-size="10">' + v.toFixed(opts.dec) + '</text>'; }
  for (const se of series) {
    const d = se.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
    g += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="2"' + (se.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
    if (!se.dash) for (const p of se.pts) g += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.5" fill="' + se.color + '"/>';
  }
  return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="100%" role="img" aria-label="' + esc(opts.label) + '">' + g + '</svg>';
}
function vWeight() {
  const d = todayISO(), x = S.days[d] || {}, ws = weightDays(), line = targetLine();
  let h = '<div class="card"><h2>Today</h2><div class="row"><div class="grow"><div class="note">Weight (kg)</div><input type="number" step="0.1" inputmode="decimal" data-chg="weight" value="' + (x.weight == null ? '' : x.weight) + '"></div><div class="grow"><div class="note">Waist (cm)</div><input type="number" step="0.5" inputmode="decimal" data-chg="waist" value="' + (x.waist == null ? '' : x.waist) + '"></div></div><div class="note" style="margin-top:6px">Weigh on Sunday morning, after the toilet, before food, same scale. Waist: at the navel, relaxed, breathing out.</div></div>';
  const n0 = (s) => Math.round((parse(s) - parse(START)) / 864e5);
  const actual = ws.map(s => [n0(s), S.days[s].weight]), tgt = line.map(r => [n0(r.sun), r.target]);
  h += '<div class="card"><h2>Weight against the plan</h2>' + chartSvg([{pts: tgt, color: '#6b7380', dash: true}, {pts: actual, color: '#7cf0b4'}], {dec: 1, label: 'Weight chart'}) + '<div class="note">Dashed line: the plan (0.75 kg a week down to 75, then 0.5 a week to 72.5, holding on the diet-break week). Green: your weigh-ins.</div></div>';
  const t = todayISO(); let rows = '';
  for (const r of line) {
    if (r.sun > addDays(t, 21)) break;
    const a = S.days[r.sun] && S.days[r.sun].weight, delta = a != null ? Math.round((a - r.target) * 10) / 10 : null;
    rows += '<div class="ing"><span>' + shortD(r.sun) + (r.hold ? ' <span class="note">break week</span>' : '') + '</span><span>' + r.target.toFixed(1) + ' \u2192 <b>' + (a != null ? a.toFixed(1) : '\u2013') + '</b>' + (delta != null ? ' <span class="' + (Math.abs(delta) <= 1 ? 'done' : 'need') + '">' + (delta > 0 ? '+' : '') + delta + '</span>' : '') + '</span></div>';
  }
  h += '<div class="card"><h2>Sundays</h2><div class="note">plan \u2192 your weight</div>' + rows + '</div>';
  const wl = ws.filter(s => S.days[s].waist != null);
  if (wl.length) h += '<div class="card"><h2>Waist</h2>' + wl.slice(-6).map(s => '<div class="ing"><span>' + pretty(s) + '</span><b>' + S.days[s].waist + ' cm</b></div>').join('') + '</div>';
  return h;
}
const SCAN_FIELDS = [['w', 'Weight (kg)'], ['bf', 'Body fat (%)'], ['smm', 'Skeletal muscle (kg)'], ['bfm', 'Body fat mass (kg)'], ['vf', 'Visceral fat level'], ['ra', 'Lean right arm (kg)'], ['la', 'Lean left arm (kg)'], ['tr', 'Lean trunk (kg)'], ['rl', 'Lean right leg (kg)'], ['ll', 'Lean left leg (kg)']];
function vScans() {
  const list = S.scans.slice().sort((a, b) => a.date.localeCompare(b.date));
  let h = '<div class="card"><h2>Body-composition scans</h2><p class="note">Once a month, on a real InBody machine (gym, pharmacy or studio) or your own InBody scale. Same machine, same time of day, no training that morning, empty stomach. Type the numbers from the printout here.</p>' + btn('scanadd', 'Add a scan', {}, '') + '</div>';
  if (!list.length) return h + '<div class="empty">No scans yet.</div>';
  if (list.length >= 2) {
    const n0 = s => Math.round((parse(s) - parse(START)) / 864e5);
    const bf = list.filter(e => e.bf != null).map(e => [n0(e.date), e.bf]), sm = list.filter(e => e.smm != null).map(e => [n0(e.date), e.smm]);
    if (bf.length > 1) h += '<div class="card"><h2>Body fat %</h2>' + chartSvg([{pts: bf, color: '#ffd27a'}], {dec: 1, label: 'Body fat chart'}) + '</div>';
    if (sm.length > 1) h += '<div class="card"><h2>Skeletal muscle (kg)</h2>' + chartSvg([{pts: sm, color: '#7cf0b4'}], {dec: 1, label: 'Muscle chart'}) + '</div>';
  }
  const rev = list.slice().reverse();
  rev.forEach((e, i) => {
    const prev = rev[i + 1], dl = (k) => (prev && e[k] != null && prev[k] != null) ? ' <span class="note">(' + (e[k] - prev[k] > 0 ? '+' : '') + Math.round((e[k] - prev[k]) * 10) / 10 + ')</span>' : '';
    h += '<div class="card"><div class="row"><div class="t grow">' + pretty(e.date) + '</div>' + btn('scandel', '\u00d7', {date: e.date}, 'sec sm') + '</div>' + (e.src ? '<div class="note">' + esc(e.src) + '</div>' : '');
    for (const [k, l] of SCAN_FIELDS) if (e[k] != null) h += '<div class="ing"><span>' + l + '</span><b>' + e[k] + dl(k) + '</b></div>';
    h += '</div>';
  });
  return h;
}
function openScan() {
  let h = '<h2>Add a scan</h2><div class="note">Date</div><input type="text" id="sd" value="' + todayISO() + '"><div class="note" style="margin-top:8px">Where / which machine (optional)</div><input type="text" id="ss" placeholder="e.g. InBody 270 at the gym">';
  for (const [k, l] of SCAN_FIELDS) h += '<div class="note" style="margin-top:8px">' + l + '</div><input type="number" step="0.1" inputmode="decimal" id="sc_' + k + '">';
  sheet(h + '<div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('scango', 'Save scan', {}, '') + btn('closesheet', 'Cancel', {}, 'sec') + '</div>');
}
async function saveScan() {
  const date = $('#sd').value.trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast('Date must look like 2026-11-01', true);
  const e = {date, src: $('#ss').value.trim()}; let any = false;
  for (const [k] of SCAN_FIELDS) { const v = parseFloat($('#sc_' + k).value); if (!isNaN(v)) { e[k] = v; any = true; } }
  if (!any) return toast('Enter at least one number', true);
  S.scans = S.scans.filter(x => x.date !== date).concat([e]); await saveScans(); closeSheet(); toast('Scan saved'); render();
}

// ---------- SEND TO CLAUDE ----------
function snapshot() {
  const t = todayISO(), idx = dayIndex(t), L = [], avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  L.push('ROUTINE SNAPSHOT ' + t + ' (day ' + idx + ' of ' + (Math.round((parse(END) - parse(START)) / 864e5) + 1) + ')');
  let pat = ''; for (let i = 13; i >= 0; i--) { const d = addDays(t, -i); pat += dayIndex(d) < 1 ? '.' : (isCore(d) ? 'X' : (coreCount(d) > 0 ? 'o' : '-')); }
  L.push('Core streak: ' + streak() + ' days. Last 14 days (old to new, X = all 4 core done, o = partial, - = none, . = before start): ' + pat);
  const td = S.days[t] || {}; L.push('Today so far: morning skin ' + (td.am ? 'done' : 'no') + ', evening skin ' + (td.pm ? 'done' : 'no') + ', SPF ' + (td.spf ? 'done' : 'no') + ', posture A ' + (td.pA ? 'done' : 'no') + ', posture B ' + (td.pB ? 'done' : 'no'));
  const last7 = Array.from({length: 7}, (_, i) => addDays(t, -i));
  const steps = last7.map(d => (S.days[d] || {}).steps).filter(v => v != null), walks = last7.map(d => (S.days[d] || {}).walks).filter(v => v != null);
  L.push('Steps, last 7 days: ' + (steps.length ? 'average ' + r0(avg(steps)) + ' over ' + steps.length + ' logged days (target 10000)' : 'none logged') + (walks.length ? '; walks per day average ' + r1(avg(walks)) : ''));
  L.push('Water 3 l ticked ' + last7.filter(d => (S.days[d] || {}).water).length + '/7 days, slept 7 h ' + last7.filter(d => (S.days[d] || {}).sleep).length + '/7 days, sessions done ' + last7.filter(d => (S.days[d] || {}).sess).length + '/7');
  const ld = last7.filter(d => logsFor(d).length), tot = ld.map(d => totals(d));
  L.push('Food, last 7 days: ' + (ld.length ? 'logged on ' + ld.length + ' days; average ' + r0(avg(tot.map(x => x.k))) + ' kcal, ' + r0(avg(tot.map(x => x.p))) + ' g protein, ' + r0(avg(tot.map(x => x.c))) + ' g carbs, ' + r0(avg(tot.map(x => x.f))) + ' g fat (targets 1850 kcal, 180 g protein)' : 'nothing logged'));
  const ws = weightDays();
  if (ws.length) {
    const line = targetLine(), cur = line.filter(r => r.sun <= t).pop() || line[0], lw = ws[ws.length - 1];
    L.push('Weights (kg): ' + ws.slice(-8).map(d => d.slice(5) + ' ' + S.days[d].weight).join(', ') + '. Baseline ' + baseline() + '. Plan target this week ' + cur.target.toFixed(1) + ' (latest ' + S.days[lw].weight + ', ' + (Math.round((S.days[lw].weight - cur.target) * 10) / 10) + ' vs plan)');
  } else L.push('Weights: none yet');
  const wl = ws.filter(d => S.days[d].waist != null); L.push('Waist (cm): ' + (wl.length ? wl.slice(-5).map(d => d.slice(5) + ' ' + S.days[d].waist).join(', ') : 'none yet'));
  const sc = S.scans.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
  L.push('Scans: ' + (sc.length ? sc.map(e => e.date + (e.src ? ' (' + e.src + ')' : '') + ' ' + SCAN_FIELDS.filter(([k]) => e[k] != null).map(([k, l]) => l.replace(/ \(.*\)/, '') + ' ' + e[k]).join(', ')).join(' | ') : 'none yet'));
  const low = Object.values(S.pantry).filter(p => { const f = foodOf(p.id); return f && f.pack > 1 && !p.custom && p.g < f.pack * 0.15; }).map(p => fname(p.id) + ' ' + r0(p.g) + ' g');
  L.push('Pantry: ' + Object.keys(S.pantry).length + ' items' + (low.length ? '; low: ' + low.join(', ') : ''));
  const sh = Object.values(S.shop).filter(e => e.g > 0); L.push('Shopping list: ' + sh.length + ' items' + (sh.length ? ', about EUR ' + sh.reduce((a, e) => a + priceOf(e.id, e.g), 0).toFixed(0) : ''));
  const pd = [...new Set(S.photos.map(p => p.date))].sort(); L.push('Photos: ' + pd.length + ' days with photos' + (pd.length ? ', last on ' + pd[pd.length - 1] : ''));
  return L.join('\n');
}
function openSnapshot() {
  sheet('<h2>Send to Claude</h2><p class="note">This is a short text summary of your numbers. No photos, no names. Copy it and paste it into our chat.</p><div class="prompt" id="snaptxt" style="white-space:pre-wrap">' + esc(snapshot()) + '</div><div class="row" style="margin-top:12px;flex-wrap:wrap">' + btn('copysnap', 'Copy it', {}, '') + btn('closesheet', 'Close', {}, 'sec') + '</div>');
}

// ---------- BACKUP ----------
function vBackup() {
  const est = ui.est;
  return '<h1>Backup</h1><p class="sub">Everything lives only on this phone</p>' +
    '<div class="card"><div class="t">' + S.photos.length + ' photos' + (est ? ' · ' + est + ' MB used' : '') + '</div><div class="h" style="margin:6px 0 12px">' + (ui.persisted ? 'Storage is protected from being cleared by the phone.' : 'The phone could clear this storage if it runs very low on space. Make a backup now and then.') + '</div>' + btn('zip', 'Save all photos as a ZIP', {}, S.photos.length ? '' : '') + '<div class="note" style="margin-top:8px">Saves to your Downloads. Do this every Sunday.</div></div>' +
    '<div class="card"><div class="t">Meals, pantry, shopping, routine</div><div class="h" style="margin:6px 0 12px">One small file with everything except the photos.</div><div class="row" style="flex-wrap:wrap">' + btn('jsonout', 'Save data file', {}, '') + btn('jsonin', 'Restore from a data file', {}, 'sec') + '</div></div>' +
    '<div class="card"><div class="t">Picture prompts</div><div class="h" style="margin:6px 0 12px">16 prompts to make a picture of a man using each face and hair product, in the Gemini app.</div>' + btn('go', 'Open the prompts', {v: 'prompts'}, '') + '</div>' + '<div class="card"><div class="t">Send to Claude</div><div class="h" style="margin:6px 0 12px">A short text summary of your streak, food, weight and scans to paste into the chat. No photos.</div>' + btn('snap', 'Make the summary', {}, '') + '</div>' + '<div class="card"><div class="t">Privacy</div><div class="h">Nothing is ever uploaded. There is no account and no server. Your photos and data exist only in this app on this phone, plus any file you save yourself.</div></div>';
}
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
async function makeZip() {
  const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
  const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const p of S.photos) {
    const name = enc.encode(p.date + '_' + p.slot + '.jpg'), data = new Uint8Array(await p.blob.arrayBuffer()), crc = crc32(data);
    const lh = new Uint8Array([0x50,0x4b,3,4, 20,0, 0,0, 0,0, 0,0, 0,0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0,0]);
    parts.push(lh, name, data);
    cd.push(new Uint8Array([0x50,0x4b,1,2, 20,0, 20,0, 0,0, 0,0, 0,0, 0,0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0,0, 0,0, 0,0, 0,0, 0,0,0,0, ...u32(off)]), name);
    off += lh.length + name.length + data.length;
  }
  const cdSize = cd.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([0x50,0x4b,5,6, 0,0, 0,0, ...u16(S.photos.length), ...u16(S.photos.length), ...u32(cdSize), ...u32(off), 0,0]);
  download(new Blob([...parts, ...cd, end], {type: 'application/zip'}), 'routine-photos-' + todayISO() + '.zip');
}
function exportJSON() {
  const data = {app: 'routine', version: 2, exported: todayISO(), days: S.days, pantry: S.pantry, shop: S.shop, log: S.log, settings: S.set, scans: S.scans};
  download(new Blob([JSON.stringify(data)], {type: 'application/json'}), 'routine-data-' + todayISO() + '.json');
}
async function applyImport(d) {
  if (!d || d.app !== 'routine' || !d.days) throw new Error('not a routine data file');
  for (const s of ['days', 'pantry', 'mealLog', 'shopping']) await dbClear(s);
  for (const [k, v] of Object.entries(d.days)) await dbPut('days', k, v);
  for (const [k, v] of Object.entries(d.pantry || {})) await dbPut('pantry', k, v);
  for (const [k, v] of Object.entries(d.shop || {})) await dbPut('shopping', k, v);
  for (const e of (d.log || [])) { const { key, ...rest } = e; await dbPut('mealLog', key, rest); }
  await dbPut('kv', 'settings', d.settings || {plan: {}, basics: {}});
  await dbPut('kv', 'scans', d.scans || []);
  await loadAll();
}
function importJSON() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const d = JSON.parse(await inp.files[0].text());
      if (!d || d.app !== 'routine' || !d.days) throw new Error('not a routine data file');
      if (!confirm('Replace the current meals, pantry, shopping and routine data with this file? Photos are not affected.')) return;
      await applyImport(d); toast('Restored'); render();
    } catch (e) { toast('That file could not be read: ' + e.message, true); }
  };
  inp.click();
}

// ====================== events ======================
const H = {
  async tick(d) {
    const k = d.k, date = todayISO();
    if (k.startsWith('basic:')) { const id = k.slice(6); S.set.basics[id] = !S.set.basics[id]; await saveSet(); return render(); }
    await saveDay(date, {[k]: !(S.days[date] || {})[k]}); render();
  },
  async walk(d) { const date = todayISO(), x = S.days[date] || {}; await saveDay(date, {walks: Math.max(0, (x.walks || 0) + Number(d.d))}); render(); },
  go(d) { show(d.v); },
  gomeal(d) { ui.mealsDate = todayISO(); ui.open[todayISO() + '|' + d.slot] = true; show('meals'); setTimeout(() => { const el = $('#slot-' + d.slot); if (el) el.scrollIntoView({block: 'start'}); }, 30); },
  mdate(d) { const cur = ui.mealsDate || todayISO(); const n = addDays(cur, Number(d.d)); if (n < START || n > END) return; ui.mealsDate = n; render(); },
  mopen(d) { ui.open[d.key] = !ui.open[d.key]; render(); },
  change(d) { openChange(d.date, d.slot); },
  async pick(d) { S.set.plan[d.date] = Object.assign({}, S.set.plan[d.date], {[d.slot]: d.rid}); await saveSet(); closeSheet(); ui.open[d.date + '|' + d.slot] = true; render(); },
  need(d) { openNeed(d.rid, d.date); },
  addneed(d) { return addNeed(d.rid, d.date); },
  cook(d) { openCook(d.rid, d.slot, d.date); },
  cookgo(d) { return doCook(d.rid, d.slot, d.date); },
  undo(d) { return undoLog(d.key); },
  extra(d) { openExtra(d.date); },
  extrago(d) { return doExtra(d.date); },
  padd() { openPantryAdd(); },
  pago() { return doPantryAdd(); },
  pset(d) { openPantrySet(d.id); },
  async psgo(d) { const g = parseFloat($('#psg').value); await setPantry(d.id, {g: isNaN(g) ? 0 : g}); closeSheet(); render(); },
  week() { return weekFill(); },
  bought(d) { openBought(d.id); },
  async boughtgo(d) {
    const g = parseFloat($('#bg').value); if (!(g > 0)) return toast('Enter the grams', true);
    await setPantry(d.id, {g: have(d.id) + g}); delete S.shop[d.id]; await saveShop(d.id); closeSheet(); toast('Added to your pantry'); render();
  },
  async shopdel(d) { delete S.shop[d.id]; await saveShop(d.id); render(); },
  pt(d) { ui.pt = d.id; render(); },
  tls(d) { ui.tlSlot = d.id; render(); },
  cms(d) { ui.cmpSlot = d.id; render(); },
  play() { playAll(); },
  cap(d) { capture(SLOT_PHOTOS.find(s => s.id === d.id)); },
  pview(d) {
    const [date, slot] = d.key.split('|'), p = S.photos.find(x => x.date === date && x.slot === slot), v = $('#viewer');
    v.classList.remove('hide'); v.innerHTML = '<img src="' + purl(p) + '"><div class="note" style="color:#ddd">' + p.date + '</div><div class="row"><button class="sec" data-act="vclose">Close</button><button class="bad" data-act="vdel" data-key="' + d.key + '">Delete</button></div>';
  },
  vclose() { $('#viewer').classList.add('hide'); },
  async vdel(d) { if (!confirm('Delete this photo?')) return; const [date, slot] = d.key.split('|'); await dbDel('photos', d.key); urls.delete(d.key); await reloadPhotos(); $('#viewer').classList.add('hide'); render(); },
  zip() { return makeZip(); },
  jsonout() { exportJSON(); },
  jsonin() { importJSON(); },
  closesheet() { closeSheet(); },
  howopen(d) { ui.open['h:' + d.id] = !ui.open['h:' + d.id]; render(); },
  ownpic(d) {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'environment');
    f.onchange = async () => {
      const file = f.files[0]; if (!file) return;
      const img = await createImageBitmap(file), k = Math.min(1, 900 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.86));
      await dbPut('kv', 'prod:' + d.id, blob); S.prod[d.id] = blob; prodUrls.delete(d.id); toast('Your photo is saved on this phone'); render();
    };
    f.click();
  },
  async ownpicdel(d) { await dbDel('kv', 'prod:' + d.id); delete S.prod[d.id]; prodUrls.delete(d.id); render(); },
  async copypic(d) { const ok = await copyText(promptByKey(d.key)); toast(ok ? 'Prompt ' + d.key + ' copied' : 'Could not copy. Press and hold the text to copy it.', !ok); },
  async picdone(d) { S.set.picsDone = Object.assign({}, S.set.picsDone, {[d.key]: !(S.set.picsDone || {})[d.key]}); await saveSet(); render(); },
  scanadd() { openScan(); },
  scango() { return saveScan(); },
  async scandel(d) { if (!confirm('Delete this scan?')) return; S.scans = S.scans.filter(x => x.date !== d.date); await saveScans(); render(); },
  snap() { openSnapshot(); },
  async copysnap() { const ok = await copyText(snapshot()); toast(ok ? 'Copied. Paste it into the chat.' : 'Could not copy. Press and hold the text to copy it.', !ok); },
  fsub(d) { ui.food = d.id; render(); },
  psub(d) { ui.prog = d.id; render(); },
  asub(d) { ui.areas = d.id; render(); },
  goareas() { ui.areas = 'products'; show('areas'); },
  prodopen(d) { ui.open['p:' + d.id] = !ui.open['p:' + d.id]; render(); },
  areaopen(d) { ui.open['a:' + d.id] = !ui.open['a:' + d.id]; render(); },
  gotoprod(d) { ui.areas = 'products'; ui.open['p:' + d.id] = true; show('areas'); },
  async copyprompt(d) { const ok = await copyText(promptOf(PRODUCTS[d.id])); toast(ok ? 'Prompt copied' : 'Could not copy. Press and hold the text to copy it.', !ok); },
  sheetbg(d, el, ev) { if (ev.target === el) closeSheet(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = H[el.dataset.act]; if (fn) fn(el.dataset, el, e);
});
document.addEventListener('change', async e => {
  const k = e.target.dataset && e.target.dataset.chg; if (!k) return;
  const date = todayISO(), v = e.target.value === '' ? null : parseFloat(e.target.value);
  await saveDay(date, {[k]: v}); toast('Saved');
});
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => { ui.mealsDate = null; show(b.dataset.v); });

// ====================== start ======================
(async () => {
  db = await openDB(); await loadAll();
  try { if (navigator.storage) { if (navigator.storage.persist) await navigator.storage.persist(); ui.persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false; if (navigator.storage.estimate) { const e = await navigator.storage.estimate(); ui.est = (e.usage / 1048576).toFixed(1); } } } catch (e) {}
  window.__app = {S, ui, promptByKey, prodUrls, promptMan, promptProd, PRODUCTS, AREAS, SUPPS, promptOf, sched, applyImport, exportData: () => ({app: 'routine', version: 2, exported: todayISO(), days: S.days, pantry: S.pantry, shop: S.shop, log: S.log, settings: S.set, scans: S.scans}),
    snapshot, targetLine, openScan, saveScan, show, render, loadAll, RECIPES, FOODS, todayISO, plannedId, missingOf, macros, have, H, get db() { return db; }, dbPut, reloadPhotos, setPantry};
  show('today');
  if ('serviceWorker' in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => {});
    if (had) navigator.serviceWorker.addEventListener('controllerchange', () => { if ($('#cam').classList.contains('hide')) location.reload(); });
  }
})();
})();
