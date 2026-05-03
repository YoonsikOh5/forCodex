const STORAGE_KEY = "black-manor-room-state";

const puzzles = {
  desk: {
    title: "책상: 탐정의 마지막 일기",
    kicker: "단서 1",
    answerLabel: "비가 멈춘 시각",
    placeholder: "예: 9:20",
    accepted: ["920", "0920", "9시20분", "오후9시20분"],
    hint: "일기에는 네 시각이 모두 적혀 있다. 질문은 사건 시각이 아니라 비가 멈춘 시각을 묻는다.",
    body: `
      <p>책상 위에는 젖은 우산과 마른 흙이 묻은 구두 자국이 나란히 놓여 있다. 일기의 마지막 장은 급하게 찢겨 있다.</p>
      <div class="clue-paper">
        <p><strong>하윤의 일기</strong></p>
        <ol>
          <li>8:10 - 손님들이 모두 서재에 모였다.</li>
          <li>8:45 - 전등이 꺼지고 복도에서 유리 깨지는 소리가 났다.</li>
          <li>9:20 - 비가 완전히 멈췄다.</li>
          <li>9:35 - 문 앞에서 마른 흙 발자국을 발견했다.</li>
        </ol>
        <p>마른 발자국은 비가 멈춘 뒤에 들어온 사람의 것이다.</p>
      </div>
    `,
    reward: {
      name: "마른 흙 발자국",
      detail: "범인은 9:20 이후 서재에 들어왔다. 젖은 우산은 알리바이처럼 꾸민 소품일 수 있다."
    },
    solvedLog: "일기에서 9:20 이후의 마른 발자국이 핵심 단서라는 것을 확인했다."
  },
  bookshelf: {
    title: "책장: 금고 암호",
    kicker: "단서 2",
    answerLabel: "네 자리 암호",
    placeholder: "숫자 4자리",
    accepted: ["5813"],
    hint: "책의 높이는 낮은 순서가 아니라 높은 순서다. 가장 큰 책부터 적힌 숫자를 읽어라.",
    body: `
      <p>책장 한 칸만 먼지가 비어 있다. 빈 자리 옆 책 네 권에는 숫자와 높이를 나타내는 작은 흠집이 남아 있다.</p>
      <div class="clue-paper">
        <p><strong>책장 안쪽 메모</strong></p>
        <p>가장 높은 증언부터 낮은 속삭임까지. 등번호를 차례로 읽으면 철문이 입을 연다.</p>
        <div class="code-grid" aria-label="책 등번호와 책 높이">
          <div class="code-tile"><strong>5</strong><span>높이 4</span></div>
          <div class="code-tile"><strong>8</strong><span>높이 3</span></div>
          <div class="code-tile"><strong>1</strong><span>높이 2</span></div>
          <div class="code-tile"><strong>3</strong><span>높이 1</span></div>
        </div>
        <p>책을 가장 높은 것부터 낮은 것까지 읽으면 금고 암호가 된다.</p>
      </div>
    `,
    reward: {
      name: "금고 암호 5813",
      detail: "책장의 숫자는 가장 큰 책부터 읽어야 한다. 금고에 입력할 네 자리 암호다."
    },
    solvedLog: "책장 메모를 해독해 금고 암호 5813을 얻었다."
  },
  portrait: {
    title: "초상화: 거울 속 서명",
    kicker: "단서 3",
    answerLabel: "거울이 되돌린 이름",
    placeholder: "이름 입력",
    accepted: ["eugene", "유진"],
    hint: "초상화 뒤의 영어 서명은 거울에 비친 모양이다. 오른쪽에서 왼쪽으로 읽으면 이름이 보인다.",
    body: `
      <p>벽의 초상화는 저택의 첫 주인을 그린 그림이다. 액자 뒤에는 거울에 비친 듯한 낙서가 남아 있다.</p>
      <div class="clue-paper">
        <p><strong>액자 뒤 낙서</strong></p>
        <p>거울은 거짓을 반대로 돌려놓는다.</p>
        <p style="font-size: 30px; font-weight: 800; margin-top: 14px;">ENEUGE</p>
        <p>낙서 옆에는 작은 한글 메모도 있다. "이 이름이 문을 닫았다."</p>
      </div>
    `,
    reward: {
      name: "거울 서명 EUGENE",
      detail: "거울 글씨 ENEUGE를 되돌리면 EUGENE, 즉 유진이라는 이름이 나온다."
    },
    solvedLog: "초상화 뒤의 거울 글씨가 유진을 가리킨다는 것을 알아냈다."
  },
  safe: {
    title: "금고: 상속 계약서",
    kicker: "단서 4",
    answerLabel: "금고 암호",
    placeholder: "네 자리 암호",
    accepted: ["5813"],
    hint: "이 암호는 책장에서 얻는다. 네 권의 책을 높은 순서대로 읽어야 한다.",
    requires: "bookshelf",
    lockedText: "금고에는 네 자리 숫자판이 있다. 암호는 책장 어딘가에 숨겨진 듯하다.",
    body: `
      <p>금고 표면에는 낡은 황동 번호판이 붙어 있다. 내부에서 종이 끌리는 소리가 아주 작게 난다.</p>
      <div class="clue-paper">
        <p><strong>금고 문양</strong></p>
        <p>철은 숫자를 기억하고, 종이는 욕심을 기억한다.</p>
        <p>책장이 말한 네 자리 숫자를 입력하라.</p>
      </div>
    `,
    reward: {
      name: "상속 계약서",
      detail: "하윤이 실종되면 저택의 소유권은 유진에게 넘어간다는 조항이 숨겨져 있었다."
    },
    solvedLog: "금고에서 유진에게 강한 동기가 있음을 보여주는 상속 계약서를 찾았다."
  }
};

