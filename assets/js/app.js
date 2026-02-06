const STORAGE_KEY = "cacamochi.v3.save";
const SAVE_VERSION = 3;
const TICK_MS = 1000;
const DAY_TICKS = 24;
const OFFLINE_TICK_CAP = 360;

const CREATURES = [
  { level: 1, name: "Bouseau Initié", img: "img_bouseau.png", title: "Apprenti de la cuvette" },
  { level: 4, name: "Skatour Volt", img: "img_skatour.png", title: "Éclaireur des urinoirs" },
  { level: 7, name: "Cacabra Nova", img: "img_cacabra.png", title: "Chevalier du siphon" },
  { level: 10, name: "Skalibur Prime", img: "img_skalibur.png", title: "Seigneur des fosses" },
  { level: 14, name: "Thanabouse Ultime", img: "img_thanabouse.png", title: "Oracle des latrines" },
  { level: 18, name: "Seigneur Crottal", img: "img_seigneur.png", title: "Empereur des égouts" }
];

const ACTIONS = [
  { id: "feed", name: "Nourrir", desc: "+appétit +énergie", icon: "🍜", effects: { hunger: 16, energy: 6, hygiene: -6, xp: 8 } },
  { id: "play", name: "Divertir", desc: "+humeur +xp", icon: "🎮", effects: { fun: 18, energy: -10, hunger: -8, xp: 14 } },
  { id: "wash", name: "Toiletter", desc: "+propreté", icon: "🫧", effects: { hygiene: 24, energy: -4, xp: 6 } },
  { id: "nap", name: "Repos", desc: "+énergie +humeur", icon: "😴", effects: { energy: 22, fun: 8, hunger: -9, xp: 8 } },
  { id: "train", name: "Entraîner", desc: "+rigueur +xp", icon: "🥊", effects: { discipline: 14, energy: -14, fun: -6, xp: 18 } },
  { id: "cuddle", name: "Apaiser", desc: "+affection +humeur", icon: "🤗", effects: { affection: 18, fun: 10, xp: 9 } }
];

const SHOPS = [
  { id: "booster", name: "Ration fumée", price: 70, desc: "+30 appétit, +12 humeur", apply: s => { s.hunger += 30; s.fun += 12; } },
  { id: "soap", name: "Gel douche des marécages", price: 55, desc: "+34 propreté, +8 affection", apply: s => { s.hygiene += 34; s.affection += 8; } },
  { id: "battery", name: "Élixir tonique", price: 85, desc: "+35 énergie", apply: s => { s.energy += 35; } },
  { id: "badge", name: "Sceau royal", price: 110, desc: "+18 rigueur, +40 XP", apply: s => { s.discipline += 18; s.xp += 40; } }
];

const MINI_GAMES = [
  {
    id: "swarm",
    name: "Fly Smash Turbo",
    desc: "Intercepte les mouches (petites, grandes, dorées) pour faire grimper le jackpot.",
    emoji: "🪰",
    image: "img/flies/fly_small.png",
    duration: 20,
    reward: score => ({ coins: score * 6, xp: score * 5, fun: score * 2 })
  },
  {
    id: "memory",
    name: "Danse des icônes",
    desc: "Mémorise la séquence d'icônes et rejoue-la sans faute.",
    emoji: "🎛️",
    image: "img/icons/danser.png",
    duration: 25,
    reward: score => ({ stars: Math.floor(score / 2), xp: score * 7, affection: score * 4, discipline: score * 2 })
  }
];

const MEMORY_PADS = [
  { id: "laver", label: "Toiletter", img: "img/icons/laver.png" },
  { id: "danser", label: "Rythmer", img: "img/icons/danser.png" },
  { id: "jouer", label: "Divertir", img: "img/icons/jouer.png" },
  { id: "bisou", label: "Apaiser", img: "img/icons/bisou.png" }
];

