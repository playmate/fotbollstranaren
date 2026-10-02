const APP_VERSION = "v1.6.30";

const DEFAULT_PLAYERS = ["Liam","Frans","Finn","Charles","Erik","Ian","Endrit","John"];
const MATCH_SETTINGS_KEY = "fotbollstranaren-match-settings";
const DEFAULT_MATCH_SETTINGS = { periodCount: 2, totalMinutes: 30, substitutionMinutes: 5 };
let matchSettings = { ...DEFAULT_MATCH_SETTINGS, ...(JSON.parse(localStorage.getItem(MATCH_SETTINGS_KEY) || "null") || {}) };
matchSettings.periodCount = Math.max(1, Math.min(6, Number(matchSettings.periodCount) || 2));
matchSettings.totalMinutes = Math.max(5, Math.min(180, Number(matchSettings.totalMinutes) || 30));
matchSettings.substitutionMinutes = Math.max(1, Math.min(30, Number(matchSettings.substitutionMinutes) || 5));

function getPeriodIndexes() {
  return Array.from({ length: matchSettings.periodCount }, (_, index) => index);
}

function makePeriodArray() {
  return Array(matchSettings.periodCount).fill(0);
}

function normalizePeriodArray(values) {
  return getPeriodIndexes().map(index => Number(values?.[index]) || 0);
}

function getPeriodTargetMs() {
  return (matchSettings.totalMinutes * 60 * 1000) / matchSettings.periodCount;
}

function getMatchTargetMs() {
  return matchSettings.totalMinutes * 60 * 1000;
}

function getPeriodLabelWord() {
  return matchSettings.periodCount === 2 ? "Halvlek" : "Period";
}

function saveMatchSettings() {
  localStorage.setItem(MATCH_SETTINGS_KEY, JSON.stringify(matchSettings));
}
let PLAYERS = JSON.parse(localStorage.getItem("fotbollstranaren-players") || "null") || [...DEFAULT_PLAYERS];
const ROLE_ORDER = {"1":1,"2":2,"3":3,"4":4,"MV":5};
const playerStats = {};

function createEmptyPlayerStats() {
  return {
    halves: makePeriodArray(),
    benchHalves: makePeriodArray(),
    keeperHalves: makePeriodArray(),
    stintSeconds: 0,
    benchStintSeconds: 0,
    stintAlerted: false,
    benchAlerted: false
  };
}

PLAYERS.forEach(name => {
  playerStats[name] = createEmptyPlayerStats();
});

const DEFAULT_EXERCISES = {
  passing: [
    { id: "gate", title: "Passa genom porten", description: "Två spelare passar bollen genom en port av konor. Flytta porten eller gör den smalare för mer precision.", items: [
      {type:"player", name:"Liam", x:20, y:50}, {type:"player", name:"Finn", x:80, y:50}, {type:"ball", x:50, y:50}, {type:"cone", x:47, y:43}, {type:"cone", x:47, y:57}
    ]},
    { id: "move", title: "Passa och byt plats", description: "Tre spelare passar och springer till nästa position efter passningen.", items: [
      {type:"player", name:"Liam", x:50, y:20}, {type:"player", name:"Finn", x:25, y:72}, {type:"player", name:"Erik", x:75, y:72}, {type:"ball", x:50, y:48}, {type:"cone", x:50, y:28}, {type:"cone", x:30, y:68}, {type:"cone", x:70, y:68}
    ]},
    { id: "square", title: "Fyrkanten", description: "Fyra spelare passar runt en fyrkant. Lägg till tränaren i mitten som passiv eller aktiv försvarare.", items: [
      {type:"player", name:"Liam", x:20, y:25}, {type:"player", name:"Finn", x:80, y:25}, {type:"player", name:"Erik", x:20, y:75}, {type:"player", name:"Frans", x:80, y:75}, {type:"coach", name:"Tränare", x:50, y:50}, {type:"ball", x:28, y:25}, {type:"cone", x:28, y:32}, {type:"cone", x:72, y:32}, {type:"cone", x:28, y:68}, {type:"cone", x:72, y:68}
    ]},
    { id: "wall", title: "Tränaren som vägg", description: "Spelaren passar tränaren, springer fram och får tillbaka bollen.", items: [
      {type:"player", name:"Liam", x:20, y:50}, {type:"coach", name:"Tränare", x:50, y:50}, {type:"player", name:"Finn", x:80, y:50}, {type:"ball", x:35, y:50}
    ]},
    { id: "bowling", title: "Passningsbowling", description: "Spelaren försöker träffa konorna med en kontrollerad passning.", items: [
      {type:"player", name:"Liam", x:18, y:50}, {type:"ball", x:28, y:50}, {type:"cone", x:72, y:42}, {type:"cone", x:78, y:50}, {type:"cone", x:72, y:58}
    ]}
  ],
  shooting: [
    { id: "coachpass", title: "Passning från tränare → skott", description: "Tränaren passar fram bollen. Spelaren tar emot och avslutar mot mål.", items: [
      {type:"coach", name:"Tränare", x:50, y:82}, {type:"ball", x:50, y:66}, {type:"player", name:"Liam", x:50, y:52}, {type:"player", name:"Ian", x:50, y:10}
    ]},
    { id: "coneshoot", title: "Dribbla mellan konor + skott", description: "Dribbla mellan konorna och avsluta mot mål.", items: [
      {type:"player", name:"Liam", x:50, y:88}, {type:"ball", x:50, y:80}, {type:"cone", x:43, y:68}, {type:"cone", x:57, y:56}, {type:"cone", x:43, y:44}, {type:"cone", x:57, y:32}, {type:"player", name:"Ian", x:50, y:10}
    ]},
    { id: "twogoals", title: "Vänster eller höger", description: "Tränaren ropar vänster eller höger. Spelaren ska snabbt välja sida och avsluta.", items: [
      {type:"player", name:"Liam", x:50, y:78}, {type:"ball", x:50, y:66}, {type:"cone", x:32, y:20}, {type:"cone", x:68, y:20}
    ]},
    { id: "wallshot", title: "Skott efter väggpass", description: "Passa tränaren, få tillbaka bollen i fart och avsluta.", items: [
      {type:"player", name:"Liam", x:35, y:78}, {type:"coach", name:"Tränare", x:55, y:58}, {type:"ball", x:43, y:70}, {type:"player", name:"Ian", x:50, y:10}
    ]},
    { id: "onevone", title: "1 mot 1 mot målvakt", description: "Tränaren spelar fram bollen. Spelaren driver mot mål och försöker avsluta.", items: [
      {type:"coach", name:"Tränare", x:50, y:86}, {type:"ball", x:50, y:72}, {type:"player", name:"Liam", x:50, y:58}, {type:"player", name:"Ian", x:50, y:10}
    ]}
  ]
};

function cloneExercises(source) {
  return JSON.parse(JSON.stringify(source));
}

let exercises = JSON.parse(localStorage.getItem("fotbollstranaren-exercises") || "null") || cloneExercises(DEFAULT_EXERCISES);

function saveExercises() {
  localStorage.setItem("fotbollstranaren-exercises", JSON.stringify(exercises));
}

let matchHistory = JSON.parse(localStorage.getItem("fotbollstranaren-match-history") || "[]");

function saveMatchHistory() {
  localStorage.setItem("fotbollstranaren-match-history", JSON.stringify(matchHistory));
}

let objectCounter = 0;
let currentCategory = "passing";
let currentExerciseIndex = 0;
let currentHalf = 0;
let halfElapsedMs = makePeriodArray();
let stopwatchStartedAt = null;
let stopwatchTimerId = null;
let stopwatchLastTick = null;
let selectedPlaytimePlayer = null;
let currentSubstitutionSuggestion = null;
let lastSubstitutionState = null;
let matchScore = { home: 0, away: 0 };
let goalEvents = [];
let currentMatchActive = false;
let autoSaveReady = false;
const CURRENT_MATCH_KEY = "fotbollstranaren-current-match";

const matchInitial = {
  pitchPlayers: [
    {name:"Liam", indicator:"1", x:50, y:55},
    {name:"Ian", indicator:"2", x:28, y:68},
    {name:"Erik", indicator:"3", x:72, y:68},
    {name:"Frans", indicator:"4", x:50, y:80},
    {name:"Endrit", indicator:"MV", x:50, y:94}
  ],
  benchPlayers: ["Finn","Charles","John"],
  opponents: [
    {indicator:"1", x:30, y:28},
    {indicator:"2", x:70, y:28},
    {indicator:"3", x:50, y:40},
    {indicator:"4", x:50, y:18},
    {indicator:"MV", x:50, y:8}
  ],
  ball: {x:50, y:50}
};

function fmtTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${String(minutes).padStart(2,"0")}:${String(remain).padStart(2,"0")}`;
}

function getPlayerTotalSeconds(name) {
  return (playerStats[name]?.halves || makePeriodArray()).reduce((sum, seconds) => sum + seconds, 0);
}

function getOpponentName() {
  return document.getElementById("opponentName")?.value.trim() || "Motståndare";
}

function updateOpponentLabel() {
  const opponent = getOpponentName();
  ["opponentNameLabel", "playtimeOpponentNameLabel"].forEach(id => {
    const label = document.getElementById(id);
    if (label) label.textContent = opponent;
  });
}

function setMatchActiveUI(active) {
  currentMatchActive = Boolean(active);
  const empty = document.getElementById("matchEmptyState");
  const content = document.getElementById("matchActiveContent");
  const playtimeBanner = document.getElementById("playtimeMatchBanner");
  if (empty) empty.hidden = currentMatchActive;
  if (content) content.hidden = !currentMatchActive;
  if (playtimeBanner) playtimeBanner.hidden = !currentMatchActive;
}

function getGoalCount(name) {
  return goalEvents.filter(event => event.playerName === name).length;
}

function getPitchState() {
  const pitch = document.getElementById("matchPitch");
  if (!pitch) return [];

  return [...pitch.querySelectorAll(".token")].map(el => ({
    type: el.dataset.type,
    name: el.dataset.name || "",
    indicator: el.dataset.indicator || "",
    opponent: el.classList.contains("opponent"),
    left: el.style.left,
    top: el.style.top
  }));
}

function saveCurrentMatchState() {
  if (!autoSaveReady || !currentMatchActive) return;

  const state = {
    version: 2,
    active: true,
    savedAt: Date.now(),
    clockRunning: Boolean(stopwatchStartedAt),
    stopwatchStartedAt: stopwatchStartedAt || null,
    stopwatchLastTick: stopwatchLastTick || null,
    currentHalf,
    halfElapsedMs: [...halfElapsedMs],
    matchScore: { ...matchScore },
    opponentName: document.getElementById("opponentName")?.value || "",
    goalEvents: goalEvents.map(event => ({ ...event })),
    playerStats: Object.fromEntries(PLAYERS.map(name => [name, {
      halves: normalizePeriodArray(playerStats[name]?.halves),
      benchHalves: normalizePeriodArray(playerStats[name]?.benchHalves),
      keeperHalves: normalizePeriodArray(playerStats[name]?.keeperHalves),
      stintSeconds: Number(playerStats[name]?.stintSeconds) || 0,
      benchStintSeconds: Number(playerStats[name]?.benchStintSeconds) || 0,
      stintAlerted: Boolean(playerStats[name]?.stintAlerted),
      benchAlerted: Boolean(playerStats[name]?.benchAlerted)
    }])),
    pitchObjects: getPitchState(),
    benchPlayers: [...document.querySelectorAll("#bench .bench-player")].map(el => el.dataset.name)
  };

  localStorage.setItem(CURRENT_MATCH_KEY, JSON.stringify(state));
}

function clearCurrentMatchState() {
  localStorage.removeItem(CURRENT_MATCH_KEY);
}

function restoreCurrentMatchState() {
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(CURRENT_MATCH_KEY) || "null");
  } catch {
    state = null;
  }
  if (!state || state.active === false) return false;

  currentMatchActive = true;

  const pitch = document.getElementById("matchPitch");
  const bench = document.getElementById("bench");
  if (!pitch || !bench) return false;

  currentHalf = Math.max(0, Math.min(matchSettings.periodCount - 1, Number(state.currentHalf) || 0));
  halfElapsedMs = normalizePeriodArray(state.halfElapsedMs);

  if (state.clockRunning && Number(state.stopwatchStartedAt) > 0) {
    stopwatchStartedAt = Number(state.stopwatchStartedAt);
    stopwatchLastTick = Number(state.stopwatchLastTick) > 0
      ? Number(state.stopwatchLastTick)
      : Number(state.savedAt) || stopwatchStartedAt;
  } else {
    stopwatchStartedAt = null;
    stopwatchLastTick = null;
  }

  matchScore = {
    home: Math.max(0, Number(state.matchScore?.home) || 0),
    away: Math.max(0, Number(state.matchScore?.away) || 0)
  };
  goalEvents = Array.isArray(state.goalEvents) ? state.goalEvents.filter(event => event && ("playerName" in event)) : [];

  PLAYERS.forEach(name => {
    const saved = state.playerStats?.[name];
    if (!saved) return;
    playerStats[name].halves = normalizePeriodArray(saved.halves);
    playerStats[name].benchHalves = normalizePeriodArray(saved.benchHalves);
    playerStats[name].keeperHalves = normalizePeriodArray(saved.keeperHalves);
    playerStats[name].stintSeconds = Number(saved.stintSeconds) || 0;
    playerStats[name].benchStintSeconds = Number(saved.benchStintSeconds) || 0;
    playerStats[name].stintAlerted = Boolean(saved.stintAlerted);
    playerStats[name].benchAlerted = Boolean(saved.benchAlerted);
  });

  pitch.querySelectorAll(".token").forEach(el => el.remove());
  bench.innerHTML = "";

  const restoredNames = new Set();
  (state.pitchObjects || []).forEach(item => {
    if (item.type === "player" && !item.opponent && !PLAYERS.includes(item.name)) return;

    let token;
    if (item.type === "player") {
      token = createToken("player", {
        name: item.opponent ? "Motståndare" : item.name,
        indicator: item.indicator || undefined,
        opponent: Boolean(item.opponent)
      });
      if (!item.opponent) restoredNames.add(item.name);
    } else if (item.type === "ball") {
      token = createToken("ball");
    } else if (item.type === "cone") {
      token = createToken("cone");
    } else if (item.type === "coach") {
      token = createToken("coach", { name: item.name || "Tränare" });
    } else {
      return;
    }

    pitch.appendChild(token);
    token.style.left = item.left || "50%";
    token.style.top = item.top || "50%";
  });

  const benchNames = Array.isArray(state.benchPlayers) ? state.benchPlayers : [];
  benchNames.forEach(name => {
    if (PLAYERS.includes(name) && !restoredNames.has(name)) {
      addPlayerToBench(name);
      restoredNames.add(name);
    }
  });

  PLAYERS.forEach(name => {
    if (!restoredNames.has(name)) addPlayerToBench(name);
  });

  const opponentInput = document.getElementById("opponentName");
  if (opponentInput) opponentInput.value = state.opponentName || "";
  updateOpponentLabel();
  setMatchActiveUI(true);

  renderMatchScore();
  updateHalfUI();
  updateStopwatchDisplay();
  updateMatchInfo();
  return true;
}

function setTabs() {
  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "playtime") {
      renderPlaytimeRoster();
      updateOpponentLabel();
      renderMatchScore();
      updateHalfUI();
      updateStopwatchDisplay();
    }
    if (btn.dataset.tab === "history") {
      renderHistory();
    }
  }));
}

function createToken(type, opts = {}) {
  const el = document.createElement("div");
  el.dataset.type = type;
  el.dataset.id = `obj-${++objectCounter}`;
  if (type === "player") {
    el.className = "token player-token";
    el.dataset.name = opts.name || "Spelare";
    if (opts.indicator) {
      el.dataset.indicator = opts.indicator;
      el.innerHTML = `<span class="match-indicator">${opts.indicator}</span>${opts.opponent ? "" : `<span class="match-player-name">${opts.name || "Spelare"}</span><span class="match-player-live-time">${fmtTime(getLiveStintSeconds(opts.name || "Spelare"))}</span>`}`;
    } else {
      el.textContent = opts.name || "Spelare";
    }
    if (opts.opponent) el.classList.add("opponent");
  }
  if (type === "coach") {
    el.className = "token player-token coach";
    el.textContent = opts.name || "Tränare";
  }
  if (type === "ball") {
    el.className = "token ball-token";
    el.textContent = "⚽";
  }
  if (type === "cone") {
    el.className = "token cone-token";
    el.textContent = "🔶";
  }
  makeDraggable(el);
  return el;
}

function placeToken(container, el, x, y) {
  container.appendChild(el);
  el.classList.remove("bench-player");
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
}

function pointInside(rect, x, y) { return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom; }

function placeFromPointer(container, el, clientX, clientY) {
  const rect = container.getBoundingClientRect();
  let x = ((clientX - rect.left) / rect.width) * 100;
  let y = ((clientY - rect.top) / rect.height) * 100;
  x = Math.max(3, Math.min(97, x));
  y = Math.max(3, Math.min(97, y));
  placeToken(container, el, x, y);
}

function getOwnPitchPlayerAtPoint(clientX, clientY, excludeEl = null) {
  const candidates = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')].filter(player => player !== excludeEl);
  return candidates.find(player => pointInside(player.getBoundingClientRect(), clientX, clientY)) || null;
}

function getBenchPlayerAtPoint(clientX, clientY, excludeEl = null) {
  const candidates = [...document.querySelectorAll('#bench .player-token')].filter(player => player !== excludeEl);
  return candidates.find(player => pointInside(player.getBoundingClientRect(), clientX, clientY)) || null;
}

function clearSwapTarget() { document.querySelectorAll(".swap-target").forEach(el => el.classList.remove("swap-target")); }

function getNextOwnIndicator() {
  const pitch = document.getElementById("matchPitch");
  const used = new Set([...pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)')].map(el => el.dataset.indicator).filter(Boolean));
  return ["1","2","3","4","MV"].find(indicator => !used.has(indicator)) || "1";
}

function setMatchPlayerIndicator(el, indicator, name) {
  el.dataset.indicator = indicator;
  el.dataset.name = name;
  el.innerHTML = `<span class="match-indicator">${indicator}</span><span class="match-player-name">${name}</span><span class="match-player-live-time">${fmtTime(getLivePlayerTotalSeconds(name))}</span>`;
}

function resetSubstitutionClock(name) {
  if (!playerStats[name]) return;
  playerStats[name].stintSeconds = 0;
  playerStats[name].benchStintSeconds = 0;
  playerStats[name].stintAlerted = false;
  playerStats[name].benchAlerted = false;
}

function getLiveStintSeconds(name) {
  const snapshot = getPlayerSnapshot(name);
  const base = Number(playerStats[name]?.stintSeconds) || 0;
  if (!stopwatchStartedAt || !stopwatchLastTick || snapshot.location !== "pitch") return base;
  return base + ((Date.now() - stopwatchLastTick) / 1000);
}

function getLiveBenchStintSeconds(name) {
  const snapshot = getPlayerSnapshot(name);
  const base = Number(playerStats[name]?.benchStintSeconds) || 0;
  if (!stopwatchStartedAt || !stopwatchLastTick || snapshot.location !== "bench") return base;
  return base + ((Date.now() - stopwatchLastTick) / 1000);
}

function getSubstitutionTimerState(seconds) {
  const target = matchSettings.substitutionMinutes * 60;
  if (seconds >= target + 120) return "overdue-red";
  if (seconds >= target) return "overdue-orange";
  return "on-time";
}

function addPlayerToBench(name) {
  const bench = document.getElementById("bench");
  const el = createToken("player", {name});
  el.classList.add("bench-player");
  el.addEventListener("click", () => {
    if (el.parentElement?.id !== "bench") return;
    const pitch = document.getElementById("matchPitch");
    const playerCount = pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)').length;
    if (playerCount >= 5) {
      alert("Det är redan 5 egna spelare på planen. Släpp spelaren på en aktiv spelare för att byta.");
      return;
    }
    const indicator = getNextOwnIndicator();
    resetSubstitutionClock(name);
    setMatchPlayerIndicator(el, indicator, name);
    placeToken(pitch, el, 50, indicator === "MV" ? 90 : 82);
    updateMatchInfo();
  });
  bench.appendChild(el);
}

function makeDraggable(el) {
  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    const originParent = el.parentElement;
    const fromBench = originParent?.id === "bench";
    const fromPitch = originParent?.classList.contains("pitch");
    if (!fromBench && !fromPitch) return;
    if (fromBench && el.dataset.type !== "player") return;

    const isOwnPitchPlayer = fromPitch && originParent.id === "matchPitch" && el.dataset.type === "player" && !el.classList.contains("opponent") && !el.classList.contains("coach");
    const isGoalkeeper = isOwnPitchPlayer && el.dataset.indicator === "MV";

    const originLeft = el.style.left;
    const originTop = el.style.top;
    const tokenRect = el.getBoundingClientRect();
    let benchDragPlaceholder = null;

    if (fromBench) {
      benchDragPlaceholder = el.cloneNode(true);
      benchDragPlaceholder.classList.remove("dragging", "dragging-floating", "bench-drag-preview");
      benchDragPlaceholder.classList.add("bench-drag-origin");
      benchDragPlaceholder.setAttribute("aria-hidden", "true");
      originParent.insertBefore(benchDragPlaceholder, el);
    }
    const matchPitch = document.getElementById("matchPitch");
    const bench = document.getElementById("bench");

    el.classList.add("dragging", "dragging-floating");
    if (fromBench) {
      el.classList.add("bench-drag-preview");
      el.style.width = "";
      el.style.height = "";
    } else {
      el.style.width = `${tokenRect.width}px`;
      el.style.height = `${tokenRect.height}px`;
    }
    el.style.left = `${e.clientX}px`;
    el.style.top = `${e.clientY}px`;
    document.body.appendChild(el);

    let currentSwapTarget = null;
    const setSwapTarget = target => {
      if (target === currentSwapTarget) return;
      clearSwapTarget();
      currentSwapTarget = target;
      if (currentSwapTarget) currentSwapTarget.classList.add("swap-target");
    };

    const removeBenchDragPlaceholder = () => {
      if (benchDragPlaceholder) {
        benchDragPlaceholder.remove();
        benchDragPlaceholder = null;
      }
    };

    const restoreToOrigin = () => {
      clearSwapTarget();
      el.classList.remove("dragging", "dragging-floating", "bench-drag-preview");
      el.style.width = "";
      el.style.height = "";
      if (fromBench && benchDragPlaceholder?.parentElement === originParent) {
        benchDragPlaceholder.replaceWith(el);
        benchDragPlaceholder = null;
      } else {
        originParent.appendChild(el);
      }
      if (fromBench) {
        el.classList.add("bench-player");
        el.style.left = "";
        el.style.top = "";
      } else {
        el.style.left = originLeft;
        el.style.top = originTop;
      }
    };

    const move = ev => {
      el.style.left = `${ev.clientX}px`;
      el.style.top = `${ev.clientY}px`;
      if (fromBench) {
        setSwapTarget(getOwnPitchPlayerAtPoint(ev.clientX, ev.clientY, el));
        return;
      }

      if (isOwnPitchPlayer) {
        const benchTarget = getBenchPlayerAtPoint(ev.clientX, ev.clientY, el);

        if (isGoalkeeper) {
          const pitchTarget = getOwnPitchPlayerAtPoint(ev.clientX, ev.clientY, el);
          setSwapTarget(pitchTarget || benchTarget);
        } else {
          setSwapTarget(benchTarget);
        }
      }
    };

    const finish = ev => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", cancel);
      el.classList.remove("dragging", "dragging-floating", "bench-drag-preview");
      el.style.width = "";
      el.style.height = "";

      if (fromBench) {
        const swapTarget = getOwnPitchPlayerAtPoint(ev.clientX, ev.clientY, el);
        if (swapTarget) {
          const indicator = swapTarget.dataset.indicator;
          const targetLeft = swapTarget.style.left;
          const targetTop = swapTarget.style.top;
          const targetName = swapTarget.dataset.name;
          resetSubstitutionClock(el.dataset.name);
          resetSubstitutionClock(targetName);
          swapTarget.remove();
          addPlayerToBench(targetName);
          setMatchPlayerIndicator(el, indicator, el.dataset.name);
          matchPitch.appendChild(el);
          el.classList.remove("bench-player");
          el.style.left = targetLeft;
          el.style.top = targetTop;
          removeBenchDragPlaceholder();
          clearSwapTarget();
          updateMatchInfo();
          return;
        }
        clearSwapTarget();
        if (pointInside(matchPitch.getBoundingClientRect(), ev.clientX, ev.clientY)) {
          const playerCount = matchPitch.querySelectorAll('.player-token:not(.opponent):not(.coach)').length;
          if (playerCount >= 5) {
            restoreToOrigin();
            alert("Det är redan 5 egna spelare på planen. Släpp spelaren på en aktiv spelare för att byta.");
            updateMatchInfo();
            return;
          }
          const indicator = getNextOwnIndicator();
          resetSubstitutionClock(el.dataset.name);
          setMatchPlayerIndicator(el, indicator, el.dataset.name);
          placeFromPointer(matchPitch, el, ev.clientX, ev.clientY);
          removeBenchDragPlaceholder();
          updateMatchInfo();
          return;
        }
        restoreToOrigin();
        updateMatchInfo();
        return;
      }

      if (isGoalkeeper) {
        const pitchTarget = getOwnPitchPlayerAtPoint(ev.clientX, ev.clientY, el);
        const benchTarget = getBenchPlayerAtPoint(ev.clientX, ev.clientY, el);
        if (pitchTarget) {
          const keeperName = el.dataset.name;
          const targetName = pitchTarget.dataset.name;
          const targetIndicator = pitchTarget.dataset.indicator;
          const targetLeft = pitchTarget.style.left;
          const targetTop = pitchTarget.style.top;
          setMatchPlayerIndicator(pitchTarget, "MV", targetName);
          pitchTarget.style.left = originLeft;
          pitchTarget.style.top = originTop;
          setMatchPlayerIndicator(el, targetIndicator, keeperName);
          matchPitch.appendChild(el);
          el.style.left = targetLeft;
          el.style.top = targetTop;
          clearSwapTarget(); updateMatchInfo(); return;
        }
        if (benchTarget) {
          const keeperName = el.dataset.name;
          const newKeeperName = benchTarget.dataset.name;
          resetSubstitutionClock(keeperName);
          resetSubstitutionClock(newKeeperName);
          benchTarget.remove();
          setMatchPlayerIndicator(benchTarget, "MV", newKeeperName);
          matchPitch.appendChild(benchTarget);
          benchTarget.classList.remove("bench-player");
          benchTarget.style.left = originLeft;
          benchTarget.style.top = originTop;
          el.remove(); addPlayerToBench(keeperName); clearSwapTarget(); updateMatchInfo(); return;
        }
      }

      const canGoToBench = originParent.id === "matchPitch" && el.dataset.type === "player" && !el.classList.contains("opponent") && !el.classList.contains("coach");

      if (canGoToBench && !isGoalkeeper) {
        const benchTarget = getBenchPlayerAtPoint(ev.clientX, ev.clientY, el);

        if (benchTarget) {
          const outgoingName = el.dataset.name;
          const incomingName = benchTarget.dataset.name;
          resetSubstitutionClock(outgoingName);
          resetSubstitutionClock(incomingName);
          const indicator = el.dataset.indicator;
          const targetLeft = originLeft;
          const targetTop = originTop;

          benchTarget.remove();
          setMatchPlayerIndicator(benchTarget, indicator, incomingName);
          matchPitch.appendChild(benchTarget);
          benchTarget.classList.remove("bench-player");
          benchTarget.style.left = targetLeft;
          benchTarget.style.top = targetTop;

          el.remove();
          addPlayerToBench(outgoingName);

          clearSwapTarget();
          updateMatchInfo();
          return;
        }
      }

      if (canGoToBench && pointInside(bench.getBoundingClientRect(), ev.clientX, ev.clientY)) {
        const name = el.dataset.name;
        resetSubstitutionClock(name);
        el.remove(); addPlayerToBench(name); clearSwapTarget(); updateMatchInfo(); return;
      }

      if (pointInside(originParent.getBoundingClientRect(), ev.clientX, ev.clientY)) placeFromPointer(originParent, el, ev.clientX, ev.clientY);
      else { originParent.appendChild(el); el.style.left = originLeft; el.style.top = originTop; }
      clearSwapTarget(); updateMatchInfo();
    };

    const cancel = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", cancel);
      restoreToOrigin(); updateMatchInfo();
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", cancel);
  });
}

function getActivePlayerNames() {
  return [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')].map(el => el.dataset.name);
}

function getPlayerRole(name) {
  const player = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')]
    .find(el => el.dataset.name === name);
  return player?.dataset.indicator || "";
}

function renderMatchBench() {
  const bench = document.getElementById("bench");
  const count = document.getElementById("matchBenchCount");
  if (!bench) return;

  const benchPlayers = [...bench.querySelectorAll('.bench-player')]
    .sort((a, b) => getLiveBenchStintSeconds(b.dataset.name) - getLiveBenchStintSeconds(a.dataset.name));

  benchPlayers.forEach(el => bench.appendChild(el));

  if (count) count.textContent = `${benchPlayers.length} på bänken`;

  benchPlayers.forEach((el, index) => {
    const benchSeconds = getLiveBenchStintSeconds(el.dataset.name);
    const totalSeconds = getLivePlayerTotalSeconds(el.dataset.name);
    const nextIn = index === 0 ? '<span class="next-in-badge">Nästa in</span>' : "";

    el.innerHTML = `
      <div class="match-bench-player-info">
        <strong>${el.dataset.name}</strong>
        <span class="lineup-status on-bench">På bänken</span>
        ${nextIn}
      </div>
      <span class="match-bench-live-time" data-bench-time-for="${el.dataset.name}">Bänktid ${fmtTime(benchSeconds)}</span>
      <span class="match-bench-total-time">Totalt ${fmtTime(totalSeconds)}</span>
    `;
  });
}

function getPlayerSnapshot(name) {
  const pitchPlayer = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')]
    .find(el => el.dataset.name === name);

  if (pitchPlayer) {
    return {
      name,
      location: "pitch",
      role: pitchPlayer.dataset.indicator || "",
      element: pitchPlayer
    };
  }

  const benchPlayer = [...document.querySelectorAll('#bench .bench-player')]
    .find(el => el.dataset.name === name);

  return {
    name,
    location: benchPlayer ? "bench" : "none",
    role: "",
    element: benchPlayer || null
  };
}

function renderPlaytimeRoster() {
  const root = document.getElementById("playtimeRoster");
  const halfColumn = document.getElementById("lineupHalfColumn");
  const hint = document.getElementById("playtimeSwapHint");
  const clearBtn = document.getElementById("clearPlaytimeSelection");

  if (halfColumn) halfColumn.textContent = `H${currentHalf + 1}`;
  if (clearBtn) clearBtn.disabled = !selectedPlaytimePlayer;

  if (hint) {
    hint.textContent = selectedPlaytimePlayer
      ? `${selectedPlaytimePlayer} markerad – välj en annan spelare för att byta.`
      : "Välj en spelare att byta.";
  }

  if (!root) return;

  const players = PLAYERS.map(name => {
    const snapshot = getPlayerSnapshot(name);
    return {
      ...snapshot,
      halfTime: getLivePlayerHalfSeconds(name, currentHalf),
      totalTime: getLivePlayerTotalSeconds(name),
      benchHalfTime: getLivePlayerBenchHalfSeconds(name, currentHalf),
      keeperTime: getLivePlayerKeeperTotalSeconds(name),
      stintTime: snapshot.location === "pitch" && snapshot.role !== "MV" ? getLiveStintSeconds(name) : 0,
      stintState: snapshot.location === "pitch" && snapshot.role !== "MV" ? getSubstitutionTimerState(getLiveStintSeconds(name)) : "",
      goals: getGoalCount(name)
    };
  });

  const activePlayers = players
    .filter(player => player.location === "pitch" && player.role !== "MV")
    .sort((a, b) => a.totalTime - b.totalTime || a.name.localeCompare(b.name, "sv"));

  const goalkeeperPlayers = players
    .filter(player => player.location === "pitch" && player.role === "MV")
    .sort((a, b) => a.totalTime - b.totalTime || a.name.localeCompare(b.name, "sv"));

  const benchPlayers = players
    .filter(player => player.location === "bench")
    .sort((a, b) => a.totalTime - b.totalTime || a.name.localeCompare(b.name, "sv"));

  const renderPlayerRow = player => {
    const selected = player.name === selectedPlaytimePlayer ? " selected" : "";
    const status = player.location === "pitch" ? "På plan" : "På bänken";
    const statusClass = player.location === "pitch" ? "on-pitch" : "on-bench";
    const role = player.role
      ? `<span class="lineup-role ${player.role === "MV" ? "goalkeeper-role" : ""}">${player.role === "MV" ? "Målvakt" : player.role}</span>`
      : "";
    const benchInfo = player.location === "bench"
      ? `<span class="playtime-bench-detail">${fmtTime(player.benchHalfTime)} på bänk</span>`
      : "";
    const goalsInfo = player.goals > 0
      ? `<span class="playtime-goals">${player.goals} mål</span>`
      : "";
    const keeperInfo = player.keeperTime > 0
      ? `<div class="playtime-keeper-time">Tid som målvakt: <strong>${fmtTime(player.keeperTime)}</strong></div>`
      : "";
    const substitutionInfo = player.location === "pitch" && player.role !== "MV"
      ? `<div class="playtime-substitution-time ${player.stintState}">Tid sedan byte: <strong>${fmtTime(player.stintTime)} / ${fmtTime(matchSettings.substitutionMinutes * 60)}</strong></div>`
      : "";

    return `
      <button type="button" class="playtime-player-row${selected}" data-playtime-player="${player.name}">
        <div class="playtime-player-main">
          <div class="playtime-player-name">${role}<strong>${player.name}</strong></div>
          <div class="lineup-status-row">
            <span class="lineup-status ${statusClass}">${status}</span>
            ${benchInfo}
            ${goalsInfo}
          </div>
          ${keeperInfo}
          ${substitutionInfo}
        </div>
        <div class="lineup-time">${fmtTime(player.halfTime)}</div>
        <div class="lineup-time">${fmtTime(player.totalTime)}</div>
      </button>
    `;
  };

  const renderGroup = (title, playersInGroup, className) => `
    <section class="playtime-group-card ${className}">
      <div class="playtime-group-head">
        <h4>${title}</h4>
        <span>${playersInGroup.length}</span>
      </div>
      <div class="playtime-group-list">
        ${playersInGroup.length
          ? playersInGroup.map(renderPlayerRow).join("")
          : '<div class="playtime-group-empty">Inga spelare</div>'}
      </div>
    </section>
  `;

  root.innerHTML = [
    renderGroup("Aktiva spelare", activePlayers, "playtime-group-active"),
    renderGroup("Nuvarande målvakt", goalkeeperPlayers, "playtime-group-keeper"),
    renderGroup("Bänk", benchPlayers, "playtime-group-bench")
  ].join("");

  root.querySelectorAll("[data-playtime-player]").forEach(btn => {
    btn.onclick = () => handlePlaytimePlayerClick(btn.dataset.playtimePlayer);
  });

  renderSubstitutionSuggestion();
}

function renderSubstitutionSuggestion() {
  const root = document.getElementById("substitutionSuggestion");
  if (!root) return;

  const prepThresholdSeconds = 3.5 * 60;
  const substitutionTargetSeconds = matchSettings.substitutionMinutes * 60;

  const active = PLAYERS
    .map(name => ({
      name,
      snapshot: getPlayerSnapshot(name),
      total: getLivePlayerTotalSeconds(name),
      stint: getLiveStintSeconds(name)
    }))
    .filter(item =>
      item.snapshot.location === "pitch" &&
      item.snapshot.role !== "MV" &&
      item.stint >= prepThresholdSeconds
    )
    .sort((a, b) => {
      const aOverdue = Math.max(0, a.stint - substitutionTargetSeconds);
      const bOverdue = Math.max(0, b.stint - substitutionTargetSeconds);
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      if (a.stint !== b.stint) return b.stint - a.stint;
      return b.total - a.total;
    });

  const bench = PLAYERS
    .map(name => ({
      name,
      snapshot: getPlayerSnapshot(name),
      total: getLivePlayerTotalSeconds(name),
      benchStint: getLiveBenchStintSeconds(name)
    }))
    .filter(item =>
      item.snapshot.location === "bench" &&
      item.benchStint >= prepThresholdSeconds
    )
    .sort((a, b) => {
      if (a.benchStint !== b.benchStint) return b.benchStint - a.benchStint;
      return a.total - b.total;
    });

  if (!active.length || !bench.length) {
    currentSubstitutionSuggestion = null;
    root.innerHTML = "";
    return;
  }

  const stickyOutgoing = currentSubstitutionSuggestion
    ? active.find(item => item.name === currentSubstitutionSuggestion.outgoing)
    : null;
  const stickyIncoming = currentSubstitutionSuggestion
    ? bench.find(item => item.name === currentSubstitutionSuggestion.incoming)
    : null;

  const outgoing = stickyOutgoing || active[0];
  const incoming = stickyIncoming || bench[0];

  if (!stickyOutgoing || !stickyIncoming) {
    currentSubstitutionSuggestion = {
      outgoing: outgoing.name,
      incoming: incoming.name
    };
  }

  const overdueBy = Math.max(0, outgoing.stint - substitutionTargetSeconds);
  const reason = overdueBy > 0
    ? ` · ${fmtTime(overdueBy)} över byteslängd`
    : "";

  root.innerHTML = `
    <div>
      <span>Bytesförslag</span>
      <strong>${incoming.name} in · ${outgoing.name} ut</strong>
      <small class="substitution-reason">På plan: ${fmtTime(outgoing.stint)} · På bänk: ${fmtTime(incoming.benchStint)}${reason}</small>
    </div>
    <div class="substitution-suggestion-actions">
      <button type="button" class="secondary compact-btn" id="selectSuggestionBtn">Markera</button>
      <button type="button" class="compact-btn" id="performSuggestionBtn">Genomför byte</button>
    </div>
  `;

  document.getElementById("selectSuggestionBtn").onclick = () => {
    selectedPlaytimePlayer = outgoing.name;
    renderPlaytimeRoster();
  };

  document.getElementById("performSuggestionBtn").onclick = () => {
    if (stopwatchStartedAt) onStopwatchTick();
    const swapped = swapPlayersByClick(outgoing.name, incoming.name);
    selectedPlaytimePlayer = null;
    currentSubstitutionSuggestion = null;
    if (swapped) updateMatchInfo();
  };
}

function clearPlaytimePlayerSelection() {
  selectedPlaytimePlayer = null;
  renderPlaytimeRoster();
}

function captureSubstitutionState() {
  const pitch = document.getElementById("matchPitch");
  const bench = document.getElementById("bench");
  return {
    pitchPlayers: [...pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)')].map(el => ({
      name: el.dataset.name, indicator: el.dataset.indicator, left: el.style.left, top: el.style.top
    })),
    benchPlayers: [...bench.querySelectorAll(".bench-player")].map(el => el.dataset.name),
    playerStats: Object.fromEntries(PLAYERS.map(name => [name, JSON.parse(JSON.stringify(playerStats[name]))]))
  };
}

function updateUndoSubstitutionButton() {
  const btn = document.getElementById("undoSubstitutionBtn");
  if (btn) btn.disabled = !lastSubstitutionState;
}

function undoLastSubstitution() {
  if (!lastSubstitutionState) return;
  const snapshot = lastSubstitutionState;
  const pitch = document.getElementById("matchPitch");
  const bench = document.getElementById("bench");
  lastSubstitutionState = null;
  pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)').forEach(el => el.remove());
  bench.innerHTML = "";
  PLAYERS.forEach(name => { if (snapshot.playerStats[name]) playerStats[name] = JSON.parse(JSON.stringify(snapshot.playerStats[name])); });
  snapshot.pitchPlayers.forEach(item => {
    const el = createToken("player", {name:item.name, indicator:item.indicator});
    pitch.appendChild(el);
    el.style.left = item.left;
    el.style.top = item.top;
  });
  snapshot.benchPlayers.forEach(name => addPlayerToBench(name));
  selectedPlaytimePlayer = null;
  currentSubstitutionSuggestion = null;
  updateMatchInfo();
  updateUndoSubstitutionButton();
}

function swapPlayersByClick(firstName, secondName) {
  const first = getPlayerSnapshot(firstName);
  const second = getPlayerSnapshot(secondName);

  if (!first.element || !second.element) return false;
  const substitutionSnapshot = captureSubstitutionState();

  if (first.location === "pitch" && second.location === "bench") {
    resetSubstitutionClock(firstName);
    resetSubstitutionClock(secondName);
    const indicator = first.element.dataset.indicator;
    const left = first.element.style.left;
    const top = first.element.style.top;

    second.element.remove();
    setMatchPlayerIndicator(second.element, indicator, secondName);
    document.getElementById("matchPitch").appendChild(second.element);
    second.element.classList.remove("bench-player");
    second.element.style.left = left;
    second.element.style.top = top;

    first.element.remove();
    addPlayerToBench(firstName);
    lastSubstitutionState = substitutionSnapshot;
    updateUndoSubstitutionButton();
    return true;
  }

  if (first.location === "bench" && second.location === "pitch") {
    return swapPlayersByClick(secondName, firstName);
  }

  if (first.location === "pitch" && second.location === "pitch") {
    const firstIndicator = first.element.dataset.indicator;
    const secondIndicator = second.element.dataset.indicator;
    const firstLeft = first.element.style.left;
    const firstTop = first.element.style.top;
    const secondLeft = second.element.style.left;
    const secondTop = second.element.style.top;

    setMatchPlayerIndicator(first.element, secondIndicator, firstName);
    setMatchPlayerIndicator(second.element, firstIndicator, secondName);
    first.element.style.left = secondLeft;
    first.element.style.top = secondTop;
    second.element.style.left = firstLeft;
    second.element.style.top = firstTop;
    return true;
  }

  return false;
}

function handlePlaytimePlayerClick(name) {
  if (!selectedPlaytimePlayer) {
    selectedPlaytimePlayer = name;
    renderPlaytimeRoster();
    return;
  }

  if (selectedPlaytimePlayer === name) {
    clearPlaytimePlayerSelection();
    return;
  }

  if (stopwatchStartedAt) onStopwatchTick();

  const swapped = swapPlayersByClick(selectedPlaytimePlayer, name);
  selectedPlaytimePlayer = null;

  if (swapped) {
    updateMatchInfo();
  } else {
    renderPlaytimeRoster();
  }
}

function renderLineupPanel() {
  renderMatchBench();
  renderPlaytimeRoster();
}

async function triggerBenchVibration() {
  try {
    const haptics = window.Capacitor?.Plugins?.Haptics;
    if (haptics?.vibrate) {
      await haptics.vibrate({ duration: 120 });
      return;
    }
  } catch {}
  if (navigator.vibrate) navigator.vibrate(120);
}

async function triggerSubstitutionVibration() {
  try {
    const haptics = window.Capacitor?.Plugins?.Haptics;
    if (haptics?.vibrate) {
      await haptics.vibrate({ duration: 220 });
      setTimeout(() => {
        haptics.vibrate({ duration: 220 }).catch(() => {});
      }, 320);
      return { ok: true, mode: "native" };
    }
  } catch {}

  if (navigator.vibrate) {
    const ok = navigator.vibrate([220, 100, 220]);
    return { ok: Boolean(ok), mode: "web" };
  }

  return { ok: false, mode: "unsupported" };
}

function tickPlayerStats(deltaSeconds) {
  if (deltaSeconds <= 0) return;

  const pitchPlayers = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')];
  const activeNames = new Set(pitchPlayers.map(el => el.dataset.name));
  const keeperName = pitchPlayers.find(el => el.dataset.indicator === "MV")?.dataset.name || null;

  PLAYERS.forEach(name => {
    const stats = playerStats[name];
    if (!stats) return;

    if (activeNames.has(name)) {
      stats.halves[currentHalf] += deltaSeconds;
      stats.stintSeconds = (Number(stats.stintSeconds) || 0) + deltaSeconds;

      const alertAtSeconds = matchSettings.substitutionMinutes * 60;
      if (name !== keeperName && stats.stintSeconds >= alertAtSeconds && !stats.stintAlerted) {
        stats.stintAlerted = true;
        triggerSubstitutionVibration();
      }

      if (name === keeperName) stats.keeperHalves[currentHalf] += deltaSeconds;
    } else {
      stats.benchHalves[currentHalf] += deltaSeconds;
      stats.benchStintSeconds = (Number(stats.benchStintSeconds) || 0) + deltaSeconds;
      if (stats.benchStintSeconds >= (6.5 * 60) && !stats.benchAlerted) {
        stats.benchAlerted = true;
        triggerBenchVibration();
      }
    }
  });
}

function getLiveStateDelta(name, halfIndex, kind) {
  if (!stopwatchStartedAt || !stopwatchLastTick || halfIndex !== currentHalf) return 0;

  const pitchPlayers = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')];
  const player = pitchPlayers.find(el => el.dataset.name === name);
  const elapsed = (Date.now() - stopwatchLastTick) / 1000;

  if (kind === "play") return player ? elapsed : 0;
  if (kind === "bench") return player ? 0 : elapsed;
  if (kind === "keeper") return player?.dataset.indicator === "MV" ? elapsed : 0;
  return 0;
}

function getLivePlayerHalfSeconds(name, halfIndex) {
  const base = playerStats[name]?.halves?.[halfIndex] || 0;
  return base + getLiveStateDelta(name, halfIndex, "play");
}

function getLivePlayerBenchHalfSeconds(name, halfIndex) {
  const base = playerStats[name]?.benchHalves?.[halfIndex] || 0;
  return base + getLiveStateDelta(name, halfIndex, "bench");
}

function getLivePlayerKeeperHalfSeconds(name, halfIndex) {
  const base = playerStats[name]?.keeperHalves?.[halfIndex] || 0;
  return base + getLiveStateDelta(name, halfIndex, "keeper");
}

function getLivePlayerTotalSeconds(name) {
  return getPeriodIndexes().reduce((sum, halfIndex) => sum + getLivePlayerHalfSeconds(name, halfIndex), 0);
}

function getLivePlayerBenchTotalSeconds(name) {
  return getPeriodIndexes().reduce((sum, halfIndex) => sum + getLivePlayerBenchHalfSeconds(name, halfIndex), 0);
}

function getLivePlayerKeeperTotalSeconds(name) {
  return getPeriodIndexes().reduce((sum, halfIndex) => sum + getLivePlayerKeeperHalfSeconds(name, halfIndex), 0);
}

function getSortedPlayerStats(sortMode = "total") {
  const activeNames = new Set(getActivePlayerNames());

  return PLAYERS.map((name, originalIndex) => ({
    name,
    originalIndex,
    active: activeNames.has(name),
    halves: getPeriodIndexes().map(halfIndex => getLivePlayerHalfSeconds(name, halfIndex)),
    benchHalves: getPeriodIndexes().map(halfIndex => getLivePlayerBenchHalfSeconds(name, halfIndex)),
    keeperHalves: getPeriodIndexes().map(halfIndex => getLivePlayerKeeperHalfSeconds(name, halfIndex)),
    total: getLivePlayerTotalSeconds(name),
    benchTotal: getLivePlayerBenchTotalSeconds(name),
    keeperTotal: getLivePlayerKeeperTotalSeconds(name)
  })).sort((a, b) => {
    const aValue = sortMode === "half" ? a.halves[currentHalf] : a.total;
    const bValue = sortMode === "half" ? b.halves[currentHalf] : b.total;
    if (aValue !== bValue) return aValue - bValue;
    return a.originalIndex - b.originalIndex;
  });
}

function updatePlaytimeStats() {
  renderLineupPanel();
  renderStatistics();
  saveCurrentMatchState();
}

function renderStatistics() {}

function updateMatchInfo() {
  renderLineupPanel();
  renderPlayerManager();
  saveCurrentMatchState();
}

function resetPlayerStats() {
  PLAYERS.forEach(name => {
    playerStats[name].halves = makePeriodArray();
    playerStats[name].benchHalves = makePeriodArray();
    playerStats[name].keeperHalves = makePeriodArray();
    playerStats[name].stintSeconds = 0;
    playerStats[name].benchStintSeconds = 0;
    playerStats[name].stintAlerted = false;
    playerStats[name].benchAlerted = false;
  });
  updatePlaytimeStats();
}

function renderMatchScore() {
  ["homeScore", "playtimeHomeScore"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(matchScore.home);
  });
  ["awayScore", "playtimeAwayScore"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(matchScore.away);
  });

  ["homeGoalMinus", "playtimeHomeGoalMinus"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = matchScore.home <= 0;
  });
  ["awayGoalMinus", "playtimeAwayGoalMinus"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = matchScore.away <= 0;
  });
}

function closeGoalScorerModal() {
  const modal = document.getElementById("goalScorerModal");
  if (modal) modal.hidden = true;
}

function recordHomeGoal(playerName = null) {
  matchScore.home += 1;
  goalEvents.push({
    playerName,
    half: currentHalf,
    atSeconds: getCurrentHalfElapsedMs() / 1000,
    createdAt: Date.now()
  });
  renderMatchScore();
  renderPlaytimeRoster();
  renderPlayerManager();
  closeGoalScorerModal();
  saveCurrentMatchState();
}

function openGoalScorerModal() {
  const modal = document.getElementById("goalScorerModal");
  const activeRoot = document.getElementById("goalScorerActive");
  const benchRoot = document.getElementById("goalScorerBench");
  if (!modal || !activeRoot || !benchRoot) return;

  const active = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')]
    .sort((a,b) => (ROLE_ORDER[a.dataset.indicator] || 99) - (ROLE_ORDER[b.dataset.indicator] || 99))
    .map(el => el.dataset.name);

  const activeSet = new Set(active);
  const bench = PLAYERS.filter(name => !activeSet.has(name));

  activeRoot.innerHTML = `
    <div class="goal-scorer-section-title">På plan</div>
    <div class="goal-scorer-list">
      ${active.map(name => `<button type="button" class="goal-scorer-player on-pitch" data-goal-scorer="${name}">${name}</button>`).join("")}
    </div>
  `;

  benchRoot.innerHTML = bench.length ? `
    <div class="goal-scorer-section-title">På bänken</div>
    <div class="goal-scorer-list">
      ${bench.map(name => `<button type="button" class="goal-scorer-player on-bench" data-goal-scorer="${name}">${name}</button>`).join("")}
    </div>
  ` : "";

  modal.querySelectorAll("[data-goal-scorer]").forEach(btn => {
    btn.onclick = () => recordHomeGoal(btn.dataset.goalScorer);
  });

  modal.hidden = false;
}

function changeAwayScore(delta) {
  matchScore.away = Math.max(0, matchScore.away + delta);
  renderMatchScore();
  saveCurrentMatchState();
}

function removeLastHomeGoal() {
  if (matchScore.home <= 0) return;
  matchScore.home -= 1;
  if (goalEvents.length) goalEvents.pop();
  renderMatchScore();
  renderPlaytimeRoster();
  renderPlayerManager();
  saveCurrentMatchState();
}

function resetMatchScore() {
  matchScore = { home: 0, away: 0 };
  goalEvents = [];
  renderMatchScore();
}

function placeDefaultOpponents() {
  const pitch = document.getElementById("matchPitch");
  if (!pitch) return;

  pitch.querySelectorAll(".opponent").forEach(x => x.remove());

  matchInitial.opponents.forEach(p =>
    placeToken(
      pitch,
      createToken("player", { name: "Motståndare", indicator: p.indicator, opponent: true }),
      p.x,
      p.y
    )
  );

  updateMatchInfo();
}

function resetFormation() {
  const pitch = document.getElementById("matchPitch");
  if (!pitch) return;

  const slots = new Map(matchInitial.pitchPlayers.map(player => [
    String(player.indicator),
    { x: player.x, y: player.y }
  ]));

  pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)').forEach(el => {
    const slot = slots.get(String(el.dataset.indicator || ""));
    if (!slot) return;
    el.style.left = `${slot.x}%`;
    el.style.top = `${slot.y}%`;
  });

  updateMatchInfo();
}

function resetMatch() {
  const pitch = document.getElementById("matchPitch");
  const bench = document.getElementById("bench");
  pitch.querySelectorAll(".token").forEach(x => x.remove());
  bench.innerHTML = "";

  const placed = new Set();

  matchInitial.pitchPlayers.forEach(p => {
    if (!PLAYERS.includes(p.name) || placed.size >= 5) return;
    placeToken(pitch, createToken("player", {name:p.name, indicator:p.indicator}), p.x, p.y);
    placed.add(p.name);
  });

  PLAYERS.forEach(name => {
    if (!placed.has(name)) addPlayerToBench(name);
  });

  placeToken(pitch, createToken("ball"), matchInitial.ball.x, matchInitial.ball.y);
  updateMatchInfo();
  renderPlayerManager();
}

function wireMatchTools() {
  const pitch = document.getElementById("matchPitch");
  document.getElementById("resetMatchBtn").onclick = () => {
    if (!confirm("Återställ formationen för spelarna som är på planen?")) return;
    resetFormation();
  };
  const placeOppBtn = document.getElementById("placeOppBtn");
  if (placeOppBtn) placeOppBtn.onclick = placeDefaultOpponents;

  document.getElementById("clearOppBtn").onclick = () => {
    pitch.querySelectorAll(".opponent").forEach(x => x.remove());
    updateMatchInfo();
  };
  document.getElementById("homeGoalPlus").onclick = openGoalScorerModal;
  document.getElementById("homeGoalMinus").onclick = removeLastHomeGoal;
  document.getElementById("awayGoalPlus").onclick = () => changeAwayScore(1);
  document.getElementById("awayGoalMinus").onclick = () => changeAwayScore(-1);

  const playtimeHomePlus = document.getElementById("playtimeHomeGoalPlus");
  const playtimeHomeMinus = document.getElementById("playtimeHomeGoalMinus");
  const playtimeAwayPlus = document.getElementById("playtimeAwayGoalPlus");
  const playtimeAwayMinus = document.getElementById("playtimeAwayGoalMinus");
  if (playtimeHomePlus) playtimeHomePlus.onclick = openGoalScorerModal;
  if (playtimeHomeMinus) playtimeHomeMinus.onclick = removeLastHomeGoal;
  if (playtimeAwayPlus) playtimeAwayPlus.onclick = () => changeAwayScore(1);
  if (playtimeAwayMinus) playtimeAwayMinus.onclick = () => changeAwayScore(-1);

  document.getElementById("newMatchBtn").onclick = requestNewMatch;
  document.getElementById("startFirstMatchBtn").onclick = requestNewMatch;

  document.getElementById("closeGoalScorerModal").onclick = closeGoalScorerModal;
  document.querySelectorAll("[data-close-goal-modal]").forEach(el => {
    el.onclick = closeGoalScorerModal;
  });
  document.getElementById("goalWithoutScorer").onclick = () => recordHomeGoal(null);

  renderMatchScore();

  const opponentForm = document.getElementById("newMatchOpponentForm");
  const opponentField = document.getElementById("newMatchOpponentInput");
  if (opponentForm && opponentField) {
    opponentForm.onsubmit = event => {
      event.preventDefault();
      const opponent = opponentField.value.trim();
      if (!opponent) return;
      closeNewMatchOpponentModal();
      beginNewMatch(opponent);
    };
  }

  document.getElementById("closeNewMatchOpponentModal").onclick = closeNewMatchOpponentModal;
  document.querySelectorAll("[data-close-new-match-opponent]").forEach(el => {
    el.onclick = closeNewMatchOpponentModal;
  });

  document.getElementById("cancelNewMatchBtn").onclick = closeOngoingMatchModal;
  document.querySelectorAll("[data-close-ongoing-match]").forEach(el => {
    el.onclick = closeOngoingMatchModal;
  });

  document.getElementById("saveAndNewMatchBtn").onclick = () => {
    saveCurrentMatchBeforeNew();
    closeOngoingMatchModal();
    currentMatchActive = false;
    clearCurrentMatchState();
    openNewMatchOpponentModal();
  };

  document.getElementById("discardAndNewMatchBtn").onclick = () => {
    closeOngoingMatchModal();
    if (stopwatchStartedAt) pauseStopwatch();
    currentMatchActive = false;
    clearCurrentMatchState();
    openNewMatchOpponentModal();
  };
}

function hasCurrentMatchActivity() {
  const totalMs = halfElapsedMs.reduce((sum, ms) => sum + ms, 0) + (stopwatchStartedAt ? Date.now() - stopwatchStartedAt : 0);
  return currentMatchActive && (totalMs > 0 || matchScore.home > 0 || matchScore.away > 0 || goalEvents.length > 0);
}

function closeNewMatchOpponentModal() {
  const modal = document.getElementById("newMatchOpponentModal");
  if (modal) modal.hidden = true;
}

function openNewMatchOpponentModal() {
  const modal = document.getElementById("newMatchOpponentModal");
  const input = document.getElementById("newMatchOpponentInput");
  if (!modal || !input) return;
  input.value = "";
  modal.hidden = false;
  setTimeout(() => input.focus(), 0);
}

function closeOngoingMatchModal() {
  const modal = document.getElementById("ongoingMatchModal");
  if (modal) modal.hidden = true;
}

function requestNewMatch() {
  if (currentMatchActive) {
    const modal = document.getElementById("ongoingMatchModal");
    if (modal) modal.hidden = false;
    return;
  }
  openNewMatchOpponentModal();
}

function beginNewMatch(opponentName) {
  const cleanOpponent = String(opponentName || "").trim();
  if (!cleanOpponent) return;

  if (stopwatchStartedAt) pauseStopwatch();

  currentMatchActive = true;
  selectedPlaytimePlayer = null;
  currentSubstitutionSuggestion = null;
  lastSubstitutionState = null;
  resetMatchScore();
  halfElapsedMs = makePeriodArray();
  currentHalf = 0;

  PLAYERS.forEach(name => {
    playerStats[name] = createEmptyPlayerStats();
  });

  const opponentInput = document.getElementById("opponentName");
  if (opponentInput) opponentInput.value = cleanOpponent;
  updateOpponentLabel();

  clearCurrentMatchState();
  resetMatch();
  updateHalfUI();
  updateStopwatchDisplay();
  renderPlaytimeRoster();
  setMatchActiveUI(true);
  saveCurrentMatchState();
}

function saveCurrentMatchBeforeNew() {
  if (!currentMatchActive) return;
  if (stopwatchStartedAt) onStopwatchTick();

  const opponent = getOpponentName();
  const name = opponent === "Motståndare"
    ? `Match ${matchHistory.length + 1}`
    : `Vaksala SK – ${opponent}`;

  matchHistory.unshift(makeMatchSnapshot(name));
  saveMatchHistory();
  renderHistory();
}

function savePlayers() {
  localStorage.setItem("fotbollstranaren-players", JSON.stringify(PLAYERS));
}

function getPlayerLocation(name) {
  const pitchPlayer = [...document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)')]
    .find(el => el.dataset.name === name);
  if (pitchPlayer) return pitchPlayer.dataset.indicator === "MV" ? "På plan · MV" : "På plan";

  const benchPlayer = [...document.querySelectorAll('#bench .bench-player')]
    .find(el => el.dataset.name === name);
  if (benchPlayer) return "På bänken";

  return "Inte i uppställning";
}

function renderPlayerManager() {
  const root = document.getElementById("playerManagerList");
  const count = document.getElementById("playerCount");
  const substitutionLength = document.getElementById("playerSubstitutionLength");
  if (count) count.textContent = String(PLAYERS.length);
  if (substitutionLength) substitutionLength.textContent = `${matchSettings.substitutionMinutes} min`;
  if (!root) return;

  root.innerHTML = PLAYERS.map(name => {
    const location = getPlayerLocation(name);
    const onPitch = location.startsWith("På plan");
    const statusClass = onPitch ? "on-pitch" : "on-bench";
    const playSeconds = getLivePlayerTotalSeconds(name);
    const keeperSeconds = getLivePlayerKeeperTotalSeconds(name);
    const isGoalkeeper = getPlayerSnapshot(name).role === "MV";
    const stintSeconds = onPitch && !isGoalkeeper ? getLiveStintSeconds(name) : 0;
    const timerState = onPitch && !isGoalkeeper ? getSubstitutionTimerState(stintSeconds) : "";
    const keeperStat = keeperSeconds > 0 ? `<span>Tid som målvakt <strong>${fmtTime(keeperSeconds)}</strong></span>` : "";
    const substitutionStat = onPitch && !isGoalkeeper
      ? `<span class="substitution-clock ${timerState}">Byte <strong>${fmtTime(stintSeconds)} / ${fmtTime(matchSettings.substitutionMinutes * 60)}</strong></span>`
      : "";

    return `
      <div class="player-manager-row">
        <div class="player-manager-main">
          <div class="player-manager-avatar">${name[0]?.toUpperCase() || "?"}</div>
          <div class="player-manager-copy">
            <div class="player-manager-name-row">
              <strong>${name}</strong>
              <span class="lineup-status ${statusClass}">${location}</span>
            </div>
            <div class="player-manager-stats">
              <span>Speltid <strong>${fmtTime(playSeconds)}</strong></span>
              ${keeperStat}
              ${substitutionStat}
            </div>
          </div>
        </div>
        <button class="remove-player-btn" type="button" data-remove-player="${name}">Ta bort</button>
      </div>
    `;
  }).join("");

  root.querySelectorAll("[data-remove-player]").forEach(btn => {
    btn.onclick = () => removePlayer(btn.dataset.removePlayer);
  });
}

function addRosterPlayer(name) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const message = document.getElementById("playerFormMessage");

  if (!cleanName) {
    if (message) message.textContent = "Skriv ett namn.";
    return;
  }

  if (PLAYERS.some(player => player.toLowerCase() === cleanName.toLowerCase())) {
    if (message) message.textContent = "Spelaren finns redan.";
    return;
  }

  PLAYERS.push(cleanName);
  playerStats[cleanName] = createEmptyPlayerStats();
  savePlayers();

  const bench = document.getElementById("bench");
  if (bench) addPlayerToBench(cleanName);

  if (message) message.textContent = `${cleanName} lades till på bänken.`;
  renderPlayerManager();
  updateMatchInfo();
}

function removePlayer(name) {
  if (!PLAYERS.includes(name)) return;

  const wasRunning = Boolean(stopwatchStartedAt);
  if (wasRunning) pauseStopwatch();

  document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach), #bench .bench-player').forEach(el => {
    if (el.dataset.name === name) el.remove();
  });

  PLAYERS = PLAYERS.filter(player => player !== name);
  delete playerStats[name];
  savePlayers();

  renderPlayerManager();
  updateMatchInfo();

  if (wasRunning) startStopwatch();
  saveCurrentMatchState();
}

function initPlayerManager() {
  const form = document.getElementById("addPlayerForm");
  const input = document.getElementById("newPlayerName");

  if (form && input) {
    form.onsubmit = event => {
      event.preventDefault();
      addRosterPlayer(input.value);
      if (PLAYERS.some(player => player.toLowerCase() === input.value.trim().toLowerCase())) {
        input.value = "";
      }
      input.focus();
    };
  }

  renderPlayerManager();
}

function updateMatchPitchAndBenchTimes() {
  document.querySelectorAll('#matchPitch .player-token:not(.opponent):not(.coach)').forEach(el => {
    const time = el.querySelector(".match-player-live-time");
    if (time && el.dataset.name) {
      const stintSeconds = getLiveStintSeconds(el.dataset.name);
      time.textContent = fmtTime(stintSeconds);
      time.classList.toggle("is-over-substitution-time", stintSeconds >= (5 * 60));
    }
  });

  document.querySelectorAll('#bench .bench-player').forEach(el => {
    const time = el.querySelector(".match-bench-live-time");
    const total = el.querySelector(".match-bench-total-time");
    if (time && el.dataset.name) {
      const benchSeconds = getLiveBenchStintSeconds(el.dataset.name);
      time.textContent = `Bänktid ${fmtTime(benchSeconds)}`;
      time.classList.toggle("bench-time-orange", benchSeconds >= (5 * 60) && benchSeconds < (6.5 * 60));
      time.classList.toggle("bench-time-red", benchSeconds >= (6.5 * 60));
    }
    if (total && el.dataset.name) {
      total.textContent = `Totalt ${fmtTime(getLivePlayerTotalSeconds(el.dataset.name))}`;
    }
  });
}

function updatePlayerCardsTimes() {
  renderPlayerManager();
  updateMatchPitchAndBenchTimes();
}

function getLiveHalfElapsedMs(index) {
  return halfElapsedMs[index] + (stopwatchStartedAt && currentHalf === index ? Date.now() - stopwatchStartedAt : 0);
}

function makeMatchSnapshot(name) {
  const halfTimesMs = getPeriodIndexes().map(getLiveHalfElapsedMs);

  return {
    id: `match-${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    halfTimesMs,
    totalMatchMs: halfTimesMs.reduce((sum, ms) => sum + ms, 0),
    matchSettings: { ...matchSettings },
    score: { home: matchScore.home, away: matchScore.away },
    opponentName: getOpponentName(),
    goals: goalEvents.map(event => ({ ...event })),
    players: PLAYERS.map(playerName => ({
      name: playerName,
      goals: getGoalCount(playerName),
      halves: getPeriodIndexes().map(index => getLivePlayerHalfSeconds(playerName, index)),
      benchHalves: getPeriodIndexes().map(index => getLivePlayerBenchHalfSeconds(playerName, index)),
      keeperHalves: getPeriodIndexes().map(index => getLivePlayerKeeperHalfSeconds(playerName, index))
    }))
  };
}