const suspects = [
  {
    id: "seoah",
    name: "서아",
    note: "비가 오기 전부터 저택에 있었다."
  },
  {
    id: "doyun",
    name: "도윤",
    note: "정전 직후 모두와 함께 복도에 있었다."
  },
  {
    id: "eugene",
    name: "유진",
    note: "9:20 이후 혼자 서재 쪽으로 사라졌다."
  }
];

const defaultState = {
  solved: {},
  evidence: [],
  logs: ["방의 전등이 깜박이고, 문은 안쪽에서 잠겨 있다."],
  escaped: false
};

let state = loadState();
let currentTarget = null;
let toastTimer = null;

const modalBackdrop = document.querySelector("#modalBackdrop");
const modalTitle = document.querySelector("#modalTitle");
const modalKicker = document.querySelector("#modalKicker");
const modalBody = document.querySelector("#modalBody");
const modalActions = document.querySelector("#modalActions");
const closeModalButton = document.querySelector("#closeModal");
const evidenceList = document.querySelector("#evidenceList");
const logList = document.querySelector("#logList");
const progressCount = document.querySelector("#progressCount");
const progressFill = document.querySelector("#progressFill");
const objectiveText = document.querySelector("#objectiveText");
const stageStatus = document.querySelector("#stageStatus");
const toast = document.querySelector("#toast");

document.querySelectorAll(".hotspot").forEach((button) => {
  button.addEventListener("click", () => openInvestigation(button.dataset.target));
});

closeModalButton.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) {
    closeModal();
  }
});

document.querySelector("#hintButton").addEventListener("click", showNextHint);
document.querySelector("#resetButton").addEventListener("click", resetGame);

render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const solvedCount = Object.keys(state.solved).length + (state.escaped ? 1 : 0);
  const totalCount = Object.keys(puzzles).length + 1;
  progressCount.textContent = `${solvedCount}/${totalCount}`;
  progressFill.style.width = `${(solvedCount / totalCount) * 100}%`;

  document.querySelectorAll(".hotspot").forEach((button) => {
    const target = button.dataset.target;
    button.classList.toggle("is-solved", Boolean(state.solved[target]) || (target === "door" && state.escaped));
  });

  renderEvidence();
  renderLogs();

  if (state.escaped) {
    objectiveText.textContent = "문이 열렸다. 유진의 동기와 시간, 이름을 모두 연결해 사건을 해결했다.";
    stageStatus.textContent = "사건 해결. 마지막 문이 열렸다.";
  } else if (hasCoreEvidence()) {
    objectiveText.textContent = "핵심 단서는 모였다. 이제 문 앞에서 범인을 지목하면 된다.";
    stageStatus.textContent = "단서가 충분하다. 잠긴 문을 조사해 최종 추리를 하자.";
  } else {
    objectiveText.textContent = "책상, 책장, 초상화, 금고를 조사해 범인의 이름과 동기를 찾아야 한다.";
    stageStatus.textContent = "실종된 탐정의 서재에서 단서를 찾아 마지막 문을 열어라.";
  }
}