const TRAITS = [
  {
    id: "gourmand",
    name: "Gourmand des égouts",
    hint: "Les repas donnent +25% d'appétit, mais la faim descend plus vite.",
    unlock: s => s.hunger >= 85 && s.discipline < 45,
    mods: { feedBonus: 1.25, hungerDecay: 1.2 }
  },
  {
    id: "showman",
    name: "Maître de la chasse d'eau",
    hint: "Les actions d'humeur donnent +20% XP et plus de pièces en mini-jeu.",
    unlock: s => s.fun >= 80 && s.affection >= 65,
    mods: { funXpBoost: 1.2, minigameCoins: 1.2 }
  },
  {
    id: "stoic",
    name: "Sage du siphon",
    hint: "Décroissance d'énergie réduite, mais moins de gain d'humeur.",
    unlock: s => s.discipline >= 80,
    mods: { energyDecay: 0.7, funGain: 0.85 }
  }
];

const EVENTS = [
  {
    id: "toxic_fog",
    text: "Nuage toxique des égouts : la propreté chute.",
    weight: 1,
    apply: s => { s.hygiene -= 16; s.energy -= 8; }
  },
  {
    id: "royal_flush",
    text: "Chasse royale ! Les coffres débordent.",
    weight: 1,
    apply: s => { s.coins += 80; s.stars += 1; }
  },
  {
    id: "fan_club",
    text: "Fan-club fidèle : +affection, +humeur.",
    weight: 1,
    apply: s => { s.affection += 14; s.fun += 16; }
  }
];

const MISSIONS = [
  { id: "hygiene", text: "Remonte la propreté au-dessus de 70", check: s => s.hygiene >= 70, gain: { coins: 65, xp: 35 } },
  { id: "fun", text: "Atteins 75 d'humeur", check: s => s.fun >= 75, gain: { coins: 55, xp: 30 } },
  { id: "energy", text: "Monte l'énergie à 80+ pour éviter la panne", check: s => s.energy >= 80, gain: { coins: 70, xp: 34, stars: 1 } },
  { id: "level", text: "Gagne 2 niveaux", check: s => s.level >= s.startLevel + 2, gain: { coins: 110, xp: 45, stars: 2 } }
];

const statOrder = ["hunger", "fun", "hygiene", "energy", "affection", "discipline"];
const statLabels = {
  hunger: "Appétit",
  fun: "Humeur",
  hygiene: "Propreté",
  energy: "Énergie",
  affection: "Affection",
  discipline: "Rigueur"
};

const evolutionPaths = [
  {
    id: "chaos",
    name: "Voie Chaos",
    desc: "Tout pour l'humeur, rien pour l'ordre.",
    check: s => s.fun + s.hunger > s.discipline + s.hygiene + 35
  },
  {
    id: "saint",
    name: "Voie Saint-Siphon",
    desc: "Propre, discipliné, presque respectable.",
    check: s => s.hygiene + s.discipline > s.fun + s.hunger + 35
  },
  {
    id: "balanced",
    name: "Voie Équilibrée",
    desc: "Maître du juste équilibre.",
    check: () => true
  }
];

const ui = {
  statsGrid: document.querySelector("#statsGrid"),
  actionsWrap: document.querySelector("#actions"),
  minigamesWrap: document.querySelector("#minigames"),
  shopWrap: document.querySelector("#shop"),
  missionList: document.querySelector("#missionList"),
  logList: document.querySelector("#log"),
  petMood: document.querySelector("#petMood"),
  petScene: document.querySelector("#petScene"),
  petImage: document.querySelector("#petImage"),
  petName: document.querySelector("#petName"),
  petRank: document.querySelector("#petRank"),
  xpBar: document.querySelector("#xpBar"),
  xpText: document.querySelector("#xpText"),
  fxLayer: document.querySelector("#fxLayer"),
  coins: document.querySelector("#coins"),
  stars: document.querySelector("#stars"),
  day: document.querySelector("#day"),
  arena: document.querySelector("#arena"),
  arenaPlay: document.querySelector("#arenaPlay"),
  arenaGoal: document.querySelector("#arenaGoal"),
  arenaTitle: document.querySelector("#arenaTitle"),
  arenaTimer: document.querySelector("#arenaTimer"),
  rerollMission: document.querySelector("#rerollMission"),
  quitArena: document.querySelector("#quitArena"),
  petScene: document.querySelector("#petScene")
};

