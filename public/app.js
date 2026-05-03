const STORAGE_KEY = "cardia-online-duel-session";

const lobbyView = document.querySelector("#lobbyView");
const gameView = document.querySelector("#gameView");
const createName = document.querySelector("#createName");
const joinName = document.querySelector("#joinName");
const roomCodeInput = document.querySelector("#roomCodeInput");
const createRoomButton = document.querySelector("#createRoomButton");
const joinRoomButton = document.querySelector("#joinRoomButton");
const roomCodeLabel = document.querySelector("#roomCodeLabel");
const gameTitle = document.querySelector("#gameTitle");
const playersPanel = document.querySelector("#playersPanel");
const readyPanel = document.querySelector("#readyPanel");
const readyButton = document.querySelector("#readyButton");
const forceNewPlayerButton = document.querySelector("#forceNewPlayerButton");
const copyLinkButton = document.querySelector("#copyLinkButton");
const leaveButton = document.querySelector("#leaveButton");
const statusBand = document.querySelector("#statusBand");
const pendingPanel = document.querySelector("#pendingPanel");
const boardWrap = document.querySelector("#boardWrap");
const encountersEl = document.querySelector("#encounters");
const roundLabel = document.querySelector("#roundLabel");
const handPanel = document.querySelector("#handPanel");
const handEl = document.querySelector("#hand");
const handHint = document.querySelector("#handHint");
const logPanel = document.querySelector("#logPanel");
const gameLog = document.querySelector("#gameLog");
const toast = document.querySelector("#toast");

let session = readSession();
let state = null;
let pollTimer = null;
let toastTimer = null;

createRoomButton.addEventListener("click", createRoom);
joinRoomButton.addEventListener("click", () => joinRoom(false));
readyButton.addEventListener("click", toggleReady);
copyLinkButton.addEventListener("click", copyInviteLink);
leaveButton.addEventListener("click", leaveRoom);
forceNewPlayerButton.addEventListener("click", () => {
  session.playerId = "";
  saveSession();
  joinRoom(true);
});

roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
});

const roomFromUrl = new URLSearchParams(location.search).get("room");
if (roomFromUrl && !session.roomCode) {
  roomCodeInput.value = roomFromUrl.toUpperCase();
}

if (session.roomCode && session.playerId) {
  loadState();
} else {
  renderLobby();
}

async function createRoom() {
  const name = createName.value.trim() || "플레이어 1";
  const result = await api("/api/create", { name });
  if (!result) return;
  session = {
    roomCode: result.roomCode,
    playerId: result.playerId,
    seat: result.seat
  };
  saveSession();
  setRoomUrl(result.roomCode);
  state = result.state;
  render();
  startPolling();
}

async function joinRoom(forceNew) {
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  if (!roomCode) {
    showToast("방 코드를 입력하세요.");
    return;
  }
  const name = joinName.value.trim() || "플레이어 2";
  const result = await api("/api/join", {
    roomCode,
    name,
    playerId: forceNew ? "" : session.playerId,
    forceNew
  });
  if (!result) return;
  session = {
    roomCode: result.roomCode,
    playerId: result.playerId,
    seat: result.seat
  };
  saveSession();
  setRoomUrl(result.roomCode);
  state = result.state;
  render();
  startPolling();
}

async function loadState() {
  if (!session.roomCode || !session.playerId) {
    renderLobby();
    return;
  }
  try {
    const response = await fetch(`/api/state?room=${encodeURIComponent(session.roomCode)}&player=${encodeURIComponent(session.playerId)}`);
    if (!response.ok) {
      leaveRoom();
      return;
    }
    state = await response.json();
    render();
    startPolling();
  } catch {
    showToast("서버에 연결할 수 없습니다.");
    renderLobby();
  }
}

function startPolling() {
  window.clearInterval(pollTimer);
  pollTimer = window.setInterval(loadStateQuietly, 900);
}

async function loadStateQuietly() {
  if (!session.roomCode || !session.playerId) return;
  try {
    const response = await fetch(`/api/state?room=${encodeURIComponent(session.roomCode)}&player=${encodeURIComponent(session.playerId)}`);
    if (response.ok) {
      state = await response.json();
      render();
    }
  } catch {
    // The next poll will try again.
  }
}