function saveCurrentMatchToHistory() {
  if (!currentMatchActive) {
    alert("Starta en match först.");
    return;
  }
  if (stopwatchStartedAt) onStopwatchTick();

  const opponent = getOpponentName();
  const suggestedName = opponent === "Motståndare"
    ? `Match ${matchHistory.length + 1}`
    : `Vaksala SK – ${opponent}`;
  const enteredName = prompt("Namn på matchen:", suggestedName);
  if (enteredName === null) return;

  const name = enteredName.trim() || suggestedName;
  matchHistory.unshift(makeMatchSnapshot(name));
  saveMatchHistory();
  renderHistory();

  const btn = document.getElementById("saveMatchBtn");
  if (btn) {
    const original = btn.textContent;
    btn.textContent = "Sparad ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  }
}

function removeHistoryMatch(id) {
  const match = matchHistory.find(item => item.id === id);
  if (!match) return;

  if (!confirm(`Ta bort "${match.name}" från historiken?`)) return;

  matchHistory = matchHistory.filter(item => item.id !== id);
  saveMatchHistory();
  renderHistory();
}

function clearHistory() {
  if (matchHistory.length === 0) return;
  if (!confirm("Rensa hela matchhistoriken? Detta går inte att ångra.")) return;

  matchHistory = [];
  saveMatchHistory();
  renderHistory();
}

function renderHistoryPlayerTotals() {
  const root = document.getElementById("historyPlayerTotals");
  if (!root) return;

  if (!matchHistory.length) {
    root.innerHTML = "";
    root.style.display = "none";
    return;
  }

  const totals = new Map();
  matchHistory.forEach(match => {
    (match.players || []).forEach(player => {
      if (!totals.has(player.name)) {
        totals.set(player.name, { name: player.name, matches: 0, play: 0, bench: 0, keeper: 0, goals: 0 });
      }
      const total = totals.get(player.name);
      total.matches += 1;
      total.play += (player.halves || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
      total.bench += (player.benchHalves || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
      total.keeper += (player.keeperHalves || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
      total.goals += Number(player.goals) || 0;
    });
  });

  const rows = [...totals.values()].sort((a,b) => b.play - a.play).map(player => `
    <tr>
      <td data-sort-value="${player.name}"><strong>${player.name}</strong></td>
      <td data-sort-value="${player.matches}">${player.matches}</td>
      <td data-sort-value="${player.play}">${fmtTime(player.play)}</td>
      <td data-sort-value="${player.matches ? player.play / player.matches : 0}">${fmtTime(player.matches ? player.play / player.matches : 0)}</td>
      <td data-sort-value="${player.bench}">${fmtTime(player.bench)}</td>
      <td data-sort-value="${player.keeper}">${fmtTime(player.keeper)}</td>
      <td data-sort-value="${player.goals}">${player.goals}</td>
    </tr>
  `).join("");

  root.style.display = "block";
  root.innerHTML = `
    <details>
      <summary>Spelarstatistik över alla matcher</summary>
      <div class="history-table-wrap history-totals-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th><button type="button" class="history-sort-btn" data-sort-type="text">Spelare <span>↕</span></button></th>
              <th><button type="button" class="history-sort-btn" data-sort-type="number">Matcher <span>↕</span></button></th>
              <th><button type="button" class="history-sort-btn" data-sort-type="number">Speltid <span>↕</span></button></th>
              <th><button type="button" class="history-sort-btn" data-sort-type="number">Snitt <span>↕</span></button></th>
              <th><button type="button" class="history-sort-btn" data-sort-type="number">Bänk <span>↕</span></button></th>
              <th><button type="button" class="history-sort-btn" data-sort-type="number">MV <span>↕</span></button></th>
              <th><button type="button" class="history-sort-btn" data-sort-type="number">Mål <span>↕</span></button></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </details>
  `;
}

function wireHistoryTableSorting(scope = document) {
  const collator = new Intl.Collator("sv", { sensitivity: "base" });

  scope.querySelectorAll(".history-sort-btn").forEach(button => {
    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();

      const table = button.closest("table");
      const header = button.closest("th");
      const body = table?.querySelector("tbody");
      if (!table || !header || !body) return;

      const headers = [...header.parentElement.children];
      const columnIndex = headers.indexOf(header);
      const type = button.dataset.sortType || "text";
      const previousDirection = button.dataset.sortDirection || "";
      const direction = previousDirection === "asc" ? "desc" : "asc";

      table.querySelectorAll(".history-sort-btn").forEach(other => {
        other.dataset.sortDirection = "";
        const icon = other.querySelector("span");
        if (icon) icon.textContent = "↕";
        other.classList.remove("active");
      });

      button.dataset.sortDirection = direction;
      button.classList.add("active");
      const icon = button.querySelector("span");
      if (icon) icon.textContent = direction === "asc" ? "↑" : "↓";

      const rows = [...body.querySelectorAll("tr")];
      rows.sort((a, b) => {
        const aCell = a.children[columnIndex];
        const bCell = b.children[columnIndex];
        const aRaw = aCell?.dataset.sortValue ?? aCell?.textContent.trim() ?? "";
        const bRaw = bCell?.dataset.sortValue ?? bCell?.textContent.trim() ?? "";

        let comparison;
        if (type === "number") {
          comparison = (Number(aRaw) || 0) - (Number(bRaw) || 0);
        } else {
          comparison = collator.compare(aRaw, bRaw);
        }

        return direction === "asc" ? comparison : -comparison;
      });

      rows.forEach(row => body.appendChild(row));
    };
  });
}

function renderHistory() {
  const root = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  if (!root || !empty) return;

  renderHistoryPlayerTotals();
  empty.style.display = matchHistory.length ? "none" : "block";

  root.innerHTML = matchHistory.map(match => {
    const date = new Date(match.savedAt);
    const dateText = Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });

    const playerRows = match.players.map(player => {
      const total = player.halves.reduce((sum, seconds) => sum + seconds, 0);
      const benchTotal = player.benchHalves.reduce((sum, seconds) => sum + seconds, 0);
      const keeperTotal = player.keeperHalves.reduce((sum, seconds) => sum + seconds, 0);

      return `
        <tr>
          <td data-sort-value="${player.name}"><strong>${player.name}</strong></td>
          ${(player.halves || []).map(value => `<td data-sort-value="${Number(value) || 0}">${fmtTime(value)}</td>`).join("")}
          <td data-sort-value="${total}">${fmtTime(total)}</td>
          <td data-sort-value="${benchTotal}">${fmtTime(benchTotal)}</td>
          <td data-sort-value="${keeperTotal}">${fmtTime(keeperTotal)}</td>
          <td data-sort-value="${Number(player.goals) || 0}">${Number(player.goals) || 0}</td>
        </tr>
      `;
    }).join("");

    return `
      <details class="panel history-card">
        <summary class="history-summary">
          <div>
            <strong>${match.name}</strong>
            <span>${dateText}</span>
          </div>
          <div class="history-summary-meta">
            <div class="history-score">${match.score ? `${match.score.home}–${match.score.away}` : "–"}</div>
            <div class="history-summary-time">${fmtTime(match.totalMatchMs / 1000)}</div>
          </div>
        </summary>

        <div class="history-card-content">
          ${match.score ? `
            <div class="history-result">
              <span>Resultat</span>
              <strong>${match.score.home} – ${match.score.away}</strong>
            </div>
          ` : ""}

          <div class="history-half-grid">
            ${(match.halfTimesMs || []).map((value, index) => `<div><span>${(match.matchSettings?.periodCount || match.halfTimesMs.length) === 2 ? "H" : "P"}${index + 1}</span><strong>${fmtTime(value / 1000)}</strong></div>`).join("")}
            <div><span>Totalt</span><strong>${fmtTime(match.totalMatchMs / 1000)}</strong></div>
          </div>

          <div class="history-table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th><button type="button" class="history-sort-btn" data-sort-type="text">Spelare <span>↕</span></button></th>
                  ${Array.from({ length: Math.max(...match.players.map(player => player.halves?.length || 0), match.halfTimesMs?.length || 0) }, (_, index) => `<th><button type="button" class="history-sort-btn" data-sort-type="number">${(match.matchSettings?.periodCount || match.halfTimesMs?.length) === 2 ? "H" : "P"}${index + 1} <span>↕</span></button></th>`).join("")}
                  <th><button type="button" class="history-sort-btn" data-sort-type="number">Totalt <span>↕</span></button></th>
                  <th><button type="button" class="history-sort-btn" data-sort-type="number">Bänk <span>↕</span></button></th>
                  <th><button type="button" class="history-sort-btn" data-sort-type="number">MV <span>↕</span></button></th>
                  <th><button type="button" class="history-sort-btn" data-sort-type="number">Mål <span>↕</span></button></th>
                </tr>
              </thead>
              <tbody>${playerRows}</tbody>
            </table>
          </div>

          <div class="history-actions">
            <button type="button" class="danger-btn compact-btn" data-delete-history="${match.id}">Ta bort match</button>
          </div>
        </div>
      </details>
    `;
  }).join("");

  wireHistoryTableSorting(document.getElementById("history"));
  
  root.querySelectorAll("[data-delete-history]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      removeHistoryMatch(btn.dataset.deleteHistory);
    };
  });
}