let petTapTimeout = null;
const statCards = new Map();
const lastStatValues = {};

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function normalizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeStateNumbers() {
  state.level = normalizeNumber(state.level, 1);
  state.xp = normalizeNumber(state.xp);
  state.coins = normalizeNumber(state.coins);
  state.stars = normalizeNumber(state.stars);
  state.tick = normalizeNumber(state.tick);
  state.day = normalizeNumber(state.day, 1);
  state.missionBaseLevel = normalizeNumber(state.missionBaseLevel, state.level);
  statOrder.forEach(key => {
    state[key] = normalizeNumber(state[key]);
  });
}

function createInitialState() {
  return {
    version: SAVE_VERSION,
    level: 1,
    xp: 0,
    coins: 80,
    stars: 0,
    hunger: 68,
    fun: 60,
    hygiene: 64,
    energy: 70,
    affection: 40,
    discipline: 25,
    tick: 0,
    day: 1,
    moodText: "En pleine forme et prêt à explorer le royaume.",
    tempMoodText: null,
    tempMoodTimeout: null,
    log: [],
    missions: [],
    missionBaseLevel: 1,
    traits: [],
    evolutionPath: null,
    activeGame: null,
    gameTimer: null,
    gameSpawnTimer: null,
    gameRoundTimer: null,
    gameTimeLeft: 0,
    lastEventTick: 0,
    lastSavedAt: Date.now(),
    offlineReport: null,
    lastUpdate: null
  };
}

const state = createInitialState();

function getCreature() {
  return [...CREATURES].reverse().find(c => state.level >= c.level) || CREATURES[0];
}

function xpNeeded(level = state.level) {
  return 85 + level * 28;
}

function spawnFx(char) {
  const fx = document.createElement("span");
  fx.className = "pop";
  fx.textContent = char;
  fx.style.left = `${8 + Math.random() * 84}%`;
  fx.style.top = `${20 + Math.random() * 60}%`;
  ui.fxLayer.appendChild(fx);
  setTimeout(() => fx.remove(), 900);
}

function clearTempMood() {
  if (state.tempMoodTimeout) {
    clearTimeout(state.tempMoodTimeout);
    state.tempMoodTimeout = null;
  }
  state.tempMoodText = null;
}

function setTempMood(text, durationMs = 0) {
  if (state.tempMoodTimeout) clearTimeout(state.tempMoodTimeout);
  state.tempMoodText = text;
  state.tempMoodTimeout = null;
  if (durationMs > 0) {
    state.tempMoodTimeout = setTimeout(() => {
      clearTempMood();
      render();
    }, durationMs);
  }
}

function petInteract(type) {
  const interactions = {
    click: {
      mood: "Il apprécie les attentions.",
      emoji: "💖",
      log: "Attention douce à la mascotte."
    }
  };
  const selection = interactions[type] || {
    mood: "Ça lui fait plaisir.",
    emoji: "✨",
    log: "Interaction avec la mascotte."
  };

  state.moodText = selection.mood;
  spawnFx(selection.emoji);
  addLog(selection.log);
  saveState();
  render();
}

function addLog(msg) {
  state.log.unshift(`[Jour ${state.day}] ${msg}`);
  state.log = state.log.slice(0, 12);
}

function applyBoundaries() {
  statOrder.forEach(key => {
    state[key] = clamp(normalizeNumber(state[key]));
  });
}