async function toggleReady() {
  const me = state?.players?.[state.seat];
  await action({ type: "ready", ready: !me?.ready });
}

async function playCard(cardId) {
  await action({ type: "play", cardId });
}

async function choose(value) {
  await action({ type: "choice", choice: value });
}

async function newGame() {
  await action({ type: "newGame" });
}

async function action(payload) {
  if (!session.roomCode || !session.playerId) return;
  const result = await api("/api/action", {
    roomCode: session.roomCode,
    playerId: session.playerId,
    ...payload
  });
  if (result) {
    state = result;
    render();
  }
}

async function api(url, payload) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "요청을 처리할 수 없습니다.");
      return null;
    }
    return data;
  } catch {
    showToast("서버에 연결할 수 없습니다.");
    return null;
  }
}

function render() {
  if (!state || state.seat === -1) {
    renderLobby();
    return;
  }

  lobbyView.hidden = true;
  gameView.hidden = false;
  roomCodeLabel.textContent = state.roomCode;
  gameTitle.textContent = state.game ? "카르디아 듀얼" : "대기실";
  renderPlayers();

  const inLobby = !state.game;
  readyPanel.hidden = !inLobby;
  if (inLobby) {
    const me = state.players[state.seat];
    readyButton.textContent = me?.ready ? "준비 취소" : "준비";
    renderGameSections(false);
    return;
  }

  renderGameSections(true);
  renderStatus();
  renderPending();
  renderBoard();
  renderHand();
  renderLog();
}

function renderLobby() {
  lobbyView.hidden = false;
  gameView.hidden = true;
}

function renderGameSections(show) {
  statusBand.hidden = !show;
  boardWrap.hidden = !show;
  handPanel.hidden = !show;
  logPanel.hidden = !show;
}

function renderPlayers() {
  const game = state.game;
  playersPanel.innerHTML = state.players.map((player, index) => {
    const isMe = index === state.seat;
    const signets = game ? game.signets[index] : 0;
    const deck = game ? game.deckCounts[index] : "-";
    const hand = game ? game.handCounts[index] : "-";
    const discard = game ? game.discardCounts[index] : "-";
    return `
      <section class="player-card ${isMe ? "is-me" : ""}">
        <h2>
          <span>${player ? escapeHtml(player.name) : "빈 자리"}</span>
          <small>${isMe ? "나" : `P${index + 1}`}</small>
        </h2>
        <div class="player-stats">
          <div class="stat"><span>상태</span><strong>${player ? (player.ready || game ? "준비됨" : "대기") : "초대 필요"}</strong></div>
          <div class="stat"><span>인장</span><strong>${signets}</strong></div>
          <div class="stat"><span>덱</span><strong>${deck}</strong></div>
          <div class="stat"><span>손패</span><strong>${hand}</strong></div>
          <div class="stat"><span>버림</span><strong>${discard}</strong></div>
        </div>
      </section>
    `;
  }).join("");
}

function renderStatus() {
  const game = state.game;
  const phaseText = {
    choosing: "카드 선택",
    resolving: "능력 처리",
    pending: "선택 대기",
    ended: "게임 종료"
  }[game.phase] || game.phase;

  let message = "";
  if (game.winner !== null) {
    message = game.winner === "draw" ? "무승부입니다." : `${game.winnerName} 승리입니다.`;
  } else if (game.phase === "choosing") {
    if (game.selected.mine) {
      message = game.selected.opponent ? "두 카드가 공개됩니다." : "상대가 카드를 고르는 중입니다.";
    } else {
      message = "손패에서 카드 1장을 고르세요.";
    }
  } else if (game.phase === "pending") {
    message = game.pending?.mine ? "당신의 능력 대상을 고르세요." : "상대가 능력 대상을 고르는 중입니다.";
  } else {
    message = "라운드를 처리하고 있습니다.";
  }

  statusBand.innerHTML = `
    <p><strong>${game.round}라운드 · ${phaseText}</strong><br>${message}</p>
    ${game.winner !== null ? `<button class="primary-button" type="button" id="newGameButton">새 게임</button>` : ""}
  `;
  const button = document.querySelector("#newGameButton");
  if (button) button.addEventListener("click", newGame);
}