function exportAppData() {
  saveCurrentMatchState();

  const payload = {
    app: "Fotbollstränaren",
    exportedAt: new Date().toISOString(),
    version: APP_VERSION,
    players: PLAYERS,
    exercises,
    matchHistory,
    matchSettings,
    currentMatch: JSON.parse(localStorage.getItem(CURRENT_MATCH_KEY) || "null")
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fotbollstranaren-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importAppData(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || ""));
      if (!Array.isArray(data.players) || !data.exercises || !Array.isArray(data.matchHistory)) {
        throw new Error("Ogiltig backup");
      }

      if (!confirm("Importera denna backup? Nuvarande spelare, övningar, historik och pågående match ersätts.")) return;

      localStorage.setItem("fotbollstranaren-players", JSON.stringify(data.players));
      localStorage.setItem("fotbollstranaren-exercises", JSON.stringify(data.exercises));
      localStorage.setItem("fotbollstranaren-match-history", JSON.stringify(data.matchHistory));
      if (data.matchSettings) localStorage.setItem(MATCH_SETTINGS_KEY, JSON.stringify(data.matchSettings));
      if (data.currentMatch) {
        localStorage.setItem(CURRENT_MATCH_KEY, JSON.stringify(data.currentMatch));
      } else {
        localStorage.removeItem(CURRENT_MATCH_KEY);
      }
      location.reload();
    } catch {
      alert("Backupfilen kunde inte läsas.");
    }
  };
  reader.readAsText(file);
}