function addXp(amount) {
  state.xp = normalizeNumber(state.xp);
  state.xp += amount;
  while (state.xp >= xpNeeded()) {
    state.xp -= xpNeeded();
    state.level += 1;
    state.stars += 1;
    addLog(`Niveau ${state.level} atteint ! Le royaume applaudit.`);
    spawnFx("🌟");
    if (!state.evolutionPath && state.level >= 6) {
      state.evolutionPath = evolutionPaths.find(path => path.check(state)).id;
      const chosen = evolutionPaths.find(path => path.id === state.evolutionPath);
      addLog(`Évolution non linéaire débloquée : ${chosen.name}.`);
    }
  }
}

function getTraitMods() {
  return state.traits.reduce((mods, traitId) => {
    const trait = TRAITS.find(t => t.id === traitId);
    if (!trait) return mods;
    Object.entries(trait.mods).forEach(([key, value]) => {
      mods[key] = (mods[key] ?? 1) * value;
    });
    return mods;
  }, {});
}

function unlockTraitsIfNeeded() {
  TRAITS.forEach(trait => {
    if (!state.traits.includes(trait.id) && trait.unlock(state)) {
      state.traits.push(trait.id);
      addLog(`Trait débloqué : ${trait.name}. ${trait.hint}`);
      spawnFx("🧬");
    }
  });
}

function applyDecay(ticks = 1) {
  const mods = getTraitMods();
  state.hunger -= 0.58 * (mods.hungerDecay || 1) * ticks;
  state.fun -= 0.43 * ticks;
  state.hygiene -= 0.52 * ticks;
  state.energy -= 0.48 * (mods.energyDecay || 1) * ticks;
  state.affection -= 0.28 * ticks;
  state.discipline -= 0.16 * ticks;
  applyBoundaries();

  if (state.hunger < 25 || state.hygiene < 25 || state.energy < 18) {
    state.moodText = "Alerte : la mascotte manque d'énergie.";
  }
  if (state.hunger <= 0 || state.energy <= 0) {
    emergencyRecovery();
  }
}

function emergencyRecovery() {
  const fine = Math.min(50, state.coins);
  state.coins -= fine;
  state.hunger = 45;
  state.energy = 45;
  state.hygiene = clamp(state.hygiene + 14);
  addLog(`Urgence plomberie : -${fine} pièces.`);
  spawnFx("🚑");
}

function maybeTriggerEvent() {
  if (state.tick - state.lastEventTick < 30) return;
  if (Math.random() > 0.1) return;
  state.lastEventTick = state.tick;
  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  event.apply(state);
  applyBoundaries();
  addLog(`Événement : ${event.text}`);
  spawnFx("🎲");
}

function gainRewards(gains) {
  if (gains.coins) state.coins += Math.round(gains.coins * (getTraitMods().minigameCoins || 1));
  if (gains.stars) state.stars += gains.stars;
  if (gains.xp) addXp(gains.xp);
  statOrder.forEach(key => {
    if (gains[key]) {
      const current = normalizeNumber(state[key]);
      state[key] = clamp(current + gains[key]);
    }
  });
}

function applyAction(action) {
  const mods = getTraitMods();
  for (const [key, value] of Object.entries(action.effects)) {
    if (key === "xp") {
      const xpBoost = action.id === "play" ? (mods.funXpBoost || 1) : 1;
      addXp(Math.round(value * xpBoost));
      continue;
    }

    let adjusted = value;
    if (action.id === "feed" && key === "hunger") adjusted *= (mods.feedBonus || 1);
    if (key === "fun" && adjusted > 0) adjusted *= (mods.funGain || 1);
    const current = normalizeNumber(state[key]);
    state[key] = clamp(current + adjusted);
  }

  state.tick += 1;
  state.day = 1 + Math.floor(state.tick / DAY_TICKS);
  state.lastUpdate = "action";
  state.moodText = `${action.icon} ${action.name} validé. Mission accomplie.`;
  addLog(`${action.icon} ${action.name} effectué.`);
  spawnFx(action.icon);
  unlockTraitsIfNeeded();
  evaluateMissions();
  saveState();
  render();
}

