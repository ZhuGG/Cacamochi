const CREATURES = [
  { level: 1, name: "Bouseau Rookie", img: "img_bouseau.png", title: "Rookie des égouts" },
  { level: 4, name: "Skatour Volt", img: "img_skatour.png", title: "Sprinteur puant" },
  { level: 7, name: "Cacabra Nova", img: "img_cacabra.png", title: "Chevalier des canalisations" },
  { level: 10, name: "Skalibur Prime", img: "img_skalibur.png", title: "Champion légendaire" }
];

const ACTIONS = [
  { id: "feed", name: "Nourrir", desc: "+faim +énergie", icon: "🍜", effects: { hunger: 16, energy: 6, hygiene: -6, xp: 8 } },
  { id: "play", name: "Jouer", desc: "+joie +xp", icon: "🎮", effects: { fun: 18, energy: -10, hunger: -8, xp: 14 } },
  { id: "wash", name: "Laver", desc: "+hygiène", icon: "🫧", effects: { hygiene: 24, energy: -4, xp: 6 } },
  { id: "nap", name: "Sieste", desc: "+énergie +humeur", icon: "😴", effects: { energy: 22, fun: 8, hunger: -9, xp: 8 } },
  { id: "train", name: "Entraîner", desc: "+discipline +xp", icon: "🥊", effects: { discipline: 14, energy: -14, fun: -6, xp: 18 } },
  { id: "cuddle", name: "Câlin", desc: "+affection +joie", icon: "🤗", effects: { affection: 18, fun: 10, xp: 9 } }
];

const SHOPS = [
  { id: "booster", name: "Snack Épique", price: 70, desc: "+30 faim, +12 joie", apply: s => { s.hunger += 30; s.fun += 12; } },
  { id: "soap", name: "Savon Arc-en-ciel", price: 55, desc: "+34 hygiène, +8 affection", apply: s => { s.hygiene += 34; s.affection += 8; } },
  { id: "battery", name: "Batterie Fun", price: 85, desc: "+35 énergie", apply: s => { s.energy += 35; } },
  { id: "badge", name: "Badge Mentor", price: 110, desc: "+18 discipline, +40 XP", apply: s => { s.discipline += 18; s.xp += 40; } }
];

const MINI_GAMES = [
  {
    id: "flies",
    name: "Chasse-Mouches",
    desc: "Tape les mouches pour gagner des pièces",
    emoji: "🪰",
    reward: score => ({ coins: score * 5, xp: score * 6, fun: score * 2 })
  },
  {
    id: "spark",
    name: "Course aux étoiles",
    desc: "Clique les étoiles avant la fin",
    emoji: "⭐",
    reward: score => ({ stars: score, xp: score * 5, affection: score * 2 })
  }
];

const MISSIONS = [
  { text: "Remonte l'hygiène au-dessus de 70", check: s => s.hygiene >= 70, gain: { coins: 65, xp: 35 } },
  { text: "Atteins 75 en joie", check: s => s.fun >= 75, gain: { coins: 55, xp: 30 } },
  { text: "Passe sous 20 de fatigue (énergie 80+)", check: s => s.energy >= 80, gain: { coins: 70, xp: 34, stars: 1 } },
  { text: "Gagne 2 niveaux", check: s => s.level >= s.startLevel + 2, gain: { coins: 110, xp: 45, stars: 2 } }
];

const state = {
  day: 1,
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
  log: [],
  missions: [],
  missionBaseLevel: 1,
  activeGame: null,
  gameTimer: null,
  gameTimeLeft: 0
};

const statOrder = ["hunger", "fun", "hygiene", "energy", "affection", "discipline"];
const statLabels = {
  hunger: "Faim",
  fun: "Joie",
  hygiene: "Hygiène",
  energy: "Énergie",
  affection: "Affection",
  discipline: "Discipline"
};