function initDataTools() {
  const exportBtn = document.getElementById("exportDataBtn");
  const importBtn = document.getElementById("importDataBtn");
  const fileInput = document.getElementById("importDataFile");

  if (exportBtn) exportBtn.onclick = exportAppData;
  if (importBtn && fileInput) {
    importBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      importAppData(fileInput.files?.[0]);
      fileInput.value = "";
    };
  }
}

function initHistory() {
  const saveBtn = document.getElementById("saveMatchBtn");
  const clearBtn = document.getElementById("clearHistoryBtn");

  if (saveBtn) saveBtn.onclick = saveCurrentMatchToHistory;
  if (clearBtn) clearBtn.onclick = clearHistory;

  renderHistory();
}

function setTrainingCategory() {
  document.querySelectorAll(".subtab").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    currentExerciseIndex = 0;
    renderExerciseList();
    loadExercise();
  }));
}

function renumberTrainingPlayers() {
  const pitch = document.getElementById("exercisePitch");
  const players = [...pitch.querySelectorAll('.player-token:not(.coach)')];

  players.forEach((el, index) => {
    el.dataset.trainingNumber = String(index + 1);
    el.textContent = String(index + 1);
  });
}

function renderExerciseList() {
  const root = document.getElementById("exerciseList");
  root.innerHTML = "";

  const categoryExercises = exercises[currentCategory] || [];

  categoryExercises.forEach((ex, idx) => {
    const row = document.createElement("div");
    row.className = "exercise-list-row";

    const btn = document.createElement("button");
    btn.className = "exercise-item" + (idx === currentExerciseIndex ? " active" : "");
    btn.textContent = ex.title;
    btn.onclick = () => {
      currentExerciseIndex = idx;
      renderExerciseList();
      loadExercise();
    };

    const removeBtn = document.createElement("button");
    removeBtn.className = "exercise-remove-btn";
    removeBtn.type = "button";
    removeBtn.title = "Ta bort övning";
    removeBtn.textContent = "×";
    removeBtn.onclick = event => {
      event.stopPropagation();
      removeExercise(idx);
    };

    row.appendChild(btn);
    row.appendChild(removeBtn);
    root.appendChild(row);
  });

  if (categoryExercises.length === 0) {
    const empty = document.createElement("div");
    empty.className = "exercise-empty";
    empty.textContent = "Inga övningar ännu.";
    root.appendChild(empty);
  }
}