function generateMissions() {
  state.missionBaseLevel = state.level;
  state.missions = [...MISSIONS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(m => ({ ...m, done: false }));
}

function evaluateMissions() {
  state.missions.forEach(m => {
    const pseudoState = { ...state, startLevel: state.missionBaseLevel };
    if (!m.done && m.check(pseudoState)) {
      m.done = true;
      gainRewards(m.gain);
      addLog(`Mission validée : ${m.text}`);
      spawnFx("✅");
    }
  });
}

function startGame(game) {
  if (state.activeGame) return;
  ui.arenaTitle.textContent = `${game.emoji} ${game.name}`;
  ui.arenaGoal.textContent = game.desc;
  ui.arena.classList.remove("hidden");
  ui.arenaPlay.innerHTML = "";

  state.activeGame = { ...game, score: 0, ...buildGameState(game) };
  state.gameTimeLeft = game.duration || 20;
  ui.arenaTimer.textContent = `${state.gameTimeLeft}s • Score 0`;

  if (game.id === "swarm") launchSwarmGame();
  if (game.id === "memory") launchMemoryGame();

  state.gameTimer = setInterval(() => {
    state.gameTimeLeft -= 1;
    ui.arenaTimer.textContent = `${state.gameTimeLeft}s • Score ${state.activeGame?.score || 0}`;
    if (state.gameTimeLeft <= 0) {
      clearGameIntervals();
      endGame();
    }
  }, 1000);
}

function buildGameState(game) {
  if (game.id === "swarm") return { fliesHit: 0, fliesMissed: 0 };
  if (game.id === "memory") return { sequence: [], playerStep: 0, locked: true, streak: 0 };
  return {};
}

function clearGameIntervals() {
  clearInterval(state.gameTimer);
  clearInterval(state.gameSpawnTimer);
  clearTimeout(state.gameRoundTimer);
}

function launchSwarmGame() {
  const spawnFly = () => {
    if (!state.activeGame || state.activeGame.id !== "swarm") return;

    const roll = Math.random();
    const flyType = roll > 0.9 ? "gold" : roll > 0.65 ? "big" : "small";
    const flyConfig = {
      small: { points: 1, img: "img/flies/fly_small.png", life: 1200 },
      big: { points: 2, img: "img/flies/fly_big.png", life: 1500 },
      gold: { points: 4, img: "img/flies/fly_gold.png", life: 1000 }
    }[flyType];

    const btn = document.createElement("button");
    btn.className = `target target-fly ${flyType}`;
    btn.type = "button";
    btn.style.left = `${Math.random() * 84}%`;
    btn.style.top = `${Math.random() * 72}%`;
    btn.innerHTML = `<img src="${flyConfig.img}" alt="mouche ${flyType}" />`;

    let alreadyHit = false;
    btn.addEventListener("click", () => {
      if (alreadyHit || !state.activeGame) return;
      alreadyHit = true;
      state.activeGame.score += flyConfig.points;
      state.activeGame.fliesHit += 1;
      btn.classList.add("splat");
      btn.innerHTML = '<img src="img/flies/splat.png" alt="splat" />';
      spawnFx(flyType === "gold" ? "💰" : "🪰");
      setTimeout(() => btn.remove(), 180);
    });

    ui.arenaPlay.appendChild(btn);

    setTimeout(() => {
      if (!alreadyHit && state.activeGame?.id === "swarm") {
        state.activeGame.fliesMissed += 1;
      }
      btn.remove();
    }, flyConfig.life);
  };

  state.gameSpawnTimer = setInterval(spawnFly, 380);
}

function launchMemoryGame() {
  ui.arenaPlay.innerHTML = '<div class="memory-grid" id="memoryGrid"></div>';
  const grid = ui.arenaPlay.querySelector("#memoryGrid");

  MEMORY_PADS.forEach((pad, index) => {
    const btn = document.createElement("button");
    btn.className = "memory-pad";
    btn.type = "button";
    btn.dataset.pad = String(index);
    btn.innerHTML = `<img src="${pad.img}" alt="${pad.label}" /><span>${pad.label}</span>`;
    btn.addEventListener("click", () => handleMemoryInput(index));
    grid.appendChild(btn);
  });

  runMemoryRound();
}

function runMemoryRound() {
  if (!state.activeGame || state.activeGame.id !== "memory") return;
  const active = state.activeGame;
  active.locked = true;
  active.playerStep = 0;
  active.sequence.push(Math.floor(Math.random() * MEMORY_PADS.length));
  ui.arenaGoal.textContent = `Round ${active.sequence.length} • Observe la séquence.`;

  const pads = [...ui.arenaPlay.querySelectorAll(".memory-pad")];
  active.sequence.forEach((padIndex, idx) => {
    setTimeout(() => {
      pads[padIndex]?.classList.add("flash");
      setTimeout(() => pads[padIndex]?.classList.remove("flash"), 280);
    }, 450 * (idx + 1));
  });

  const unlockDelay = 450 * (active.sequence.length + 1);
  state.gameRoundTimer = setTimeout(() => {
    if (!state.activeGame || state.activeGame.id !== "memory") return;
    active.locked = false;
    ui.arenaGoal.textContent = `À toi ! Rejoue ${active.sequence.length} icônes.`;
  }, unlockDelay);
}

function handleMemoryInput(index) {
  if (!state.activeGame || state.activeGame.id !== "memory") return;
  const active = state.activeGame;
  if (active.locked) return;

  const pads = [...ui.arenaPlay.querySelectorAll(".memory-pad")];
  pads[index]?.classList.add("flash");
  setTimeout(() => pads[index]?.classList.remove("flash"), 200);

  if (active.sequence[active.playerStep] !== index) {
    active.streak = 0;
    active.score = Math.max(0, active.score - 1);
    active.locked = true;
    ui.arenaGoal.textContent = "Raté. Respire... nouvelle séquence.";
    spawnFx("💥");
    state.gameRoundTimer = setTimeout(runMemoryRound, 650);
    return;
  }

  active.playerStep += 1;
  if (active.playerStep >= active.sequence.length) {
    active.score += active.sequence.length;
    active.streak += 1;
    active.locked = true;
    spawnFx("🎵");
    ui.arenaGoal.textContent = `Parfait ! Combo x${active.streak}.`;
    state.gameRoundTimer = setTimeout(runMemoryRound, 700);
  }
}

function endGame(early = false) {
  clearGameIntervals();
  const active = state.activeGame;
  if (!active) return;

  if (!early) {
    const gains = active.reward(active.score);
    gainRewards(gains);
    addLog(`${active.name}: score ${active.score} (récompenses obtenues)`);
    state.moodText = `Session ${active.name} réussie.`;
    state.lastUpdate = "game";
  } else {
    addLog(`${active.name} interrompu.`);
  }

  state.activeGame = null;
  ui.arena.classList.add("hidden");
  evaluateMissions();
  saveState();
  render();
}

function tick() {
  if (state.activeGame) return;
  state.tick += 1;
  state.day = 1 + Math.floor(state.tick / DAY_TICKS);
  applyDecay(1);
  maybeTriggerEvent();
  unlockTraitsIfNeeded();
  evaluateMissions();
  saveState(false);
  state.lastUpdate = "tick";
  render();
}

function computeOfflineProgress() {
  const elapsedMs = Date.now() - state.lastSavedAt;
  const offlineTicks = Math.min(Math.floor(elapsedMs / TICK_MS), OFFLINE_TICK_CAP);
  if (offlineTicks <= 0) return;

  applyDecay(offlineTicks);
  state.tick += offlineTicks;
  state.day = 1 + Math.floor(state.tick / DAY_TICKS);
  const passiveCoins = Math.floor(offlineTicks / 12);
  const passiveXp = Math.floor(offlineTicks / 10);
  state.coins += passiveCoins;
  addXp(passiveXp);
  state.offlineReport = { offlineTicks, passiveCoins, passiveXp };
  addLog(`Retour hors-ligne : +${passiveCoins} pièces, +${passiveXp} XP après ${offlineTicks}s.`);
}

function saveState(withTimestamp = true) {
  if (withTimestamp) state.lastSavedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) return;
    Object.assign(state, createInitialState(), parsed);
    normalizeStateNumbers();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getStatCard(key) {
  if (!ui.statsGrid) return null;
  if (statCards.has(key)) return statCards.get(key);
  const card = document.createElement("div");
  card.className = "stat";
  card.dataset.key = key;
  card.innerHTML = `
    <div class="stat-top">
      <strong>${statLabels[key]}</strong>
      <span class="stat-value">0</span>
    </div>
    <div class="meter"><i class="stat-meter"></i></div>
    <div class="stat-delta" aria-hidden="true"></div>
  `;
  ui.statsGrid.appendChild(card);
  statCards.set(key, card);
  return card;
}

function updateStatCard(card, key, value, showDelta) {
  const valueEl = card.querySelector(".stat-value");
  const meterEl = card.querySelector(".stat-meter");
  const deltaEl = card.querySelector(".stat-delta");
  const color = value > 66 ? "var(--good)" : value > 33 ? "var(--warn)" : "var(--bad)";
  if (valueEl) valueEl.textContent = value;
  if (meterEl) {
    meterEl.style.width = `${value}%`;
    meterEl.style.background = color;
  }

  if (showDelta) {
    const prevValue = lastStatValues[key] ?? value;
    const delta = value - prevValue;
    if (deltaEl && delta !== 0) {
      deltaEl.textContent = `${delta > 0 ? "+" : ""}${Math.round(delta)}`;
      deltaEl.classList.toggle("positive", delta > 0);
      deltaEl.classList.toggle("negative", delta < 0);
      deltaEl.classList.add("show");
      card.classList.add("flash");
      window.setTimeout(() => card.classList.remove("flash"), 380);
      window.setTimeout(() => deltaEl.classList.remove("show"), 1200);
    }
  }

  lastStatValues[key] = value;
}

function renderStats() {
  if (!ui.statsGrid) return;
  if (!ui.statsGrid.childElementCount) {
    statOrder.forEach(key => getStatCard(key));
  }

  const showDelta = ["action", "shop", "game"].includes(state.lastUpdate);
  statOrder.forEach(key => {
    const value = Math.round(state[key]);
    const card = getStatCard(key);
    if (!card) return;
    updateStatCard(card, key, value, showDelta);
  });
}

function renderActions() {
  ui.actionsWrap.innerHTML = "";
  ACTIONS.forEach(action => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.type = "button";
    btn.innerHTML = `<strong>${action.icon} ${action.name}</strong><span>${action.desc}</span>`;
    btn.addEventListener("click", () => {
      btn.classList.remove("action-burst");
      void btn.offsetWidth;
      btn.classList.add("action-burst");
      window.setTimeout(() => btn.classList.remove("action-burst"), 280);
      applyAction(action);
    });
    ui.actionsWrap.appendChild(btn);
  });
}