function renderEvidence() {
  evidenceList.innerHTML = "";

  if (state.evidence.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = "아직 단서가 없다.";
    evidenceList.append(empty);
    return;
  }

  state.evidence.forEach((item) => {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = item.name;
    const span = document.createElement("span");
    span.textContent = item.detail;
    li.append(strong, span);
    evidenceList.append(li);
  });
}

function renderLogs() {
  logList.innerHTML = "";
  state.logs.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    logList.append(li);
  });
}

function openInvestigation(target) {
  currentTarget = target;

  if (target === "door") {
    openDoor();
    return;
  }

  const puzzle = puzzles[target];
  modalTitle.textContent = puzzle.title;
  modalKicker.textContent = puzzle.kicker;
  modalActions.innerHTML = "";

  if (state.solved[target]) {
    modalBody.innerHTML = `
      ${puzzle.body}
      <span class="solved-badge">이미 해결한 단서</span>
      <p>${puzzle.reward.detail}</p>
    `;
    addModalButton("닫기", "secondary-button", closeModal);
    showModal();
    return;
  }

  if (puzzle.requires && !state.solved[puzzle.requires]) {
    modalBody.innerHTML = `
      <p>${puzzle.lockedText}</p>
      <div class="clue-paper">
        <p><strong>잠겨 있음</strong></p>
        <p>${puzzle.hint}</p>
      </div>
    `;
    addModalButton("책장 조사하기", "primary-button", () => openInvestigation(puzzle.requires));
    addModalButton("닫기", "secondary-button", closeModal);
    showModal();
    return;
  }

  modalBody.innerHTML = `
    ${puzzle.body}
    <label for="answerInput">${puzzle.answerLabel}</label>
    <div class="answer-row">
      <input class="answer-input" id="answerInput" type="text" autocomplete="off" placeholder="${puzzle.placeholder}">
      <button class="primary-button" type="button" id="submitAnswer">확인</button>
    </div>
  `;
  addModalButton("힌트", "secondary-button", () => showToast(puzzle.hint));
  addModalButton("닫기", "secondary-button", closeModal);
  showModal();

  const input = document.querySelector("#answerInput");
  const submit = document.querySelector("#submitAnswer");
  input.focus();
  submit.addEventListener("click", () => submitPuzzle(target, input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitPuzzle(target, input.value);
    }
  });
}

function submitPuzzle(target, value) {
  const puzzle = puzzles[target];
  const answer = normalize(value);

  if (!puzzle.accepted.includes(answer)) {
    showToast("아직 맞지 않는다. 단서의 문장을 다시 천천히 읽어보자.");
    return;
  }

  state.solved[target] = true;
  addEvidence(puzzle.reward);
  addLog(puzzle.solvedLog);
  saveState();
  render();

  modalBody.innerHTML = `
    ${puzzle.body}
    <span class="solved-badge">해결 완료</span>
    <p>${puzzle.reward.detail}</p>
  `;
  modalActions.innerHTML = "";
  addModalButton("계속 조사하기", "primary-button", closeModal);
  showToast(`단서 확보: ${puzzle.reward.name}`);
}

