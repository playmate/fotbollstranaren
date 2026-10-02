
const PLAYERS = ["Liam","Frans","Finn","Charles","Erik","Ian","Endrit","John"];

const exercises = {
  passing: [
    {
      id: "gate",
      title: "Passa genom porten",
      description: "Två spelare passar bollen genom en port av konor. Flytta porten eller gör den smalare för mer precision.",
      items: [
        {type:"player", name:"Liam", x:20, y:50},
        {type:"player", name:"Finn", x:80, y:50},
        {type:"ball", x:50, y:50},
        {type:"cone", x:47, y:43},
        {type:"cone", x:47, y:57}
      ]
    },
    {
      id: "move",
      title: "Passa och byt plats",
      description: "Tre spelare passar och springer till nästa position efter passningen.",
      items: [
        {type:"player", name:"Liam", x:50, y:20},
        {type:"player", name:"Finn", x:25, y:72},
        {type:"player", name:"Erik", x:75, y:72},
        {type:"ball", x:50, y:48},
        {type:"cone", x:50, y:28},
        {type:"cone", x:30, y:68},
        {type:"cone", x:70, y:68}
      ]
    },
    {
      id: "square",
      title: "Fyrkanten",
      description: "Fyra spelare passar runt en fyrkant. Lägg till tränaren i mitten som passiv eller aktiv försvarare.",
      items: [
        {type:"player", name:"Liam", x:20, y:25},
        {type:"player", name:"Finn", x:80, y:25},
        {type:"player", name:"Erik", x:20, y:75},
        {type:"player", name:"Frans", x:80, y:75},
        {type:"coach", name:"Tränare", x:50, y:50},
        {type:"ball", x:28, y:25},
        {type:"cone", x:28, y:32},
        {type:"cone", x:72, y:32},
        {type:"cone", x:28, y:68},
        {type:"cone", x:72, y:68}
      ]
    },
    {
      id: "wall",
      title: "Tränaren som vägg",
      description: "Spelaren passar tränaren, springer fram och får tillbaka bollen.",
      items: [
        {type:"player", name:"Liam", x:20, y:50},
        {type:"coach", name:"Tränare", x:50, y:50},
        {type:"player", name:"Finn", x:80, y:50},
        {type:"ball", x:35, y:50}
      ]
    },
    {
      id: "bowling",
      title: "Passningsbowling",
      description: "Spelaren försöker träffa konorna med en kontrollerad passning.",
      items: [
        {type:"player", name:"Liam", x:18, y:50},
        {type:"ball", x:28, y:50},
        {type:"cone", x:72, y:42},
        {type:"cone", x:78, y:50},
        {type:"cone", x:72, y:58}
      ]
    }
  ],
  shooting: [
    {
      id: "coachpass",
      title: "Passning från tränare → skott",
      description: "Tränaren passar fram bollen. Spelaren tar emot och avslutar mot mål.",
      items: [
        {type:"coach", name:"Tränare", x:50, y:78},
        {type:"ball", x:50, y:62},
        {type:"player", name:"Liam", x:50, y:48},
        {type:"player", name:"Ian", x:50, y:12}
      ]
    },
    {
      id: "coneshoot",
      title: "Dribbla mellan konor + skott",
      description: "Dribbla mellan konorna och avsluta mot mål.",
      items: [
        {type:"player", name:"Liam", x:50, y:82},
        {type:"ball", x:50, y:74},
        {type:"cone", x:43, y:63},
        {type:"cone", x:57, y:53},
        {type:"cone", x:43, y:43},
        {type:"cone", x:57, y:33},
        {type:"player", name:"Ian", x:50, y:12}
      ]
    },
    {
      id: "twogoals",
      title: "Vänster eller höger",
      description: "Tränaren ropar vänster eller höger. Spelaren ska snabbt välja sida och avsluta.",
      items: [
        {type:"player", name:"Liam", x:50, y:72},
        {type:"ball", x:50, y:62},
        {type:"cone", x:25, y:20},
        {type:"cone", x:75, y:20}
      ]
    },
    {
      id: "wallshot",
      title: "Skott efter väggpass",
      description: "Passa tränaren, få tillbaka bollen i fart och avsluta.",
      items: [
        {type:"player", name:"Liam", x:25, y:70},
        {type:"coach", name:"Tränare", x:50, y:52},
        {type:"ball", x:35, y:64},
        {type:"player", name:"Ian", x:50, y:12}
      ]
    },
    {
      id: "onevone",
      title: "1 mot 1 mot målvakt",
      description: "Tränaren spelar fram bollen. Spelaren driver mot mål och försöker avsluta.",
      items: [
        {type:"coach", name:"Tränare", x:50, y:80},
        {type:"ball", x:50, y:66},
        {type:"player", name:"Liam", x:50, y:55},
        {type:"player", name:"Ian", x:50, y:12}
      ]
    }
  ]
};