function renderMissions() {
  ui.missionList.innerHTML = "";
  state.missions.forEach(m => {
    const li = document.createElement("li");
    li.className = `mission ${m.done ? "done" : ""}`;
    li.textContent = `${m.done ? "✅" : "🎯"} ${m.text}`;
    ui.missionList.appendChild(li);
  });
}

function renderMinigames() {
  ui.minigamesWrap.innerHTML = "";
  MINI_GAMES.forEach(game => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.type = "button";
    btn.innerHTML = `
      <strong>${game.emoji} ${game.name}</strong>
      <span>${game.desc}</span>
      <img class="minigame-thumb" src="${game.image}" alt="${game.name}" />
    `;
    btn.addEventListener("click", () => startGame(game));
    ui.minigamesWrap.appendChild(btn);
  });
}

function renderShop() {
  ui.shopWrap.innerHTML = "";
  SHOPS.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "shop-item";
    btn.type = "button";
    btn.disabled = state.coins < item.price;
    btn.innerHTML = `<strong>${item.name}</strong><br><em>${item.price} pièces</em><br><span>${item.desc}</span>`;
    btn.addEventListener("click", () => {
      if (state.coins < item.price) return;
      state.coins -= item.price;
      item.apply(state);
      applyBoundaries();
      addLog(`Achat effectué : ${item.name}`);
      spawnFx("🛍️");
      state.lastUpdate = "shop";
      saveState();
      render();
    });
    ui.shopWrap.appendChild(btn);
  });
}