const statsGrid = document.querySelector("#statsGrid");
const actionsWrap = document.querySelector("#actions");
const minigamesWrap = document.querySelector("#minigames");
const shopWrap = document.querySelector("#shop");
const missionList = document.querySelector("#missionList");
const logList = document.querySelector("#log");
const petMood = document.querySelector("#petMood");
const petImage = document.querySelector("#petImage");
const petName = document.querySelector("#petName");
const petRank = document.querySelector("#petRank");
const xpBar = document.querySelector("#xpBar");
const xpText = document.querySelector("#xpText");
const fxLayer = document.querySelector("#fxLayer");

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function addLog(msg) {
  state.log.unshift(`[Jour ${state.day}] ${msg}`);
  state.log = state.log.slice(0, 8);
}

function spawnFx(char) {
  const fx = document.createElement("span");
  fx.className = "pop";
  fx.textContent = char;
  fx.style.left = `${8 + Math.random() * 84}%`;
  fx.style.top = `${20 + Math.random() * 60}%`;
  fxLayer.appendChild(fx);
  setTimeout(() => fx.remove(), 900);
}

function getCreature() {
  return [...CREATURES].reverse().find(c => state.level >= c.level) || CREATURES[0];
}

function xpNeeded() {
  return 80 + state.level * 25;
}

function addXp(amount) {
  state.xp += amount;
  while (state.xp >= xpNeeded()) {
    state.xp -= xpNeeded();
    state.level += 1;
    state.stars += 1;
    addLog(`Niveau ${state.level} atteint ! +1 étoile.`);
    spawnFx("🌟");
  }
}

function applyDecay() {
  state.hunger -= 3;
  state.fun -= 2;
  state.hygiene -= 3;
  state.energy -= 2;
  state.affection -= 1;
  state.discipline -= 1;
  statOrder.forEach(key => {
    state[key] = clamp(state[key]);
  });
  if (state.hunger < 25 || state.hygiene < 25 || state.energy < 18) {
    petMood.textContent = "Attention, ton compagnon fatigue !";
  }
  if (state.hunger <= 0 || state.energy <= 0) {
    emergencyRecovery();
  }
}

function emergencyRecovery() {
  const fine = Math.min(40, state.coins);
  state.coins -= fine;
  state.hunger = 45;
  state.energy = 45;
  state.hygiene = clamp(state.hygiene + 12);
  addLog(`Urgence vétérinaire: -${fine} pièces.`);
  spawnFx("🚑");
}

function performAction(action) {
  for (const [key, value] of Object.entries(action.effects)) {
    if (key === "xp") {
      addXp(value);
      continue;
    }
    state[key] = clamp((state[key] || 0) + value);
  }
  state.day += 1;
  addLog(`${action.icon} ${action.name} effectué.`);
  spawnFx(action.icon);
  evaluateMissions();
  render();
}

function renderStats() {
  statsGrid.innerHTML = "";
  statOrder.forEach(key => {
    const value = Math.round(state[key]);
    const color = value > 66 ? "var(--good)" : value > 33 ? "var(--warn)" : "var(--bad)";
    const card = document.createElement("div");
    card.className = "stat";
    card.innerHTML = `
      <div class="stat-top"><strong>${statLabels[key]}</strong><span>${value}</span></div>
      <div class="meter"><i style="width:${value}%;background:${color}"></i></div>
    `;
    statsGrid.appendChild(card);
  });
}

function renderActions() {
  actionsWrap.innerHTML = "";
  ACTIONS.forEach(action => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.type = "button";
    btn.innerHTML = `<strong>${action.icon} ${action.name}</strong><span>${action.desc}</span>`;
    btn.addEventListener("click", () => performAction(action));
    actionsWrap.appendChild(btn);
  });
}

function gainRewards(gains) {
  if (gains.coins) state.coins += gains.coins;
  if (gains.stars) state.stars += gains.stars;
  if (gains.xp) addXp(gains.xp);
  for (const key of ["fun", "hunger", "hygiene", "energy", "affection", "discipline"]) {
    if (gains[key]) {
      state[key] = clamp(state[key] + gains[key]);
    }
  }
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
      addLog(`Mission accomplie: ${m.text}`);
      spawnFx("✅");
    }
  });
}

function renderMissions() {
  missionList.innerHTML = "";
  state.missions.forEach(m => {
    const li = document.createElement("li");
    li.className = `mission ${m.done ? "done" : ""}`;
    li.textContent = `${m.done ? "✅" : "🎯"} ${m.text}`;
    missionList.appendChild(li);
  });
}