function renderPending() {
  const pending = state.game.pending;
  pendingPanel.hidden = !pending;
  if (!pending) {
    pendingPanel.innerHTML = "";
    return;
  }

  if (!pending.mine) {
    pendingPanel.innerHTML = `
      <h2>능력 선택 대기</h2>
      <p>${escapeHtml(pending.prompt)}</p>
    `;
    return;
  }

  pendingPanel.innerHTML = `
    <h2>능력 선택</h2>
    <p>${escapeHtml(pending.prompt)}</p>
    <div class="choice-options">
      ${pending.options.map((option) => `<button class="choice-button" type="button" data-choice="${escapeAttr(option.value)}">${escapeHtml(option.label)}</button>`).join("")}
    </div>
  `;

  pendingPanel.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => choose(button.dataset.choice));
  });
}

function renderBoard() {
  const game = state.game;
  roundLabel.textContent = `${game.encounters.length}개 조우`;
  encountersEl.innerHTML = game.encounters.length ? game.encounters.map(renderEncounter).join("") : `
    <div class="empty-slot">아직 공개된 조우가 없습니다.</div>
  `;
}

function renderEncounter(encounter) {
  return `
    <article class="encounter">
      ${renderPlayedCard(encounter.cards[1], encounter.battleSignets[1] + encounter.bonusSignets[1])}
      <div class="vs">${encounter.round}R</div>
      ${renderPlayedCard(encounter.cards[0], encounter.battleSignets[0] + encounter.bonusSignets[0])}
    </article>
  `;
}

function renderPlayedCard(card, signets) {
  if (!card) return `<div class="empty-slot">버려짐</div>`;
  return `
    <section class="played-card" style="--faction-color:${card.faction.color}">
      ${renderCardInner(card, signets)}
    </section>
  `;
}

function renderHand() {
  const game = state.game;
  const canPlay = game.phase === "choosing" && !game.selected.mine && game.winner === null;
  handHint.textContent = canPlay ? "카드를 눌러 이번 라운드에 냅니다." : (game.selected.mine ? "카드를 선택했습니다." : "지금은 카드를 낼 수 없습니다.");
  handEl.innerHTML = game.hand.length ? game.hand.map((card) => `
    <button class="card-button" type="button" data-card="${escapeAttr(card.instanceId)}" ${canPlay ? "" : "disabled"}>
      <section class="hand-card" style="--faction-color:${card.faction.color}">
        ${renderCardInner(card, 0)}
      </section>
    </button>
  `).join("") : `<div class="empty-slot">손패가 없습니다.</div>`;

  handEl.querySelectorAll("[data-card]").forEach((button) => {
    button.addEventListener("click", () => playCard(button.dataset.card));
  });
}

function renderCardInner(card, signets) {
  const modifierText = card.modifiers.length
    ? card.modifiers.map((modifier) => `${modifier.amount > 0 ? "+" : ""}${modifier.amount}`).join(" ")
    : "수정 없음";
  return `
    <div class="card-top">
      <strong>${escapeHtml(card.name)}</strong>
      <span class="influence">${card.effectiveInfluence}</span>
    </div>
    <div class="card-meta">
      <span class="pill">${escapeHtml(card.faction.name)}</span>
      <span class="pill">${escapeHtml(card.type)}</span>
      <span class="pill">${escapeHtml(modifierText)}</span>
      ${card.ongoing ? `<span class="pill">지속 중</span>` : ""}
    </div>
    <p class="card-text">${escapeHtml(card.text)}</p>
    ${signets ? `<div class="signets">${Array.from({ length: signets }, () => `<span class="signet"></span>`).join("")}</div>` : ""}
  `;
}

function renderLog() {
  gameLog.innerHTML = state.game.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
  gameLog.scrollTop = gameLog.scrollHeight;
}

async function copyInviteLink() {
  const link = `${location.origin}${location.pathname}?room=${encodeURIComponent(session.roomCode)}`;
  try {
    await navigator.clipboard.writeText(link);
    showToast("초대 링크를 복사했습니다.");
  } catch {
    showToast(link);
  }
}

function leaveRoom() {
  session = {};
  saveSession();
  state = null;
  window.clearInterval(pollTimer);
  history.replaceState(null, "", location.pathname);
  renderLobby();
}

function setRoomUrl(roomCode) {
  history.replaceState(null, "", `${location.pathname}?room=${encodeURIComponent(roomCode)}`);
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSession() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