function openDoor() {
  modalTitle.textContent = state.escaped ? "문: 사건 해결" : "문: 마지막 추리";
  modalKicker.textContent = "최종";
  modalActions.innerHTML = "";

  if (state.escaped) {
    modalBody.innerHTML = `
      <p>문은 이미 열려 있다. 서재 밖 복도에는 새벽빛이 들어오고, 사건 기록에는 범인의 이름이 선명하게 남았다.</p>
      <div class="clue-paper">
        <p><strong>해결</strong></p>
        <p>유진은 9:20 이후 서재에 들어왔고, 초상화 뒤 이름과 상속 계약서가 동기와 행적을 이어준다.</p>
      </div>
    `;
    addModalButton("닫기", "secondary-button", closeModal);
    showModal();
    return;
  }

  const ready = hasCoreEvidence();
  const suspectsMarkup = suspects.map((suspect) => `
    <button class="choice-button" type="button" data-suspect="${suspect.id}">
      <strong>${suspect.name}</strong>
      <span>${suspect.note}</span>
    </button>
  `).join("");

  modalBody.innerHTML = `
    <p>문 손잡이 위에는 "이름 없는 자는 나갈 수 없다"라는 문장이 새겨져 있다. 단서가 충분하다면 범인을 지목하라.</p>
    ${ready ? `
      <div class="clue-paper">
        <p><strong>핵심 단서</strong></p>
        <ul>
          <li>마른 발자국은 9:20 이후 들어온 사람을 가리킨다.</li>
          <li>초상화 뒤의 거울 글씨는 유진이라는 이름을 가리킨다.</li>
          <li>금고 속 계약서는 유진의 동기를 설명한다.</li>
        </ul>
      </div>
      <div class="choice-list">${suspectsMarkup}</div>
    ` : `
      <div class="clue-paper">
        <p><strong>단서 부족</strong></p>
        <p>책상, 초상화, 금고에서 핵심 단서를 모아야 문이 반응한다.</p>
      </div>
    `}
  `;

  addModalButton("힌트", "secondary-button", showNextHint);
  addModalButton("닫기", "secondary-button", closeModal);
  showModal();

  if (ready) {
    document.querySelectorAll("[data-suspect]").forEach((button) => {
      button.addEventListener("click", () => accuse(button.dataset.suspect));
    });
  }
}

function accuse(suspectId) {
  if (suspectId !== "eugene") {
    showToast("그 이름으로는 문이 열리지 않는다. 시간, 이름, 동기가 모두 이어지는 사람을 고르자.");
    return;
  }

  state.escaped = true;
  addLog("유진을 지목하자 문 안쪽 잠금쇠가 풀렸다.");
  saveState();
  render();
  modalBody.innerHTML = `
    <p>문 뒤의 장치가 낮게 울리고 잠금쇠가 풀린다. 탐정 하윤은 실종 직전까지 유진의 상속 계약을 추적하고 있었다.</p>
    <div class="clue-paper">
      <p><strong>탈출 성공</strong></p>
      <p>범인은 유진이다. 마른 발자국은 9:20 이후의 움직임을, 거울 서명은 이름을, 계약서는 동기를 증명한다.</p>
    </div>
  `;
  modalActions.innerHTML = "";
  addModalButton("다시 둘러보기", "primary-button", closeModal);
  addModalButton("처음부터", "secondary-button", resetGame);
  showToast("탈출 성공. 사건을 해결했다.");
}

function addEvidence(item) {
  if (!state.evidence.some((existing) => existing.name === item.name)) {
    state.evidence.push(item);
  }
}

function addLog(entry) {
  if (!state.logs.includes(entry)) {
    state.logs.push(entry);
  }
}

function hasCoreEvidence() {
  return Boolean(state.solved.desk && state.solved.portrait && state.solved.safe);
}

function showNextHint() {
  if (state.escaped) {
    showToast("이미 사건을 해결했다. 처음부터 다시 시작하면 퍼즐을 다시 풀 수 있다.");
    return;
  }

  if (currentTarget && puzzles[currentTarget] && !state.solved[currentTarget]) {
    showToast(puzzles[currentTarget].hint);
    return;
  }

  const next = Object.entries(puzzles).find(([key]) => !state.solved[key]);
  if (next) {
    showToast(`${next[1].title}부터 살펴보자. ${next[1].hint}`);
  } else {
    showToast("모든 단서는 모였다. 문 앞에서 범인을 지목하면 된다.");
  }
}

function addModalButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  modalActions.append(button);
}

function showModal() {
  modalBackdrop.hidden = false;
}

function closeModal() {
  modalBackdrop.hidden = true;
  currentTarget = null;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3600);
}

function resetGame() {
  state = structuredClone(defaultState);
  saveState();
  render();
  closeModal();
  showToast("새 사건 기록으로 돌아왔다.");
}

function normalize(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[:.\-_/]/g, "");
}