function loadExercise() {
  const categoryExercises = exercises[currentCategory] || [];
  const ex = categoryExercises[currentExerciseIndex];
  const pitch = document.getElementById("exercisePitch");

  pitch.querySelectorAll(".token").forEach(x => x.remove());

  if (!ex) {
    document.getElementById("exerciseTitle").textContent = "Ingen övning vald";
    document.getElementById("exerciseDescription").textContent = "Lägg till en ny övning för att börja.";
    return;
  }

  document.getElementById("exerciseTitle").textContent = ex.title;
  document.getElementById("exerciseDescription").textContent = ex.description || "";

  ex.items.forEach(item => {
    const token = createToken(item.type, {name:item.name});
    placeToken(pitch, token, item.x, item.y);
  });

  renumberTrainingPlayers();
}

function addExercise() {
  const title = prompt("Namn på den nya övningen:");
  if (title === null) return;

  const cleanTitle = title.trim() || "Ny övning";
  const categoryExercises = exercises[currentCategory] || (exercises[currentCategory] = []);

  categoryExercises.push({
    id: `custom-${Date.now()}`,
    title: cleanTitle,
    description: "",
    items: [
      {type:"ball", x:50, y:50}
    ]
  });

  currentExerciseIndex = categoryExercises.length - 1;
  saveExercises();
  renderExerciseList();
  loadExercise();
}