function renderHeader() {
  ui.coins.textContent = state.coins;
  ui.stars.textContent = state.stars;
  ui.day.textContent = state.day;

  const creature = getCreature();
  ui.petImage.src = creature.img;
  ui.petName.textContent = creature.name;

  const path = state.evolutionPath ? ` • ${evolutionPaths.find(p => p.id === state.evolutionPath)?.name}` : "";
  const traitLabel = state.traits.length ? ` • Traits : ${state.traits.map(id => TRAITS.find(t => t.id === id)?.name).filter(Boolean).join(", ")}` : "";
  ui.petRank.textContent = `Titre : ${creature.title} • Niveau ${state.level}${path}`;
  const moodText = state.tempMoodText || state.moodText;
  ui.petMood.textContent = `${moodText}${traitLabel ? ` | ${traitLabel}` : ""}`;

  const need = xpNeeded();
  const pct = Math.floor((state.xp / need) * 100);
  ui.xpBar.style.width = `${pct}%`;
  ui.xpText.textContent = `${state.xp} / ${need} XP`;
}

function renderLog() {
  ui.logList.innerHTML = "";
  state.log.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    ui.logList.appendChild(li);
  });
}

function renderOfflineReport() {
  if (!state.offlineReport) return;
  const { offlineTicks, passiveCoins, passiveXp } = state.offlineReport;
  state.moodText = `Retour hors-ligne : ${offlineTicks}s simulées, +${passiveCoins} pièces, +${passiveXp} XP.`;
  state.offlineReport = null;
}