let objectCounter = 0;
let currentCategory = "passing";
let currentExerciseIndex = 0;

const matchInitial = {
  pitchPlayers: [
    {name:"Liam", x:30, y:68},
    {name:"Finn", x:70, y:68},
    {name:"Charles", x:50, y:54},
    {name:"Erik", x:35, y:38},
    {name:"Ian", x:50, y:90}
  ],
  benchPlayers: ["Frans","Endrit","John"],
  opponents: [
    {x:30, y:28},
    {x:70, y:28},
    {x:50, y:40},
    {x:62, y:16},
    {x:50, y:8}
  ],
  ball: {x:50, y:50}
};

function setTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

function createToken(type, opts = {}) {
  const el = document.createElement("div");
  el.dataset.type = type;
  el.dataset.id = `obj-${++objectCounter}`;

  if (type === "player") {
    el.className = "token player-token";
    el.textContent = opts.name || "Spelare";
    el.dataset.name = opts.name || "Spelare";
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

function makeDraggable(el) {
  el.addEventListener("pointerdown", e => {
    if (el.parentElement?.id === "bench") return;
    el.setPointerCapture(e.pointerId);
    el.classList.add("dragging");

    const move = ev => {
      const container = el.parentElement;
      if (!container || !container.classList.contains("pitch")) return;
      const rect = container.getBoundingClientRect();
      let x = ((ev.clientX - rect.left) / rect.width) * 100;
      let y = ((ev.clientY - rect.top) / rect.height) * 100;
      x = Math.max(3, Math.min(97, x));
      y = Math.max(3, Math.min(97, y));
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
    };

    const up = ev => {
      el.releasePointerCapture?.(e.pointerId);
      el.classList.remove("dragging");
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);

      if (el.dataset.type === "player" && !el.classList.contains("opponent")) {
        maybeMoveToBench(ev, el);
      }
      updateMatchInfo();
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}

function maybeMoveToBench(ev, el) {
  if (el.parentElement?.id !== "matchPitch") return;
  const bench = document.getElementById("bench");
  const r = bench.getBoundingClientRect();
  if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
    addPlayerToBench(el.dataset.name);
    el.remove();
  }
}

function addPlayerToBench(name) {
  const bench = document.getElementById("bench");
  const el = createToken("player", {name});
  el.classList.add("bench-player");
  el.addEventListener("click", () => {
    const pitch = document.getElementById("matchPitch");
    const playerCount = pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)').length;
    if (playerCount >= 5) {
      alert("Det är redan 5 egna spelare på planen. Flytta först en spelare till bänken.");
      return;
    }
    placeToken(pitch, el, 50, 82);
    updateMatchInfo();
  });
  bench.appendChild(el);
}

function resetMatch() {
  const pitch = document.getElementById("matchPitch");
  const bench = document.getElementById("bench");
  pitch.querySelectorAll(".token").forEach(x => x.remove());
  bench.innerHTML = "";

  matchInitial.pitchPlayers.forEach(p => {
    placeToken(pitch, createToken("player", {name:p.name}), p.x, p.y);
  });
  matchInitial.benchPlayers.forEach(addPlayerToBench);
  matchInitial.opponents.forEach((p, i) => {
    placeToken(pitch, createToken("player", {name: i === 4 ? "MV" : "Motst.", opponent:true}), p.x, p.y);
  });
  placeToken(pitch, createToken("ball"), matchInitial.ball.x, matchInitial.ball.y);
  updateMatchInfo();
}

function updateMatchInfo() {
  const pitch = document.getElementById("matchPitch");
  const bench = document.getElementById("bench");
  const own = pitch.querySelectorAll('.player-token:not(.opponent):not(.coach)').length;
  const opp = pitch.querySelectorAll('.player-token.opponent').length;
  const benchCount = bench.querySelectorAll('.player-token').length;
  document.getElementById("matchInfo").innerHTML = `
    <div class="stat"><span>Egna på plan</span><strong>${own}</strong></div>
    <div class="stat"><span>Motståndare</span><strong>${opp}</strong></div>
    <div class="stat"><span>På bänken</span><strong>${benchCount}</strong></div>
  `;
}

function wireMatchTools() {
  const pitch = document.getElementById("matchPitch");

  document.getElementById("resetMatchBtn").onclick = resetMatch;
  document.getElementById("clearOppBtn").onclick = () => {
    pitch.querySelectorAll(".opponent").forEach(x => x.remove());
    updateMatchInfo();
  };
  document.getElementById("addOpponent").onclick = () => {
    placeToken(pitch, createToken("player", {name:"Motst.", opponent:true}), 50, 20);
    updateMatchInfo();
  };
  document.getElementById("addBall").onclick = () => placeToken(pitch, createToken("ball"), 50, 50);
  document.getElementById("addCone").onclick = () => placeToken(pitch, createToken("cone"), 50, 50);
  document.getElementById("addCoach").onclick = () => placeToken(pitch, createToken("coach", {name:"Tränare"}), 50, 50);
}

function renderPlayerCards() {
  const root = document.getElementById("playerCards");
  root.innerHTML = PLAYERS.map(name => `
    <div class="player-card">
      <div class="player-avatar">${name[0]}</div>
      <h3>${name}</h3>
      <p>Spelare • född 2018</p>
    </div>
  `).join("");
}

function setTrainingCategory() {
  document.querySelectorAll(".subtab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".subtab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      currentExerciseIndex = 0;
      renderExerciseList();
      loadExercise();
    });
  });
}