function removeExercise(index) {
  const categoryExercises = exercises[currentCategory] || [];
  const exercise = categoryExercises[index];
  if (!exercise) return;

  if (!confirm(`Ta bort övningen "${exercise.title}"?`)) return;

  categoryExercises.splice(index, 1);
  saveExercises();

  if (currentExerciseIndex >= categoryExercises.length) {
    currentExerciseIndex = Math.max(0, categoryExercises.length - 1);
  } else if (index < currentExerciseIndex) {
    currentExerciseIndex -= 1;
  }

  renderExerciseList();
  loadExercise();
}

function wireTrainingTools() {
  const pitch = document.getElementById("exercisePitch");

  document.getElementById("addExerciseBtn").onclick = addExercise;
  document.getElementById("resetExerciseBtn").onclick = () => {
    if (!confirm("Återställ övningen till sitt ursprungliga läge?")) return;
    loadExercise();
  };

  document.getElementById("exAddPlayer").onclick = () => {
    placeToken(pitch, createToken("player", {name:"Spelare"}), 50, 70);
    renumberTrainingPlayers();
  };
  document.getElementById("exAddBall").onclick = () => placeToken(pitch, createToken("ball"), 50, 50);
  document.getElementById("exAddCone").onclick = () => placeToken(pitch, createToken("cone"), 50, 50);
  document.getElementById("exAddCoach").onclick = () => placeToken(pitch, createToken("coach", {name:"Tränare"}), 50, 50);
}

function initSplash() {
  const splash = document.getElementById("appSplash");
  if (!splash) return;

  const removeSplash = () => {
    splash.classList.add("is-finished");
    setTimeout(() => splash.remove(), 350);
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(removeSplash, prefersReducedMotion ? 250 : 1800);
}

function initTheme() {
  document.body.dataset.theme = "dark";
}

function getCurrentHalfElapsedMs() {
  return (halfElapsedMs[currentHalf] || 0) + (stopwatchStartedAt ? (Date.now() - stopwatchStartedAt) : 0);
}

function getTotalElapsedMs() {
  return getPeriodIndexes().reduce((sum, index) => sum + getLiveHalfElapsedMs(index), 0);
}

function fmtDetailedTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}

function renderHalfTabs() {
  ["halfTabs", "matchBottomHalfTabs"].forEach(rootId => {
    const root = document.getElementById(rootId);
    if (!root) return;

    root.innerHTML = getPeriodIndexes().map(index =>
      `<button class="half-btn${index === currentHalf ? " active" : ""}" data-half="${index}">${index + 1}</button>`
    ).join("");

    root.querySelectorAll(".half-btn").forEach(btn => {
      btn.onclick = () => switchHalf(Number(btn.dataset.half));
    });
  });
}