function renderMinigames() {
  minigamesWrap.innerHTML = "";
  MINI_GAMES.forEach(game => {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.type = "button";
    btn.innerHTML = `<strong>${game.emoji} ${game.name}</strong><span>${game.desc}</span>`;
    btn.addEventListener("click", () => startGame(game));
    minigamesWrap.appendChild(btn);
  });
}

function renderShop() {
  shopWrap.innerHTML = "";
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
      statOrder.forEach(k => { state[k] = clamp(state[k]); });
      addLog(`Achat: ${item.name}`);
      spawnFx("🛍️");
      render();
    });
    shopWrap.appendChild(btn);
  });
}

function renderLog() {
  logList.innerHTML = "";
  state.log.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    logList.appendChild(li);
  });
}

function renderHeader() {
  document.querySelector("#coins").textContent = state.coins;
  document.querySelector("#stars").textContent = state.stars;
  document.querySelector("#day").textContent = state.day;
  const creature = getCreature();
  petImage.src = creature.img;
  petName.textContent = creature.name;
  petRank.textContent = `Rang: ${creature.title} • Niveau ${state.level}`;

  const need = xpNeeded();
  const pct = Math.floor((state.xp / need) * 100);
  xpBar.style.width = `${pct}%`;
  xpText.textContent = `${state.xp} / ${need} XP`;
}

function render() {
  renderHeader();
  renderStats();
  renderMissions();
  renderMinigames();
  renderShop();
  renderLog();
}

function startGame(game) {
  const arena = document.querySelector("#arena");
  const arenaPlay = document.querySelector("#arenaPlay");
  const arenaGoal = document.querySelector("#arenaGoal");
  const timerEl = document.querySelector("#arenaTimer");
  document.querySelector("#arenaTitle").textContent = `${game.emoji} ${game.name}`;
  arenaGoal.textContent = game.desc;
  arena.classList.remove("hidden");
  arenaPlay.innerHTML = "";

  state.activeGame = { ...game, score: 0 };
  state.gameTimeLeft = 20;

  const spawnTarget = () => {
    if (!state.activeGame) return;
    const btn = document.createElement("button");
    btn.className = "target";
    btn.type = "button";
    btn.textContent = game.id === "flies" ? "🪰" : "✨";
    btn.style.left = `${Math.random() * 80}%`;
    btn.style.top = `${Math.random() * 70}%`;
    btn.addEventListener("click", () => {
      state.activeGame.score += 1;
      spawnFx(game.id === "flies" ? "🪰" : "⭐");
      btn.remove();
    });
    arenaPlay.appendChild(btn);
    setTimeout(() => btn.remove(), 1200);
  };

  const spawner = setInterval(spawnTarget, 420);
  state.gameTimer = setInterval(() => {
    state.gameTimeLeft -= 1;
    timerEl.textContent = `${state.gameTimeLeft}s • Score ${state.activeGame?.score || 0}`;
    if (state.gameTimeLeft <= 0) {
      clearInterval(spawner);
      endGame();
    }
  }, 1000);

  document.querySelector("#quitArena").onclick = () => {
    clearInterval(spawner);
    endGame(true);
  };
}

function endGame(early = false) {
  clearInterval(state.gameTimer);
  const arena = document.querySelector("#arena");
  const active = state.activeGame;
  if (!active) return;

  if (!early) {
    const gains = active.reward(active.score);
    gainRewards(gains);
    addLog(`${active.name}: score ${active.score} (récompenses obtenues)`);
    petMood.textContent = `Session ${active.name} réussie !`;
  } else {
    addLog(`${active.name} interrompu.`);
  }

  state.activeGame = null;
  arena.classList.add("hidden");
  evaluateMissions();
  render();
}

document.querySelector("#rerollMission").addEventListener("click", () => {
  if (state.stars < 1) {
    petMood.textContent = "Il faut 1 étoile pour relancer les missions.";
    return;
  }
  state.stars -= 1;
  generateMissions();
  addLog("Missions du jour renouvelées.");
  render();
});

setInterval(() => {
  applyDecay();
  evaluateMissions();
  render();
}, 11000);

renderActions();
generateMissions();
addLog("Bienvenue dans la nursery. Fais évoluer ton Cacamochi !");
render();