function renderExerciseList() {
  const root = document.getElementById("exerciseList");
  root.innerHTML = "";
  exercises[currentCategory].forEach((ex, idx) => {
    const btn = document.createElement("button");
    btn.className = "exercise-item" + (idx === currentExerciseIndex ? " active" : "");
    btn.textContent = ex.title;
    btn.onclick = () => {
      currentExerciseIndex = idx;
      renderExerciseList();
      loadExercise();
    };
    root.appendChild(btn);
  });
}

function loadExercise() {
  const ex = exercises[currentCategory][currentExerciseIndex];
  document.getElementById("exerciseTitle").textContent = ex.title;
  document.getElementById("exerciseDescription").textContent = ex.description;

  const pitch = document.getElementById("exercisePitch");
  pitch.querySelectorAll(".token").forEach(x => x.remove());

  ex.items.forEach(item => {
    const token = createToken(item.type, {name:item.name});
    placeToken(pitch, token, item.x, item.y);
  });
}

function wireTrainingTools() {
  const pitch = document.getElementById("exercisePitch");
  document.getElementById("resetExerciseBtn").onclick = loadExercise;
  document.getElementById("exAddPlayer").onclick = () => placeToken(pitch, createToken("player", {name:"Spelare"}), 50, 70);
  document.getElementById("exAddBall").onclick = () => placeToken(pitch, createToken("ball"), 50, 50);
  document.getElementById("exAddCone").onclick = () => placeToken(pitch, createToken("cone"), 50, 50);
  document.getElementById("exAddCoach").onclick = () => placeToken(pitch, createToken("coach", {name:"Tränare"}), 50, 50);
}

document.getElementById("resetAllBtn").onclick = () => {
  resetMatch();
  currentCategory = "passing";
  currentExerciseIndex = 0;
  document.querySelectorAll(".subtab").forEach((b,i) => b.classList.toggle("active", i===0));
  renderExerciseList();
  loadExercise();
};

setTabs();
setTrainingCategory();
wireMatchTools();
wireTrainingTools();
renderPlayerCards();
renderExerciseList();
loadExercise();
resetMatch();
