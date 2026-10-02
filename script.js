const APP_VERSION = "v0.9.1";

const DEFAULT_PLAYERS = ["Liam","Frans","Finn","Charles","Erik","Ian","Endrit","John"];
let PLAYERS = JSON.parse(localStorage.getItem("fotbollstranaren-players") || "null") || [...DEFAULT_PLAYERS];
const ROLE_ORDER = {"1":1,"2":2,"3":3,"4":4,"MV":5};
const playerStats = {};

function createEmptyPlayerStats() {
  return {
    halves: [0, 0, 0],
    benchHalves: [0, 0, 0],
    keeperHalves: [0, 0, 0]
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
      {type:"coach", name:"Tränare", x:50, y:78}, {type:"ball", x:50, y:62}, {type:"player", name:"Liam", x:50, y:48}, {type:"player", name:"Ian", x:50, y:12}
    ]},
    { id: "coneshoot", title: "Dribbla mellan konor + skott", description: "Dribbla mellan konorna och avsluta mot mål.", items: [
      {type:"player", name:"Liam", x:50, y:82}, {type:"ball", x:50, y:74}, {type:"cone", x:43, y:63}, {type:"cone", x:57, y:53}, {type:"cone", x:43, y:43}, {type:"cone", x:57, y:33}, {type:"player", name:"Ian", x:50, y:12}
    ]},
    { id: "twogoals", title: "Vänster eller höger", description: "Tränaren ropar vänster eller höger. Spelaren ska snabbt välja sida och avsluta.", items: [
      {type:"player", name:"Liam", x:50, y:72}, {type:"ball", x:50, y:62}, {type:"cone", x:25, y:20}, {type:"cone", x:75, y:20}
    ]},
    { id: "wallshot", title: "Skott efter väggpass", description: "Passa tränaren, få tillbaka bollen i fart och avsluta.", items: [
      {type:"player", name:"Liam", x:25, y:70}, {type:"coach", name:"Tränare", x:50, y:52}, {type:"ball", x:35, y:64}, {type:"player", name:"Ian", x:50, y:12}
    ]},
    { id: "onevone", title: "1 mot 1 mot målvakt", description: "Tränaren spelar fram bollen. Spelaren driver mot mål och försöker avsluta.", items: [
      {type:"coach", name:"Tränare", x:50, y:80}, {type:"ball", x:50, y:66}, {type:"player", name:"Liam", x:50, y:55}, {type:"player", name:"Ian", x:50, y:12}
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
const halfElapsedMs = [0, 0, 0];
let stopwatchStartedAt = null;
let stopwatchTimerId = null;
let stopwatchLastTick = null;
let selectedPlaytimePlayer = null;
let matchScore = { home: 0, away: 0 };

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
  return (playerStats[name]?.halves || [0, 0, 0]).reduce((sum, seconds) => sum + seconds, 0);
}

function setTabs() {
  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "playtime") {
      renderPlaytimeRoster();
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
      el.innerHTML = `<span class="match-indicator">${opts.indicator}</span>${opts.opponent ? "" : `<span class="match-player-name">${opts.name || "Spelare"}</span>`}`;
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
  el.innerHTML = `<span class="match-indicator">${indicator}</span><span class="match-player-name">${name}</span>`;
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

    const restoreToOrigin = () => {
      clearSwapTarget();
      el.classList.remove("dragging", "dragging-floating", "bench-drag-preview");
      el.style.width = "";
      el.style.height = "";
      originParent.appendChild(el);
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
          swapTarget.remove();
          addPlayerToBench(targetName);
          setMatchPlayerIndicator(el, indicator, el.dataset.name);
          matchPitch.appendChild(el);
          el.classList.remove("bench-player");
          el.style.left = targetLeft;
          el.style.top = targetTop;
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
          setMatchPlayerIndicator(el, indicator, el.dataset.name);
          placeFromPointer(matchPitch, el, ev.clientX, ev.clientY);
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

  const benchPlayers = [...bench.querySelectorAll('.bench-player')];
  if (count) count.textContent = `${benchPlayers.length} på bänken`;

  benchPlayers.forEach(el => {
    el.innerHTML = `
      <div class="match-bench-player-info">
        <strong>${el.dataset.name}</strong>
        <span class="lineup-status on-bench">På bänken</span>
      </div>
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

  const snapshots = PLAYERS.map(name => {
    const snapshot = getPlayerSnapshot(name);
    return {
      ...snapshot,
      halfTime: getLivePlayerHalfSeconds(name, currentHalf),
      totalTime: getLivePlayerTotalSeconds(name),
      benchHalfTime: getLivePlayerBenchHalfSeconds(name, currentHalf)
    };
  }).sort((a, b) => {
    if (a.location !== b.location) return a.location === "pitch" ? -1 : 1;
    if (a.location === "pitch") return (ROLE_ORDER[a.role] || 99) - (ROLE_ORDER[b.role] || 99);
    return a.halfTime - b.halfTime;
  });

  root.innerHTML = snapshots.map(player => {
    const selected = player.name === selectedPlaytimePlayer ? " selected" : "";
    const status = player.location === "pitch" ? "På plan" : "På bänken";
    const statusClass = player.location === "pitch" ? "on-pitch" : "on-bench";
    const role = player.role
      ? `<span class="lineup-role ${player.role === "MV" ? "goalkeeper-role" : ""}">${player.role === "MV" ? "Målvakt" : player.role}</span>`
      : "";
    const benchInfo = player.location === "bench"
      ? `<span class="playtime-bench-detail">${fmtTime(player.benchHalfTime)} på bänk</span>`
      : "";

    return `
      <button type="button" class="playtime-player-row${selected}" data-playtime-player="${player.name}">
        <div class="playtime-player-main">
          <div class="playtime-player-name">${role}<strong>${player.name}</strong></div>
          <div class="lineup-status-row">
            <span class="lineup-status ${statusClass}">${status}</span>
            ${benchInfo}
          </div>
        </div>
        <div class="lineup-time">${fmtTime(player.halfTime)}</div>
        <div class="lineup-time">${fmtTime(player.totalTime)}</div>
      </button>
    `;
  }).join("");

  root.querySelectorAll("[data-playtime-player]").forEach(btn => {
    btn.onclick = () => handlePlaytimePlayerClick(btn.dataset.playtimePlayer);
  });
}

function clearPlaytimePlayerSelection() {
  selectedPlaytimePlayer = null;
  renderPlaytimeRoster();
}

function swapPlayersByClick(firstName, secondName) {
  const first = getPlayerSnapshot(firstName);
  const second = getPlayerSnapshot(secondName);

  if (!first.element || !second.element) return false;

  if (first.location === "pitch" && second.location === "bench") {
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
      if (name === keeperName) stats.keeperHalves[currentHalf] += deltaSeconds;
    } else {
      stats.benchHalves[currentHalf] += deltaSeconds;
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
  return [0, 1, 2].reduce((sum, halfIndex) => sum + getLivePlayerHalfSeconds(name, halfIndex), 0);
}

function getLivePlayerBenchTotalSeconds(name) {
  return [0, 1, 2].reduce((sum, halfIndex) => sum + getLivePlayerBenchHalfSeconds(name, halfIndex), 0);
}

function getLivePlayerKeeperTotalSeconds(name) {
  return [0, 1, 2].reduce((sum, halfIndex) => sum + getLivePlayerKeeperHalfSeconds(name, halfIndex), 0);
}

function getSortedPlayerStats(sortMode = "total") {
  const activeNames = new Set(getActivePlayerNames());

  return PLAYERS.map((name, originalIndex) => ({
    name,
    originalIndex,
    active: activeNames.has(name),
    halves: [0, 1, 2].map(halfIndex => getLivePlayerHalfSeconds(name, halfIndex)),
    benchHalves: [0, 1, 2].map(halfIndex => getLivePlayerBenchHalfSeconds(name, halfIndex)),
    keeperHalves: [0, 1, 2].map(halfIndex => getLivePlayerKeeperHalfSeconds(name, halfIndex)),
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
}

function renderStatistics() {}

function updateMatchInfo() {
  renderLineupPanel();
  renderPlayerManager();
}

function resetPlayerStats() {
  PLAYERS.forEach(name => {
    playerStats[name].halves = [0, 0, 0];
    playerStats[name].benchHalves = [0, 0, 0];
    playerStats[name].keeperHalves = [0, 0, 0];
  });
  updatePlaytimeStats();
}

function renderMatchScore() {
  const home = document.getElementById("homeScore");
  const away = document.getElementById("awayScore");
  if (home) home.textContent = String(matchScore.home);
  if (away) away.textContent = String(matchScore.away);

  const homeMinus = document.getElementById("homeGoalMinus");
  const awayMinus = document.getElementById("awayGoalMinus");
  if (homeMinus) homeMinus.disabled = matchScore.home <= 0;
  if (awayMinus) awayMinus.disabled = matchScore.away <= 0;
}

function changeMatchScore(side, delta) {
  if (!["home", "away"].includes(side)) return;
  matchScore[side] = Math.max(0, matchScore[side] + delta);
  renderMatchScore();
}

function resetMatchScore() {
  matchScore = { home: 0, away: 0 };
  renderMatchScore();
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

  matchInitial.opponents.forEach(p =>
    placeToken(pitch, createToken("player", {name:"Motståndare", indicator:p.indicator, opponent:true}), p.x, p.y)
  );

  placeToken(pitch, createToken("ball"), matchInitial.ball.x, matchInitial.ball.y);
  updateMatchInfo();
  renderPlayerManager();
}

function wireMatchTools() {
  const pitch = document.getElementById("matchPitch");
  document.getElementById("resetMatchBtn").onclick = resetMatch;
  document.getElementById("clearOppBtn").onclick = () => { pitch.querySelectorAll(".opponent").forEach(x => x.remove()); updateMatchInfo(); };
  document.getElementById("homeGoalPlus").onclick = () => changeMatchScore("home", 1);
  document.getElementById("homeGoalMinus").onclick = () => changeMatchScore("home", -1);
  document.getElementById("awayGoalPlus").onclick = () => changeMatchScore("away", 1);
  document.getElementById("awayGoalMinus").onclick = () => changeMatchScore("away", -1);
  renderMatchScore();
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
  if (count) count.textContent = String(PLAYERS.length);
  if (!root) return;

  root.innerHTML = PLAYERS.map(name => {
    const location = getPlayerLocation(name);
    const statusClass = location.startsWith("På plan") ? "on-pitch" : "on-bench";

    return `
      <div class="player-manager-row">
        <div class="player-manager-main">
          <div class="player-manager-avatar">${name[0]?.toUpperCase() || "?"}</div>
          <div>
            <strong>${name}</strong>
            <span class="lineup-status ${statusClass}">${location}</span>
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

function updatePlayerCardsTimes() {
  renderPlayerManager();
}

function getLiveHalfElapsedMs(index) {
  return halfElapsedMs[index] + (stopwatchStartedAt && currentHalf === index ? Date.now() - stopwatchStartedAt : 0);
}

function makeMatchSnapshot(name) {
  const halfTimesMs = [0, 1, 2].map(getLiveHalfElapsedMs);

  return {
    id: `match-${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    halfTimesMs,
    totalMatchMs: halfTimesMs.reduce((sum, ms) => sum + ms, 0),
    score: { home: matchScore.home, away: matchScore.away },
    players: PLAYERS.map(playerName => ({
      name: playerName,
      halves: [0, 1, 2].map(index => getLivePlayerHalfSeconds(playerName, index)),
      benchHalves: [0, 1, 2].map(index => getLivePlayerBenchHalfSeconds(playerName, index)),
      keeperHalves: [0, 1, 2].map(index => getLivePlayerKeeperHalfSeconds(playerName, index))
    }))
  };
}

function saveCurrentMatchToHistory() {
  if (stopwatchStartedAt) onStopwatchTick();

  const suggestedName = `Match ${matchHistory.length + 1}`;
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

function renderHistory() {
  const root = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  if (!root || !empty) return;

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
          <td><strong>${player.name}</strong></td>
          <td>${fmtTime(player.halves[0])}</td>
          <td>${fmtTime(player.halves[1])}</td>
          <td>${fmtTime(player.halves[2])}</td>
          <td>${fmtTime(total)}</td>
          <td>${fmtTime(benchTotal)}</td>
          <td>${fmtTime(keeperTotal)}</td>
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
            <div><span>H1</span><strong>${fmtTime(match.halfTimesMs[0] / 1000)}</strong></div>
            <div><span>H2</span><strong>${fmtTime(match.halfTimesMs[1] / 1000)}</strong></div>
            <div><span>H3</span><strong>${fmtTime(match.halfTimesMs[2] / 1000)}</strong></div>
            <div><span>Totalt</span><strong>${fmtTime(match.totalMatchMs / 1000)}</strong></div>
          </div>

          <div class="history-table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Spelare</th>
                  <th>H1</th>
                  <th>H2</th>
                  <th>H3</th>
                  <th>Totalt</th>
                  <th>Bänk</th>
                  <th>MV</th>
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

  root.querySelectorAll("[data-delete-history]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      removeHistoryMatch(btn.dataset.deleteHistory);
    };
  });
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
  document.getElementById("resetExerciseBtn").onclick = loadExercise;

  document.getElementById("exAddPlayer").onclick = () => {
    placeToken(pitch, createToken("player", {name:"Spelare"}), 50, 70);
    renumberTrainingPlayers();
  };
  document.getElementById("exAddBall").onclick = () => placeToken(pitch, createToken("ball"), 50, 50);
  document.getElementById("exAddCone").onclick = () => placeToken(pitch, createToken("cone"), 50, 50);
  document.getElementById("exAddCoach").onclick = () => placeToken(pitch, createToken("coach", {name:"Tränare"}), 50, 50);
}

function initTheme() {
  document.body.dataset.theme = "dark";
}

function getCurrentHalfElapsedMs() {
  return halfElapsedMs[currentHalf] + (stopwatchStartedAt ? (Date.now() - stopwatchStartedAt) : 0);
}

function updateHalfUI() {
  const label = document.getElementById("halfLabel");
  if (label) label.textContent = `Halvlek ${currentHalf + 1} av 3`;

  document.querySelectorAll(".half-btn").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.half) === currentHalf);
  });
}

function updateStopwatchDisplay() {
  document.getElementById("stopwatchDisplay").textContent = fmtTime(getCurrentHalfElapsedMs() / 1000);
}

function onStopwatchTick() {
  const now = Date.now();
  const deltaSeconds = stopwatchLastTick ? (now - stopwatchLastTick) / 1000 : 0;
  stopwatchLastTick = now;
  tickPlayerStats(deltaSeconds);
  updateStopwatchDisplay();
  updatePlaytimeStats();
  updatePlayerCardsTimes();
  renderStatistics();
}

function startStopwatch() {
  if (stopwatchStartedAt) return;
  stopwatchStartedAt = Date.now();
  stopwatchLastTick = stopwatchStartedAt;
  stopwatchTimerId = setInterval(onStopwatchTick, 250);
  document.getElementById("stopwatchToggle").textContent = "Pausa";
  updateStopwatchDisplay();
}

function pauseStopwatch() {
  if (!stopwatchStartedAt) return;
  onStopwatchTick();
  halfElapsedMs[currentHalf] += Date.now() - stopwatchStartedAt;
  stopwatchStartedAt = null;
  stopwatchLastTick = null;
  clearInterval(stopwatchTimerId);
  stopwatchTimerId = null;
  document.getElementById("stopwatchToggle").textContent = "Starta";
  updateStopwatchDisplay();
  updatePlaytimeStats();
}

function switchHalf(nextHalf) {
  if (nextHalf < 0 || nextHalf > 2 || nextHalf === currentHalf) return;
  const wasRunning = Boolean(stopwatchStartedAt);
  if (wasRunning) pauseStopwatch();
  currentHalf = nextHalf;
  updateHalfUI();
  updateStopwatchDisplay();
  renderLineupPanel();
  updatePlaytimeStats();
  if (wasRunning) startStopwatch();
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
  halfElapsedMs.fill(0);
  currentHalf = 0;
  resetPlayerStats();
  updateHalfUI();
  updateStopwatchDisplay();
  updatePlayerCardsTimes();
}

function initStopwatch() {
  document.getElementById("stopwatchToggle").onclick = () => stopwatchStartedAt ? pauseStopwatch() : startStopwatch();
  document.getElementById("stopwatchReset").onclick = resetCurrentHalf;
  document.getElementById("clearPlaytimeSelection").onclick = clearPlaytimePlayerSelection;

  document.querySelectorAll(".half-btn").forEach(btn => {
    btn.onclick = () => switchHalf(Number(btn.dataset.half));
  });

  updateHalfUI();
  updateStopwatchDisplay();
  renderLineupPanel();
  updatePlaytimeStats();
}

document.getElementById("resetAllBtn").onclick = () => {
  selectedPlaytimePlayer = null;
  resetMatchScore();
  PLAYERS = [...DEFAULT_PLAYERS];
  Object.keys(playerStats).forEach(name => delete playerStats[name]);
  PLAYERS.forEach(name => playerStats[name] = createEmptyPlayerStats());
  savePlayers();

  exercises = cloneExercises(DEFAULT_EXERCISES);
  saveExercises();

  resetMatch();
  currentCategory = "passing";
  currentExerciseIndex = 0;
  document.querySelectorAll(".subtab").forEach((b,i) => b.classList.toggle("active", i===0));
  renderExerciseList();
  loadExercise();
  resetAllMatchTimeAndStats();
  renderPlayerManager();
};

function initVersionTracker() {
  const text = document.getElementById("versionText");
  if (text) text.textContent = `Version ${APP_VERSION}`;
}

initTheme();
setTabs();
setTrainingCategory();
wireMatchTools();
wireTrainingTools();
initStopwatch();
initPlayerManager();
initHistory();
renderExerciseList();
loadExercise();
resetMatch();
initVersionTracker();
