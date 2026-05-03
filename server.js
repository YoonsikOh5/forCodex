const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const rooms = new Map();

const FACTIONS = {
  rebellion: { name: "반란군", color: "#c75252" },
  academy: { name: "아카데미", color: "#5476c9" },
  guild: { name: "길드", color: "#c69a3b" },
  dynasty: { name: "왕조", color: "#52a36f" }
};

const DECK = [
  {
    id: 1,
    name: "고용된 칼날",
    faction: "rebellion",
    type: "즉시",
    text: "이 조우의 양쪽 카드를 모두 버립니다.",
    needsChoice: false
  },
  {
    id: 2,
    name: "예언가",
    faction: "academy",
    type: "즉시",
    text: "덱에서 카드 1장을 뽑습니다.",
    needsChoice: false
  },
  {
    id: 3,
    name: "외과의",
    faction: "guild",
    type: "즉시",
    text: "당신의 사용된 카드 1장에 영향력 +1을 올립니다.",
    needsChoice: true
  },
  {
    id: 4,
    name: "중재자",
    faction: "dynasty",
    type: "지속",
    text: "이 조우는 지속 토큰이 있는 동안 무승부가 됩니다.",
    needsChoice: false
  },
  {
    id: 5,
    name: "방해꾼",
    faction: "rebellion",
    type: "즉시",
    text: "상대 덱 위 카드 2장을 버립니다.",
    needsChoice: false
  },
  {
    id: 6,
    name: "공허 마법사",
    faction: "academy",
    type: "즉시",
    text: "사용된 카드 1장에 놓인 영향력 수정자를 모두 제거합니다.",
    needsChoice: true
  },
  {
    id: 7,
    name: "궁전 경비병",
    faction: "dynasty",
    type: "즉시",
    text: "당신의 사용된 카드 1장에 추가 인장 1개를 놓습니다.",
    needsChoice: true
  },
  {
    id: 8,
    name: "재판관",
    faction: "academy",
    type: "지속",
    text: "지속 중에는 당신이 무승부 조우를 이깁니다.",
    needsChoice: false
  },
  {
    id: 9,
    name: "기술자",
    faction: "guild",
    type: "즉시",
    text: "당신의 사용된 카드 1장에 영향력 +2를 올립니다.",
    needsChoice: true
  },
  {
    id: 10,
    name: "후계자",
    faction: "dynasty",
    type: "즉시",
    text: "상대보다 인장이 적으면 이 카드에 +5, 아니면 +2를 올립니다.",
    needsChoice: false
  },
  {
    id: 11,
    name: "시계공",
    faction: "guild",
    type: "즉시",
    text: "당신의 이전 조우 카드와 다음에 낼 카드에 각각 +3을 올립니다.",
    needsChoice: false
  },
  {
    id: 12,
    name: "혁명가",
    faction: "rebellion",
    type: "즉시",
    text: "상대 카드의 인장 1개를 이 카드로 옮깁니다.",
    needsChoice: true
  },
  {
    id: 13,
    name: "사서",
    faction: "academy",
    type: "즉시",
    text: "카드 2장을 뽑은 뒤 손패 1장을 버립니다.",
    needsChoice: true
  },
  {
    id: 14,
    name: "마기스트라",
    faction: "dynasty",
    type: "즉시",
    text: "당신의 사용된 카드 1장을 골라, 그 카드가 더 강하면 차이만큼 이 카드에 +를 올립니다.",
    needsChoice: true
  },
  {
    id: 15,
    name: "발명가",
    faction: "guild",
    type: "즉시",
    text: "사용된 카드 1장에 +3, 다른 사용된 카드 1장에 -3을 올립니다.",
    needsChoice: true
  },
  {
    id: 16,
    name: "진",
    faction: "dynasty",
    type: "즉시",
    text: "이 능력이 발동되면 즉시 승리합니다.",
    needsChoice: false
  }
];

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
});

server.listen(PORT, () => {
  console.log(`Cardia online duel running at http://localhost:${PORT}`);
});