function render() {
  renderOfflineReport();
  renderHeader();
  renderStats();
  renderMissions();
  renderMinigames();
  renderShop();
  renderLog();
  state.lastUpdate = null;
}

ui.rerollMission.addEventListener("click", () => {
  if (state.stars < 1) {
    state.moodText = "Il faut 1 étoile pour relancer les missions.";
    render();
    return;
  }
  state.stars -= 1;
  generateMissions();
  addLog("Missions des égouts renouvelées.");
  saveState();
  state.lastUpdate = "mission";
  render();
});

if (ui.petScene) {
  ui.petScene.addEventListener("click", () => {
    if (!ui.petImage) return;
    ui.petImage.classList.remove("pet-tap");
    void ui.petImage.offsetWidth;
    ui.petImage.classList.add("pet-tap");
    if (petTapTimeout) window.clearTimeout(petTapTimeout);
    petTapTimeout = window.setTimeout(() => {
      ui.petImage.classList.remove("pet-tap");
    }, 300);
  });
}

ui.quitArena.addEventListener("click", () => endGame(true));
ui.petScene.addEventListener("mouseenter", () => {
  setTempMood("Il se redresse dès que tu approches 🫶");
  render();
});
ui.petScene.addEventListener("mouseleave", () => {
  clearTempMood();
  render();
});
ui.petScene.addEventListener("click", () => petInteract("click"));
window.addEventListener("beforeunload", () => saveState());

loadState();
normalizeStateNumbers();
if (!state.missions.length) generateMissions();
computeOfflineProgress();
addLog("Bienvenue dans Cacamochi v3. Mini-jeux revisités, intensité maximale.");
renderActions();
render();
setInterval(tick, TICK_MS);