function updateHalfUI() {
  const word = getPeriodLabelWord();
  const label = document.getElementById("halfLabel");
  if (label) label.textContent = `${word} ${currentHalf + 1} av ${matchSettings.periodCount}`;

  ["matchBannerPeriod", "playtimeBannerPeriod"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = `${word} ${currentHalf + 1}`;
  });

  const unit = matchSettings.periodCount === 2 ? "halvlekar" : "perioder";
  ["matchBannerLength", "playtimeBannerLength"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <span>Matchtid: ${matchSettings.totalMinutes} min</span>
        <span>${matchSettings.periodCount} ${unit} × ${fmtDetailedTime(getPeriodTargetMs())}</span>
      `;
    }
  });

  const timerLabel = document.getElementById("stopwatchPeriodLabel");
  if (timerLabel) timerLabel.textContent = `Tid i vald ${word.toLowerCase()}`;

  const halfColumn = document.getElementById("lineupHalfColumn");
  if (halfColumn) halfColumn.textContent = `${word === "Halvlek" ? "H" : "P"}${currentHalf + 1}`;

  const plan = document.getElementById("matchTimePlan");
  if (plan) {
    plan.innerHTML = `
      <span>${matchSettings.totalMinutes} min totalt</span>
      <strong>${matchSettings.periodCount} × ${fmtDetailedTime(getPeriodTargetMs())}</strong>
    `;
  }

  renderHalfTabs();
}

function updateStopwatchDisplay() {
  const elapsed = getCurrentHalfElapsedMs();
  const target = getPeriodTargetMs();
  const display = document.getElementById("stopwatchDisplay");
  const overtime = document.getElementById("overtimeDisplay");

  if (display) display.textContent = fmtDetailedTime(Math.min(elapsed, target));

  // The visible match clock follows the current half/period, not total match time.
  // It freezes at the configured half length and shows any extra time separately.
  ["matchBannerTime", "playtimeBannerTime"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmtDetailedTime(Math.min(elapsed, target));
  });

  const periodOvertime = Math.max(0, elapsed - target);
  ["matchBannerOvertime", "playtimeBannerOvertime"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = periodOvertime > 0 ? `+${fmtDetailedTime(periodOvertime)}` : "";
      el.classList.toggle("active", periodOvertime > 0);
    }
  });

  if (overtime) {
    overtime.textContent = periodOvertime > 0 ? `+${fmtDetailedTime(periodOvertime)}` : "";
    overtime.classList.toggle("active", periodOvertime > 0);
  }
}

function onStopwatchTick() {
  const now = Date.now();
  const maxTotalMs = getMatchTargetMs() + (5 * 60 * 1000);

  if (getTotalElapsedMs() >= maxTotalMs) {
    pauseStopwatch();
    return;
  }

  const deltaSeconds = stopwatchLastTick ? (now - stopwatchLastTick) / 1000 : 0;
  stopwatchLastTick = now;
  tickPlayerStats(deltaSeconds);
  updateStopwatchDisplay();
  updatePlaytimeStats();
  updatePlayerCardsTimes();
  renderStatistics();
}

function setStopwatchControlState(isRunning) {
  const hiddenToggle = document.getElementById("stopwatchToggle");
  if (hiddenToggle) hiddenToggle.textContent = isRunning ? "Pausa" : "Starta";

  ["matchClockToggle", "playtimeMatchClockToggle"].forEach(id => {
    const button = document.getElementById(id);
    if (!button) return;
    button.textContent = isRunning ? "⏸" : "▶";
    button.setAttribute("aria-label", isRunning ? "Pausa matchklockan" : "Starta matchklockan");
    button.title = isRunning ? "Pausa matchklockan" : "Starta matchklockan";
  });
}

function toggleStopwatch() {
  if (stopwatchStartedAt) pauseStopwatch();
  else startStopwatch();
}

function resumeRunningStopwatch() {
  if (!stopwatchStartedAt || stopwatchTimerId) return;

  stopwatchTimerId = setInterval(onStopwatchTick, 250);
  setStopwatchControlState(true);
  onStopwatchTick();
}

function startStopwatch() {
  if (stopwatchStartedAt) {
    resumeRunningStopwatch();
    return;
  }
  if (getTotalElapsedMs() >= getMatchTargetMs() + (5 * 60 * 1000)) {
    alert("Maximal övertid på 5 minuter är uppnådd.");
    return;
  }
  stopwatchStartedAt = Date.now();
  stopwatchLastTick = stopwatchStartedAt;
  stopwatchTimerId = setInterval(onStopwatchTick, 250);
  setStopwatchControlState(true);
  updateStopwatchDisplay();
  saveCurrentMatchState();
}

function pauseStopwatch() {
  if (!stopwatchStartedAt) return;
  const now = Date.now();
  const deltaSinceTick = stopwatchLastTick ? (now - stopwatchLastTick) / 1000 : 0;
  if (deltaSinceTick > 0) tickPlayerStats(deltaSinceTick);
  halfElapsedMs[currentHalf] = (halfElapsedMs[currentHalf] || 0) + (now - stopwatchStartedAt);
  stopwatchStartedAt = null;
  stopwatchLastTick = null;
  clearInterval(stopwatchTimerId);
  stopwatchTimerId = null;
  setStopwatchControlState(false);
  updateStopwatchDisplay();
  updatePlaytimeStats();
  saveCurrentMatchState();
}

function switchHalf(nextHalf) {
  if (nextHalf < 0 || nextHalf >= matchSettings.periodCount || nextHalf === currentHalf) return;

  // Switching to another half/period always pauses the match clock.
  if (stopwatchStartedAt) pauseStopwatch();

  currentHalf = nextHalf;
  updateHalfUI();
  updateStopwatchDisplay();
  renderLineupPanel();
  updatePlaytimeStats();
  saveCurrentMatchState();
}

function resetCurrentHalf() {
  const wasRunning = Boolean(stopwatchStartedAt);
  if (wasRunning) pauseStopwatch();

  halfElapsedMs[currentHalf] = 0;
  PLAYERS.forEach(name => {
    playerStats[name].halves[currentHalf] = 0;
    playerStats[name].benchHalves[currentHalf] = 0;
    playerStats[name].keeperHalves[currentHalf] = 0;
  });

  updateStopwatchDisplay();
  updatePlaytimeStats();
  updatePlayerCardsTimes();

  if (wasRunning) startStopwatch();
}

function resetAllMatchTimeAndStats() {
  if (stopwatchStartedAt) pauseStopwatch();
  halfElapsedMs = makePeriodArray();
  currentHalf = 0;
  resetPlayerStats();
  updateHalfUI();
  updateStopwatchDisplay();
  updatePlayerCardsTimes();
}

function resetWholeCurrentMatch() {
  if (stopwatchStartedAt) pauseStopwatch();

  selectedPlaytimePlayer = null;
  currentSubstitutionSuggestion = null;
  halfElapsedMs = makePeriodArray();
  currentHalf = 0;
  resetMatchScore();

  PLAYERS.forEach(name => {
    playerStats[name] = createEmptyPlayerStats();
  });

  updateHalfUI();
  updateStopwatchDisplay();
  renderPlaytimeRoster();
  renderPlayerManager();
  renderMatchScore();
  saveCurrentMatchState();
}

function applyMatchSettings(nextSettings) {
  const nextPeriodCount = Math.max(1, Math.min(6, Number(nextSettings.periodCount) || 2));
  const nextTotalMinutes = Math.max(5, Math.min(180, Number(nextSettings.totalMinutes) || 30));
  const nextSubstitutionMinutes = Math.max(1, Math.min(30, Number(nextSettings.substitutionMinutes ?? matchSettings.substitutionMinutes) || 5));

  if (stopwatchStartedAt) pauseStopwatch();

  const periodCountChanged = nextPeriodCount !== matchSettings.periodCount;
  matchSettings = { periodCount: nextPeriodCount, totalMinutes: nextTotalMinutes, substitutionMinutes: nextSubstitutionMinutes };
  saveMatchSettings();

  if (periodCountChanged) {
    halfElapsedMs = normalizePeriodArray(halfElapsedMs);
    currentHalf = Math.min(currentHalf, matchSettings.periodCount - 1);
    PLAYERS.forEach(name => {
      playerStats[name].halves = normalizePeriodArray(playerStats[name].halves);
      playerStats[name].benchHalves = normalizePeriodArray(playerStats[name].benchHalves);
      playerStats[name].keeperHalves = normalizePeriodArray(playerStats[name].keeperHalves);
    });
  }

  updateSettingsUI();
  updateHalfUI();
  updateStopwatchDisplay();
  renderPlaytimeRoster();
  saveCurrentMatchState();
}

function updateSettingsUI() {
  const countValue = document.getElementById("periodCountValue");
  const minus = document.getElementById("periodCountMinus");
  const plus = document.getElementById("periodCountPlus");
  const minutes = document.getElementById("matchMinutesSetting");
  const summary = document.getElementById("periodLengthSummary");
  const substitution = document.getElementById("substitutionMinutesSetting");

  if (countValue) countValue.textContent = String(matchSettings.periodCount);
  if (minus) minus.disabled = matchSettings.periodCount <= 1;
  if (plus) plus.disabled = matchSettings.periodCount >= 6;
  if (minutes) minutes.value = String(matchSettings.totalMinutes);
  if (substitution) substitution.value = String(matchSettings.substitutionMinutes);
  if (summary) summary.textContent = fmtDetailedTime(getPeriodTargetMs());
  renderPlayerManager();
}

function initSettings() {
  const minus = document.getElementById("periodCountMinus");
  const plus = document.getElementById("periodCountPlus");
  const minutes = document.getElementById("matchMinutesSetting");
  const substitution = document.getElementById("substitutionMinutesSetting");

  if (minus) {
    minus.onclick = () => applyMatchSettings({
      periodCount: matchSettings.periodCount - 1,
      totalMinutes: matchSettings.totalMinutes,
      substitutionMinutes: matchSettings.substitutionMinutes
    });
  }

  if (plus) {
    plus.onclick = () => applyMatchSettings({
      periodCount: matchSettings.periodCount + 1,
      totalMinutes: matchSettings.totalMinutes,
      substitutionMinutes: matchSettings.substitutionMinutes
    });
  }

  if (minutes) {
    const saveMinutes = () => applyMatchSettings({ periodCount: matchSettings.periodCount, totalMinutes: minutes.value, substitutionMinutes: matchSettings.substitutionMinutes });
    minutes.onchange = saveMinutes;
    minutes.onblur = saveMinutes;
  }
  if (substitution) {
    const saveSubstitution = () => applyMatchSettings({ periodCount: matchSettings.periodCount, totalMinutes: matchSettings.totalMinutes, substitutionMinutes: substitution.value });
    substitution.onchange = saveSubstitution;
    substitution.onblur = saveSubstitution;
  }

  const testVibrationBtn = document.getElementById("testVibrationBtn");
  const vibrationTestStatus = document.getElementById("vibrationTestStatus");
  if (testVibrationBtn) {
    testVibrationBtn.onclick = async () => {
      testVibrationBtn.disabled = true;
      if (vibrationTestStatus) {
        vibrationTestStatus.textContent = "Testar vibration…";
        vibrationTestStatus.classList.remove("is-error");
      }

      const result = await triggerSubstitutionVibration();

      if (vibrationTestStatus) {
        if (result.ok && result.mode === "native") {
          vibrationTestStatus.textContent = "Native vibration skickad via Capacitor Haptics.";
        } else if (result.ok) {
          vibrationTestStatus.textContent = "Webbvibration skickad.";
        } else {
          vibrationTestStatus.textContent = "Ingen vibrationsfunktion tillgänglig. Installera/synca Capacitor Haptics.";
          vibrationTestStatus.classList.add("is-error");
        }
      }

      setTimeout(() => {
        testVibrationBtn.disabled = false;
      }, 600);
    };
  }

  updateSettingsUI();
}

function initStopwatch() {
  const hiddenToggle = document.getElementById("stopwatchToggle");
  if (hiddenToggle) hiddenToggle.onclick = toggleStopwatch;

  ["matchClockToggle", "playtimeMatchClockToggle"].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.onclick = toggleStopwatch;
  });

  document.getElementById("stopwatchReset").onclick = () => {
    const word = getPeriodLabelWord().toLowerCase();
    if (!confirm(`Nollställ tiden och statistiken för aktuell ${word}?`)) return;
    resetCurrentHalf();
  };

  const undoSubstitutionBtn = document.getElementById("undoSubstitutionBtn");
  if (undoSubstitutionBtn) undoSubstitutionBtn.onclick = undoLastSubstitution;
  updateUndoSubstitutionButton();

  const resetWholeMatchBtn = document.getElementById("resetWholeMatchBtn");
  if (resetWholeMatchBtn) {
    resetWholeMatchBtn.onclick = () => {
      if (!confirm("Nollställ hela matchens tid, resultat, mål och spelarstatistik? Uppställningen och motståndarlaget behålls.")) return;
      resetWholeCurrentMatch();
    };
  }

  document.getElementById("clearPlaytimeSelection").onclick = clearPlaytimePlayerSelection;
  setStopwatchControlState(Boolean(stopwatchStartedAt));
  updateHalfUI();
  updateStopwatchDisplay();
  renderLineupPanel();
  updatePlaytimeStats();
}

document.getElementById("resetAllBtn").onclick = () => {
  if (!confirm("Återställ spelare, övningar och aktuell match till standard? Historiken sparas.")) return;
  selectedPlaytimePlayer = null;
  resetMatchScore();
  clearCurrentMatchState();
  PLAYERS = [...DEFAULT_PLAYERS];
  Object.keys(playerStats).forEach(name => delete playerStats[name]);
  PLAYERS.forEach(name => playerStats[name] = createEmptyPlayerStats());
  savePlayers();

  exercises = cloneExercises(DEFAULT_EXERCISES);
  saveExercises();

  matchSettings = { ...DEFAULT_MATCH_SETTINGS };
  saveMatchSettings();

  resetMatch();
  currentCategory = "passing";
  currentExerciseIndex = 0;
  document.querySelectorAll(".subtab").forEach((b,i) => b.classList.toggle("active", i===0));
  renderExerciseList();
  loadExercise();
  resetAllMatchTimeAndStats();
  currentMatchActive = false;
  setMatchActiveUI(false);
  clearCurrentMatchState();
  renderPlayerManager();
};

function initVersionTracker() {
  const text = document.getElementById("versionText");
  if (text) text.textContent = `Version ${APP_VERSION}`;
}

initSplash();
initTheme();
setTabs();
setTrainingCategory();
wireMatchTools();
wireTrainingTools();
initStopwatch();
initPlayerManager();
initHistory();
initDataTools();
initSettings();
renderExerciseList();
loadExercise();

autoSaveReady = false;
if (!restoreCurrentMatchState()) {
  currentMatchActive = false;
  resetMatch();
  setMatchActiveUI(false);
}
autoSaveReady = true;
if (currentMatchActive) {
  if (stopwatchStartedAt) resumeRunningStopwatch();
  saveCurrentMatchState();
}

document.addEventListener("visibilitychange", () => {
  if (stopwatchStartedAt) {
    if (!document.hidden) {
      resumeRunningStopwatch();
      onStopwatchTick();
    } else {
      onStopwatchTick();
    }
  }
  saveCurrentMatchState();
});

window.addEventListener("pageshow", () => {
  if (stopwatchStartedAt) {
    resumeRunningStopwatch();
    onStopwatchTick();
  }
});

window.addEventListener("beforeunload", () => {
  if (stopwatchStartedAt) onStopwatchTick();
  saveCurrentMatchState();
});

initVersionTracker();