function serveStatic(req, res, url) {
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(content);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/create") {
    const body = await readJson(req);
    const room = createRoom(body.name || "플레이어 1");
    sendJson(res, 200, {
      roomCode: room.code,
      playerId: room.players[0].id,
      seat: 0,
      state: publicState(room, room.players[0].id)
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/join") {
    const body = await readJson(req);
    const code = normalizeRoomCode(body.roomCode);
    const room = rooms.get(code);
    if (!room) {
      sendJson(res, 404, { error: "방을 찾을 수 없습니다." });
      return;
    }

    const existingIndex = room.players.findIndex((player) => player && player.id === body.playerId);
    if (existingIndex !== -1 && !body.forceNew) {
      sendJson(res, 200, {
        roomCode: room.code,
        playerId: body.playerId,
        seat: existingIndex,
        state: publicState(room, body.playerId)
      });
      return;
    }

    const seat = room.players.findIndex((player) => !player);
    if (seat === -1) {
      sendJson(res, 409, { error: "이미 두 명이 모두 참가한 방입니다." });
      return;
    }

    const player = makePlayer(body.name || `플레이어 ${seat + 1}`, seat);
    room.players[seat] = player;
    room.log.push(`${player.name}님이 입장했습니다.`);
    sendJson(res, 200, {
      roomCode: room.code,
      playerId: player.id,
      seat,
      state: publicState(room, player.id)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    const code = normalizeRoomCode(url.searchParams.get("room") || "");
    const room = rooms.get(code);
    if (!room) {
      sendJson(res, 404, { error: "방을 찾을 수 없습니다." });
      return;
    }
    sendJson(res, 200, publicState(room, url.searchParams.get("player") || ""));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/action") {
    const body = await readJson(req);
    const room = rooms.get(normalizeRoomCode(body.roomCode));
    if (!room) {
      sendJson(res, 404, { error: "방을 찾을 수 없습니다." });
      return;
    }
    const seat = getSeat(room, body.playerId);
    if (seat === -1) {
      sendJson(res, 403, { error: "이 방의 플레이어가 아닙니다." });
      return;
    }
    applyAction(room, seat, body);
    sendJson(res, 200, publicState(room, body.playerId));
    return;
  }

  sendJson(res, 404, { error: "알 수 없는 API입니다." });
}

function createRoom(name) {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 6).toUpperCase();
  } while (rooms.has(code));

  const room = {
    code,
    createdAt: Date.now(),
    players: [makePlayer(name, 0), null],
    log: ["방이 만들어졌습니다."],
    game: null
  };
  rooms.set(code, room);
  return room;
}

function makePlayer(name, seat) {
  return {
    id: randomUUID(),
    name: String(name).trim().slice(0, 18) || `플레이어 ${seat + 1}`,
    seat,
    ready: false
  };
}

function applyAction(room, seat, action) {
  if (action.type === "ready") {
    room.players[seat].ready = Boolean(action.ready);
    room.log.push(`${room.players[seat].name}님이 ${action.ready ? "준비했습니다" : "준비를 취소했습니다"}.`);
    if (room.players[0] && room.players[1] && room.players.every((player) => player.ready)) {
      startGame(room);
    }
    return;
  }

  if (action.type === "newGame") {
    if (!room.players[0] || !room.players[1]) return;
    room.players.forEach((player) => {
      player.ready = true;
    });
    startGame(room);
    return;
  }

  if (!room.game || room.game.winner) return;

  if (action.type === "play") {
    playCard(room, seat, action.cardId);
    return;
  }

  if (action.type === "choice") {
    resolveChoice(room, seat, action.choice);
  }
}

function startGame(room) {
  const decks = [makeDeck(0), makeDeck(1)];
  shuffle(decks[0]);
  shuffle(decks[1]);
  const game = {
    phase: "choosing",
    round: 1,
    decks,
    hands: [[], []],
    discards: [[], []],
    encounters: [],
    selected: [null, null],
    nextModifiers: [[], []],
    pending: null,
    winner: null,
    log: ["게임을 시작합니다. 각자 카드 5장을 뽑았습니다."]
  };
  room.game = game;
  drawCards(game, 0, 5);
  drawCards(game, 1, 5);
  room.log.push("새 게임이 시작되었습니다.");
}

function makeDeck(owner) {
  return DECK.map((card) => ({
    instanceId: `${owner}-${card.id}-${randomUUID().slice(0, 8)}`,
    owner,
    baseId: card.id,
    name: card.name,
    faction: card.faction,
    type: card.type,
    text: card.text,
    influence: card.id,
    modifiers: [],
    ongoing: false
  }));
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function playCard(room, seat, cardId) {
  const game = room.game;
  if (game.phase !== "choosing") return;
  if (game.selected[seat]) return;

  const card = game.hands[seat].find((item) => item.instanceId === cardId);
  if (!card) return;

  game.selected[seat] = cardId;
  game.log.push(`${room.players[seat].name}님이 카드를 선택했습니다.`);

  if (game.selected[0] && game.selected[1]) {
    revealEncounter(room);
  }
}

function revealEncounter(room) {
  const game = room.game;
  const cards = [0, 1].map((seat) => {
    const cardId = game.selected[seat];
    const index = game.hands[seat].findIndex((card) => card.instanceId === cardId);
    const [card] = game.hands[seat].splice(index, 1);
    if (game.nextModifiers[seat].length) {
      card.modifiers.push(...game.nextModifiers[seat]);
      game.log.push(`${room.players[seat].name}님의 다음 카드 보너스가 ${card.name}에 적용되었습니다.`);
      game.nextModifiers[seat] = [];
    }
    return card;
  });

  const encounter = {
    id: randomUUID().slice(0, 8),
    round: game.round,
    cards,
    battleSignets: [0, 0],
    bonusSignets: [0, 0]
  };
  game.encounters.push(encounter);
  game.selected = [null, null];
  game.phase = "resolving";

  game.log.push(
    `${game.round}라운드 공개: ${room.players[0].name} ${cards[0].name}(${effectiveInfluence(cards[0])}) vs ${room.players[1].name} ${cards[1].name}(${effectiveInfluence(cards[1])})`
  );

  settleAll(game);
  const result = compareCards(game, encounter);
  if (result.tie) {
    game.log.push("동률입니다. 인장을 얻지 않고 능력도 발동하지 않습니다.");
    finishRound(room);
    return;
  }

  const loser = result.winner === 0 ? 1 : 0;
  game.log.push(`${subject(cards[result.winner].name)} 조우에서 이겼고, ${cards[loser].name}의 능력이 발동합니다.`);
  activateAbility(room, loser, encounter.id, cards[loser]);
}

function activateAbility(room, seat, encounterId, sourceCard) {
  const game = room.game;
  if (!sourceCard) {
    finishRound(room);
    return;
  }

  switch (sourceCard.baseId) {
    case 1:
      discardEncounterCards(game, encounterId);
      game.log.push("고용된 칼날이 양쪽 카드를 모두 버렸습니다.");
      finishRound(room);
      break;
    case 2:
      drawCards(game, seat, 1);
      game.log.push(`${sourceCard.name} 효과로 카드 1장을 뽑았습니다.`);
      finishRound(room);
      break;
    case 3:
      createPending(game, seat, sourceCard, "addModifier", "당신의 사용된 카드 1장을 골라 +1을 올리세요.", ownPlayedOptions(game, seat), { amount: 1 });
      break;
    case 4:
      sourceCard.ongoing = true;
      game.log.push("중재자가 지속 상태가 되어 이 조우를 무승부로 만듭니다.");
      finishRound(room);
      break;
    case 5:
      discardTopDeck(game, other(seat), 2);
      game.log.push("방해꾼이 상대 덱 위 카드 2장을 버렸습니다.");
      finishRound(room);
      break;
    case 6: {
      const options = allPlayedOptions(game).filter((option) => option.modifierCount > 0);
      if (!options.length) {
        game.log.push("제거할 수정자가 없어 공허 마법사 효과가 끝났습니다.");
        finishRound(room);
      } else {
        createPending(game, seat, sourceCard, "removeModifiers", "수정자를 제거할 사용된 카드 1장을 고르세요.", options);
      }
      break;
    }
    case 7:
      createPending(game, seat, sourceCard, "bonusSignet", "당신의 사용된 카드 1장에 추가 인장 1개를 놓으세요.", ownPlayedOptions(game, seat));
      break;
    case 8:
      sourceCard.ongoing = true;
      game.log.push("재판관이 지속 상태가 되어 당신의 무승부 조우를 이기게 합니다.");
      finishRound(room);
      break;
    case 9:
      createPending(game, seat, sourceCard, "addModifier", "당신의 사용된 카드 1장을 골라 +2를 올리세요.", ownPlayedOptions(game, seat), { amount: 2 });
      break;
    case 10: {
      const own = totalSignets(game, seat);
      const opponent = totalSignets(game, other(seat));
      const amount = own < opponent ? 5 : 2;
      sourceCard.modifiers.push(makeModifier(amount, "후계자"));
      game.log.push(`후계자가 자신의 카드에 +${amount}을 올렸습니다.`);
      finishRound(room);
      break;
    }
    case 11:
      boostPreviousAndNext(room, seat, sourceCard);
      finishRound(room);
      break;
    case 12: {
      const options = opponentSignetOptions(game, seat);
      if (!options.length) {
        game.log.push("옮길 상대 인장이 없어 혁명가 효과가 끝났습니다.");
        finishRound(room);
      } else {
        createPending(game, seat, sourceCard, "moveSignet", "상대 카드의 인장 1개를 이 카드로 옮기세요.", options);
      }
      break;
    }
    case 13:
      drawCards(game, seat, 2);
      if (!game.hands[seat].length) {
        finishRound(room);
      } else {
        createPending(game, seat, sourceCard, "discardHand", "사서 효과로 버릴 손패 1장을 고르세요.", handOptions(game, seat));
      }
      break;
    case 14: {
      const options = ownPlayedOptions(game, seat).filter((option) => option.cardId !== sourceCard.instanceId);
      if (!options.length) {
        game.log.push("참조할 카드가 없어 마기스트라 효과가 끝났습니다.");
        finishRound(room);
      } else {
        createPending(game, seat, sourceCard, "magistraBoost", "당신의 사용된 카드 1장을 고르세요. 더 강한 카드라면 차이만큼 이 카드에 +를 올립니다.", options);
      }
      break;
    }
    case 15:
      createPending(game, seat, sourceCard, "inventorPlus", "발명가: +3을 올릴 사용된 카드 1장을 고르세요.", allPlayedOptions(game));
      break;
    case 16:
      game.winner = seat;
      game.phase = "ended";
      game.log.push(`${room.players[seat].name}님이 진의 능력으로 즉시 승리했습니다.`);
      break;
    default:
      finishRound(room);
  }
}

function createPending(game, seat, sourceCard, kind, prompt, options, extra = {}) {
  if (!options.length) {
    finishRoundByGame(game);
    return;
  }
  game.phase = "pending";
  game.pending = {
    player: seat,
    sourceCardId: sourceCard.instanceId,
    sourceEncounterId: findCardLocation(game, sourceCard.instanceId)?.encounterId,
    kind,
    prompt,
    options,
    extra
  };
}

function resolveChoice(room, seat, choice) {
  const game = room.game;
  const pending = game.pending;
  if (!pending || pending.player !== seat) return;
  const selected = pending.options.find((option) => option.value === choice);
  if (!selected) return;
  const source = findCardById(game, pending.sourceCardId);

  switch (pending.kind) {
    case "addModifier": {
      const target = findPlayedByValue(game, selected.value);
      if (target?.card) {
        target.card.modifiers.push(makeModifier(pending.extra.amount, source?.name || "능력"));
        game.log.push(`${target.card.name}에 +${pending.extra.amount}이 올라갔습니다.`);
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    case "removeModifiers": {
      const target = findPlayedByValue(game, selected.value);
      if (target?.card) {
        target.card.modifiers = [];
        game.log.push(`${target.card.name}의 수정자를 모두 제거했습니다.`);
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    case "bonusSignet": {
      const target = findPlayedByValue(game, selected.value);
      if (target) {
        target.encounter.bonusSignets[target.side] += 1;
        game.log.push(`${target.card.name}에 추가 인장 1개를 놓았습니다.`);
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    case "moveSignet": {
      const target = findPlayedByValue(game, selected.value);
      const sourceLocation = findCardLocation(game, pending.sourceCardId);
      if (target && sourceLocation) {
        removeOneSignet(target.encounter, target.side);
        sourceLocation.encounter.bonusSignets[sourceLocation.side] += 1;
        game.log.push(`${target.card.name}의 인장 1개를 ${source?.name || "혁명가"}에게 옮겼습니다.`);
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    case "discardHand": {
      const index = game.hands[seat].findIndex((card) => card.instanceId === selected.value);
      if (index !== -1) {
        const [card] = game.hands[seat].splice(index, 1);
        game.discards[seat].push(card);
        game.log.push(`${room.players[seat].name}님이 ${card.name}을 버렸습니다.`);
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    case "magistraBoost": {
      const target = findPlayedByValue(game, selected.value);
      if (target?.card && source) {
        const diff = effectiveInfluence(target.card) - effectiveInfluence(source);
        if (diff > 0) {
          source.modifiers.push(makeModifier(diff, "마기스트라"));
          game.log.push(`마기스트라가 ${target.card.name}을 참고해 +${diff}을 얻었습니다.`);
        } else {
          game.log.push("선택한 카드가 더 강하지 않아 마기스트라가 보너스를 얻지 못했습니다.");
        }
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    case "inventorPlus": {
      const target = findPlayedByValue(game, selected.value);
      if (target?.card) {
        target.card.modifiers.push(makeModifier(3, "발명가"));
        game.log.push(`${target.card.name}에 +3이 올라갔습니다.`);
      }
      game.pending = {
        player: seat,
        sourceCardId: pending.sourceCardId,
        kind: "inventorMinus",
        prompt: "발명가: -3을 올릴 다른 사용된 카드 1장을 고르세요.",
        options: allPlayedOptions(game).filter((option) => option.value !== selected.value),
        extra: {}
      };
      if (!game.pending.options.length) {
        clearPending(game);
        finishRound(room);
      }
      break;
    }
    case "inventorMinus": {
      const target = findPlayedByValue(game, selected.value);
      if (target?.card) {
        target.card.modifiers.push(makeModifier(-3, "발명가"));
        game.log.push(`${target.card.name}에 -3이 올라갔습니다.`);
      }
      clearPending(game);
      finishRound(room);
      break;
    }
    default:
      clearPending(game);
      finishRound(room);
  }
}

function finishRoundByGame(game) {
  clearPending(game);
  settleAll(game);
  game.phase = "choosing";
}

function finishRound(room) {
  const game = room.game;
  if (game.winner !== null) return;
  clearPending(game);
  settleAll(game);
  drawCards(game, 0, 1);
  drawCards(game, 1, 1);
  checkSignetWin(game);
  if (game.winner !== null) {
    game.phase = "ended";
    game.log.push(`${room.players[game.winner].name}님이 승리했습니다.`);
    return;
  }

  game.round += 1;
  game.phase = "choosing";
  checkPlayable(room);
}

function checkPlayable(room) {
  const game = room.game;
  const canPlay = [game.hands[0].length > 0, game.hands[1].length > 0];
  if (canPlay[0] && canPlay[1]) return;

  if (!canPlay[0] && !canPlay[1]) {
    const totals = [totalSignets(game, 0), totalSignets(game, 1)];
    game.winner = totals[0] === totals[1] ? "draw" : (totals[0] > totals[1] ? 0 : 1);
    game.phase = "ended";
    game.log.push("양쪽 모두 낼 카드가 없어 인장 수로 승부를 판정했습니다.");
    return;
  }

  game.winner = canPlay[0] ? 0 : 1;
  game.phase = "ended";
  game.log.push(`${room.players[other(game.winner)].name}님이 낼 카드가 없어 게임이 끝났습니다.`);
}

function checkSignetWin(game) {
  const totals = [totalSignets(game, 0), totalSignets(game, 1)];
  if (totals[0] >= 5 || totals[1] >= 5) {
    if (totals[0] === totals[1]) return;
    game.winner = totals[0] > totals[1] ? 0 : 1;
  }
}

function settleAll(game) {
  for (const encounter of game.encounters) {
    encounter.battleSignets = [0, 0];
    const [left, right] = encounter.cards;
    if (!left && !right) continue;
    if (left && !right) {
      encounter.battleSignets[0] = 1;
      continue;
    }
    if (!left && right) {
      encounter.battleSignets[1] = 1;
      continue;
    }

    const forcedTie = hasActiveMediator(encounter);
    const leftInfluence = effectiveInfluence(left);
    const rightInfluence = effectiveInfluence(right);
    if (forcedTie || leftInfluence === rightInfluence) {
      for (let seat = 0; seat < 2; seat += 1) {
        if (hasActiveJudge(game, seat) && encounter.cards[seat]) {
          encounter.battleSignets[seat] = 1;
        }
      }
      continue;
    }
    encounter.battleSignets[leftInfluence > rightInfluence ? 0 : 1] = 1;
  }
}

function compareCards(game, encounter) {
  const [left, right] = encounter.cards;
  if (!left && !right) return { tie: true };
  if (left && !right) return { tie: false, winner: 0 };
  if (!left && right) return { tie: false, winner: 1 };
  const leftInfluence = effectiveInfluence(left);
  const rightInfluence = effectiveInfluence(right);
  if (leftInfluence === rightInfluence) return { tie: true };
  return { tie: false, winner: leftInfluence > rightInfluence ? 0 : 1 };
}

function hasActiveMediator(encounter) {
  return encounter.cards.some((card) => card && card.baseId === 4 && card.ongoing);
}

function hasActiveJudge(game, seat) {
  return game.encounters.some((encounter) => {
    const card = encounter.cards[seat];
    return card && card.baseId === 8 && card.ongoing;
  });
}

function effectiveInfluence(card) {
  if (!card) return Number.NEGATIVE_INFINITY;
  return card.influence + card.modifiers.reduce((sum, modifier) => sum + modifier.amount, 0);
}

function makeModifier(amount, source) {
  return { amount, source };
}

function boostPreviousAndNext(room, seat) {
  const game = room.game;
  const currentIndex = game.encounters.length - 1;
  const previous = game.encounters[currentIndex - 1];
  if (previous?.cards[seat]) {
    previous.cards[seat].modifiers.push(makeModifier(3, "시계공"));
    game.log.push(`${previous.cards[seat].name}에 +3이 올라갔습니다.`);
  }
  game.nextModifiers[seat].push(makeModifier(3, "시계공"));
  game.log.push("다음에 낼 카드에 +3 보너스가 예약되었습니다.");
}

function drawCards(game, seat, count) {
  for (let drawn = 0; drawn < count; drawn += 1) {
    const card = game.decks[seat].shift();
    if (!card) return;
    game.hands[seat].push(card);
  }
}

function discardTopDeck(game, seat, count) {
  for (let index = 0; index < count; index += 1) {
    const card = game.decks[seat].shift();
    if (!card) return;
    game.discards[seat].push(card);
  }
}

function discardEncounterCards(game, encounterId) {
  const encounter = game.encounters.find((item) => item.id === encounterId);
  if (!encounter) return;
  for (let seat = 0; seat < 2; seat += 1) {
    const card = encounter.cards[seat];
    if (card) {
      card.modifiers = [];
      card.ongoing = false;
      game.discards[seat].push(card);
      encounter.cards[seat] = null;
      encounter.bonusSignets[seat] = 0;
      encounter.battleSignets[seat] = 0;
    }
  }
}

function totalSignets(game, seat) {
  return game.encounters.reduce((sum, encounter) => {
    return sum + encounter.battleSignets[seat] + encounter.bonusSignets[seat];
  }, 0);
}

function removeOneSignet(encounter, side) {
  if (encounter.bonusSignets[side] > 0) {
    encounter.bonusSignets[side] -= 1;
    return;
  }
  if (encounter.battleSignets[side] > 0) {
    encounter.battleSignets[side] -= 1;
  }
}

function ownPlayedOptions(game, seat) {
  return allPlayedOptions(game).filter((option) => option.side === seat);
}

function opponentSignetOptions(game, seat) {
  return allPlayedOptions(game).filter((option) => option.side === other(seat) && option.signets > 0);
}

function allPlayedOptions(game) {
  const options = [];
  for (const encounter of game.encounters) {
    for (let side = 0; side < 2; side += 1) {
      const card = encounter.cards[side];
      if (!card) continue;
      const signets = encounter.battleSignets[side] + encounter.bonusSignets[side];
      options.push({
        value: `${encounter.id}:${side}`,
        encounterId: encounter.id,
        cardId: card.instanceId,
        side,
        label: `${side === 0 ? "왼쪽" : "오른쪽"} ${encounter.round}R - ${card.name} (${effectiveInfluence(card)})`,
        modifierCount: card.modifiers.length,
        signets
      });
    }
  }
  return options;
}

function handOptions(game, seat) {
  return game.hands[seat].map((card) => ({
    value: card.instanceId,
    cardId: card.instanceId,
    label: `${card.name} (${card.influence})`
  }));
}

function findPlayedByValue(game, value) {
  const [encounterId, sideRaw] = String(value).split(":");
  const side = Number(sideRaw);
  const encounter = game.encounters.find((item) => item.id === encounterId);
  if (!encounter || Number.isNaN(side)) return null;
  return { encounter, side, card: encounter.cards[side] };
}

function findCardById(game, cardId) {
  const location = findCardLocation(game, cardId);
  return location?.card || null;
}

function findCardLocation(game, cardId) {
  for (const encounter of game.encounters) {
    for (let side = 0; side < 2; side += 1) {
      if (encounter.cards[side]?.instanceId === cardId) {
        return { encounter, encounterId: encounter.id, side, card: encounter.cards[side] };
      }
    }
  }
  return null;
}

function clearPending(game) {
  game.pending = null;
}

function publicState(room, playerId) {
  const seat = getSeat(room, playerId);
  const game = room.game;
  return {
    roomCode: room.code,
    seat,
    players: room.players.map((player) => player ? {
      name: player.name,
      ready: player.ready,
      connected: true
    } : null),
    lobbyLog: room.log.slice(-20),
    game: game ? publicGameState(game, seat, room.players) : null
  };
}

function publicGameState(game, seat, players) {
  const opponent = seat === -1 ? -1 : other(seat);
  const pendingForPlayer = game.pending && game.pending.player === seat ? game.pending : null;
  return {
    phase: game.phase,
    round: game.round,
    winner: game.winner,
    winnerName: game.winner === "draw" ? "무승부" : (game.winner !== null ? players[game.winner]?.name : null),
    selected: seat === -1 ? [Boolean(game.selected[0]), Boolean(game.selected[1])] : {
      mine: Boolean(game.selected[seat]),
      opponent: Boolean(game.selected[opponent])
    },
    signets: [totalSignets(game, 0), totalSignets(game, 1)],
    deckCounts: [game.decks[0].length, game.decks[1].length],
    discardCounts: [game.discards[0].length, game.discards[1].length],
    handCounts: [game.hands[0].length, game.hands[1].length],
    hand: seat === -1 ? [] : game.hands[seat].map(publicCard),
    opponentHandCount: opponent === -1 ? 0 : game.hands[opponent].length,
    encounters: game.encounters.map((encounter) => publicEncounter(encounter)),
    discards: seat === -1 ? [[], []] : [
      game.discards[seat].map(publicCard),
      game.discards[opponent].map(publicCard)
    ],
    pending: game.pending ? {
      player: game.pending.player,
      mine: Boolean(pendingForPlayer),
      prompt: pendingForPlayer ? game.pending.prompt : "상대가 능력 대상을 고르는 중입니다.",
      options: pendingForPlayer ? game.pending.options : []
    } : null,
    log: game.log.slice(-40)
  };
}

function publicEncounter(encounter) {
  return {
    id: encounter.id,
    round: encounter.round,
    cards: encounter.cards.map(publicCard),
    battleSignets: encounter.battleSignets,
    bonusSignets: encounter.bonusSignets
  };
}

function publicCard(card) {
  if (!card) return null;
  return {
    instanceId: card.instanceId,
    baseId: card.baseId,
    name: card.name,
    faction: FACTIONS[card.faction],
    type: card.type,
    text: card.text,
    influence: card.influence,
    effectiveInfluence: effectiveInfluence(card),
    modifiers: card.modifiers,
    ongoing: card.ongoing
  };
}

function getSeat(room, playerId) {
  return room.players.findIndex((player) => player && player.id === playerId);
}

function normalizeRoomCode(code) {
  return String(code || "").trim().toUpperCase();
}

function other(seat) {
  return seat === 0 ? 1 : 0;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("요청이 너무 큽니다."));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON 형식이 올바르지 않습니다."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function subject(word) {
  return `${word}${hasFinalConsonant(word) ? "이" : "가"}`;
}

function hasFinalConsonant(word) {
  const char = String(word).trim().slice(-1);
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}
