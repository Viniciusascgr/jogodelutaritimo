// script.js - Ritmo de Luta (Versão 9 Frames)

// --- Elementos do HTML ---
const pressAnyKeyScreen = document.getElementById("press-any-key-screen");
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const startButton = document.getElementById("startButton");
const howToPlayButton = document.getElementById("howToPlayButton");
const howToPlayOverlay = document.getElementById("how-to-play-overlay");
const closeHowToPlay = document.getElementById("closeHowToPlay");
const canvas = document.getElementById("gameCanvas");
const effectsCanvas = document.getElementById("effectsCanvas");

if (!canvas || !effectsCanvas) {
  console.error(
    "ERRO CRÍTICO: Elemento <canvas> ou <effectsCanvas> não encontrado no HTML."
  );
  throw new Error("Canvas não encontrado!");
}

const ctx = canvas.getContext("2d");
const effectsCtx = effectsCanvas.getContext("2d");
const player1HealthBar = document.getElementById("player1-health");
const player2HealthBar = document.getElementById("player2-health");
const player1SpecialBar = document.getElementById("player1-special");
const actionMessage = document.getElementById("action-message");
const requiredKeyDisplay = document.getElementById("required-key-display");
const difficultySelector = document.getElementById("difficulty");
const timeBarContainer = document.getElementById("time-bar-container");
const timeBar = document.getElementById("time-bar");
const victoryScreen = document.getElementById("victory-screen");
const defeatScreen = document.getElementById("defeat-screen");
const playAgainButton = document.getElementById("play-again-button");
const mainMenuButton = document.getElementById("main-menu-button");
const tryAgainButton = document.getElementById("try-again-button");
const backToMenuButton = document.getElementById("back-to-menu-button");
const comboCounter = document.getElementById("combo-counter");
const lowHealthOverlay = document.getElementById("low-health-overlay");
const timingQTEContainer = document.getElementById("timing-qte-container");
const timingQTERing = document.getElementById("timing-qte-ring");
const timingQTEtarget = document.getElementById("timing-qte-target");
const timingQTEKey = document.getElementById("timing-qte-key");
const qteFeedbackText = document.getElementById("qte-feedback-text");

// =========================================================
// === NOVO: SISTEMA DE CARREGAMENTO (9 FRAMES) =====
// =========================================================

// !! ATENÇÃO: Ajuste aqui se a pasta "atack" ou a extensão ".png" estiverem erradas !!
const playerFrameNames = [];
for (let i = 1; i <= 9; i++) {
  // <-- MODIFICADO AQUI com os novos nomes
  playerFrameNames.push(`img/atack/resized_clean_frame_${i}.png`);
}
let playerFrames = []; // Array para guardar as 9 imagens carregadas (Idle + Ataque)

let assetsToLoad = playerFrameNames.length; // Total: 9 imagens
let assetsLoaded = 0;

let playerCurrentFrame = 0; // Índice do frame de animação (0 a 8)
let playerFrameCount = 0;
// Mude este valor para 12, 15, etc. para deixar a animação MAIS LENTA
// Mude para 6, 5, etc. para deixar MAIS RÁPIDA
const PLAYER_ANIMATION_SPEED = 5;
const PLAYER_ATTACK_FRAMES = 9; // Total de frames na animação de ataque
// =========================================================

// ===== SISTEMA DE ANIMAÇÃO =====
let player1State = "idle"; // 'idle', 'attack', 'defend'
let player1AnimTimeout;

// Função para tocar a "animação" de ataque
function playPlayerAttackAnimation() {
  clearTimeout(player1AnimTimeout);
  player1State = "attack";
  playerCurrentFrame = 0; // Reinicia a animação (começa do frame 0, que é resized_clean_frame_1)
  playerFrameCount = 0;
}

// Função para tocar a "animação" de defesa
function playPlayerDefendAnimation() {
  clearTimeout(player1AnimTimeout);
  player1State = "defend";
  playerCurrentFrame = 0; // Usa o frame 0 (resized_clean_frame_1) para defesa
  player1AnimTimeout = setTimeout(() => {
    // Reseta para 'idle' após um tempo
    player1State = "idle";
  }, 500); // Duração da pose de defesa
}

// Função para desenhar o stickman (CPU) parado
function drawStickmanIdle(w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  // Cabeça
  ctx.arc(w / 2, h * 0.15, h * 0.1, 0, Math.PI * 2);
  // Corpo
  ctx.moveTo(w / 2, h * 0.25);
  ctx.lineTo(w / 2, h * 0.6);
  // Braços (parados)
  ctx.moveTo(w / 2, h * 0.35);
  ctx.lineTo(w * 0.2, h * 0.5);
  ctx.moveTo(w / 2, h * 0.35);
  ctx.lineTo(w * 0.8, h * 0.5);
  // Pernas
  ctx.moveTo(w / 2, h * 0.6);
  ctx.lineTo(w * 0.3, h * 0.9);
  ctx.moveTo(w / 2, h * 0.6);
  ctx.lineTo(w * 0.7, h * 0.9);
  ctx.stroke();
}

// --- CONFIGURAÇÕES DO JOGO ---
const GAME_STATE = {
  IDLE: "idle",
  PLAYER_ATTACK: "player_attack",
  OPPONENT_ATTACK: "opponent_attack",
  VICTORY: "victory",
  DEFEAT: "defeat",
};

let gameState = GAME_STATE.IDLE;
const keys = ["a", "s", "d", "f"];
let requiredKey = "";
let startTime = 0;
let timeLimit = 2000;
const MAX_HEALTH = 150;
const LOW_HEALTH_THRESHOLD = MAX_HEALTH * 0.25;
const SPECIAL_MAX = 100;
let SPECIAL_DEFENSE_GAIN = 25;
const SPECIAL_DAMAGE_GAIN = 10;
let difficulty = "medium";
let playerSpecial = 0;
let timeBarInterval;
let particles = [];

// --- VARIÁVEIS DO ESPECIAL ---
let isSpecialActive = false;
let isSpecialQTEActive = false;
const specialSequenceTotal = 7;
let currentSpecialQTE = 0;
let specialHits = 0;
let specialSequence = [];
let specialTimerStart = 0;
let specialRequiredKey = "";
let specialTimeout;
let specialAnimationDuration = 1000;
let specialHitWindow = 120;

// --- SISTEMA DE COMBO ---
let comboCount = 0;
let comboMultiplier = 1;

// --- DEFINIR TAMANHO DO CANVAS ---
canvas.width = 800;
canvas.height = 400;
effectsCanvas.width = 800;
effectsCanvas.height = 400;

// --- DADOS DOS PERSONAGENS ---
let player1 = {
  health: MAX_HEALTH,
  x: 100,
  y: canvas.height / 2 - 64,
  width: 128,
  height: 128,
};

let player2 = {
  health: MAX_HEALTH,
  x: canvas.width - 128 - 100,
  y: canvas.height / 2 - 64,
  width: 128,
  height: 128,
};

// --- EFEITOS DE ANIMAÇÃO ---
let playerShake = false;
let cpuShake = false;
let playerGlow = false;

// --- FUNÇÕES DE EFEITOS ---
function shakePlayer() {
  playerShake = true;
  setTimeout(() => {
    playerShake = false;
  }, 400);
}

function shakeCPU() {
  cpuShake = true;
  setTimeout(() => {
    cpuShake = false;
  }, 400);
}

function glowPlayer() {
  playerGlow = true;
  setTimeout(() => {
    playerGlow = false;
  }, 500);
}

// --- DESENHO ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ====================================================
  // === Desenhar Jogador 1 (Imagens) - MODIFICADO ===
  // ====================================================
  let px = player1.x + (playerShake ? Math.random() * 10 - 5 : 0);
  let py = player1.y + (playerShake ? Math.random() * 10 - 5 : 0);

  ctx.save();
  if (playerGlow) {
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 40;
  }

  // Move o "cursor" (contexto) para a posição do jogador
  ctx.translate(px, py);

  // --- Lógica de Animação ---
  // Só desenha se os assets (imagens) estiverem carregados
  if (assetsLoaded === assetsToLoad) {
    let imageToDraw;

    if (player1State === "attack") {
      // Controla a velocidade da animação
      playerFrameCount++;
      if (playerFrameCount >= PLAYER_ANIMATION_SPEED) {
        playerFrameCount = 0;
        playerCurrentFrame++; // Avança para o próximo frame

        // Se a animação de ataque terminou, volta para "idle"
        if (playerCurrentFrame >= PLAYER_ATTACK_FRAMES) {
          // >= 9
          playerCurrentFrame = 0;
          player1State = "idle";
        }
      }
    } else if (player1State === "defend") {
      playerCurrentFrame = 0; // Frame 0 (resized_clean_frame_1)
    } else {
      // 'idle'
      playerCurrentFrame = 0; // Frame 0 (resized_clean_frame_1)
    }
    // --- Fim da Lógica de Animação ---

    // Desenha o frame correto do array
    // (playerCurrentFrame é o índice 0-8)
    imageToDraw = playerFrames[playerCurrentFrame];

    if (imageToDraw) {
      ctx.drawImage(
        imageToDraw,
        0, // Posição X de destino (já usamos translate)
        0, // Posição Y de destino (já usamos translate)
        player1.width, // Largura final
        player1.height // Altura final
      );
    }
  } // Fim do if (assetsLoaded)

  ctx.restore();
  // =======================================
  // === Fim do Bloco Jogador 1 (Sprite) ===
  // =======================================

  // === Desenhar Jogador 2 (CPU Stickman) ===
  let cx = player2.x + (cpuShake ? Math.random() * 10 - 5 : 0);
  let cy = player2.y + (cpuShake ? Math.random() * 10 - 5 : 0);

  ctx.save();

  // Move o contexto para a posição do CPU E INVERTE
  ctx.translate(cx + player2.width, cy); // Vai para a direita
  ctx.scale(-1, 1); // Inverte horizontalmente

  // Desenha o CPU (sempre parado por enquanto)
  drawStickmanIdle(player2.width, player2.height, "#e74c3c");

  ctx.restore();
}

// --- PARTÍCULAS ---
function drawParticles() {
  effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    effectsCtx.globalAlpha = p.alpha;
    effectsCtx.fillStyle = p.color;
    effectsCtx.beginPath();
    effectsCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    effectsCtx.fill();
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.01;
    p.size -= 0.1;
    if (p.alpha <= 0 || p.size <= 0) {
      particles.splice(i, 1);
      i--;
    }
  }
  effectsCtx.globalAlpha = 1;
}

function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      color,
      alpha: 1,
    });
  }
}

// --- ATUALIZAÇÃO DE UI ---
function updateLowHealthEffect() {
  if (player1.health <= LOW_HEALTH_THRESHOLD && !isSpecialActive) {
    lowHealthOverlay.classList.add("active");
  } else {
    lowHealthOverlay.classList.remove("active");
  }
}

function updateHealthBars() {
  player1HealthBar.style.width = `${(player1.health / MAX_HEALTH) * 100}%`;
  player2HealthBar.style.width = `${(player2.health / MAX_HEALTH) * 100}%`;
  player1SpecialBar.style.width = `${playerSpecial}%`;
  updateLowHealthEffect();
}

function updateTimeBar() {
  if (!requiredKey) {
    timeBarContainer.style.display = "none";
    clearInterval(timeBarInterval);
    return;
  }
  const elapsedTime = Date.now() - startTime;
  const remainingTimeRatio = 1 - elapsedTime / timeLimit;
  timeBar.style.width = `${remainingTimeRatio * 100}%`;
}

function calculateDamage(reactionTime) {
  let maxDamage = 35,
    minDamage = 10;
  if (difficulty === "easy") {
    maxDamage = 40;
    minDamage = 15;
  } else if (difficulty === "hard") {
    maxDamage = 30;
    minDamage = 8;
  }
  let damage = maxDamage - (reactionTime / timeLimit) * (maxDamage - minDamage);
  damage *= comboMultiplier;
  return Math.floor(Math.max(minDamage, damage));
}

// --- TURNOS ---
function startPlayerTurn() {
  gameState = GAME_STATE.PLAYER_ATTACK;
  requiredKey = keys[Math.floor(Math.random() * keys.length)];
  requiredKeyDisplay.innerText = requiredKey.toUpperCase();
  actionMessage.innerText = "Seu turno! Pressione a tecla:";
  startTime = Date.now();
  timeBarContainer.style.display = "block";
  clearInterval(timeBarInterval);
  timeBarInterval = setInterval(updateTimeBar, 50);

  setTimeout(() => {
    if (gameState === GAME_STATE.PLAYER_ATTACK && requiredKey) {
      actionMessage.innerText = "Tempo esgotado! Ataque falhou.";
      requiredKey = "";
      requiredKeyDisplay.innerText = "";
      timeBarContainer.style.display = "none";
      clearInterval(timeBarInterval);
      comboCount = 0;
      comboMultiplier = 1;
      comboCounter.style.display = "none";
      setTimeout(() => checkGameStatus(), 1500);
    }
  }, timeLimit);
}

function startOpponentTurn() {
  gameState = GAME_STATE.OPPONENT_ATTACK;
  requiredKey = keys[Math.floor(Math.random() * keys.length)];
  requiredKeyDisplay.innerText = requiredKey.toUpperCase();
  actionMessage.innerText = "Defenda! Pressione:";
  startTime = Date.now();
  timeBarContainer.style.display = "block";
  clearInterval(timeBarInterval);
  timeBarInterval = setInterval(updateTimeBar, 50);

  let cpuReactionTime = 1000;
  if (difficulty === "easy") cpuReactionTime = 1500;
  else if (difficulty === "hard") cpuReactionTime = 500;

  setTimeout(() => {
    if (gameState === GAME_STATE.OPPONENT_ATTACK && requiredKey) {
      let damage = 0;
      if (difficulty === "easy") damage = 15;
      else if (difficulty === "medium") damage = 20;
      else if (difficulty === "hard") damage = 25;

      player1.health -= damage;
      shakePlayer();
      playerSpecial = Math.min(
        SPECIAL_MAX,
        playerSpecial + SPECIAL_DAMAGE_GAIN
      );
      actionMessage.innerText = `CPU causou ${damage} de dano!`;
      createParticles(
        player1.x + player1.width / 2,
        player1.y + player1.height / 2,
        "#ff0000",
        10
      );
      updateHealthBars();
      requiredKey = "";
      requiredKeyDisplay.innerText = "";
      timeBarContainer.style.display = "none";
      clearInterval(timeBarInterval);
      comboCount = 0;
      comboMultiplier = 1;
      comboCounter.style.display = "none";
      setTimeout(() => checkGameStatus(), 1500);
    }
  }, cpuReactionTime);
}

// --- ESPECIAL ---
function startSpecial() {
  isSpecialActive = true;
  actionMessage.innerText = "";
  requiredKeyDisplay.innerText = "";
  timeBarContainer.style.display = "none";
  comboCounter.style.display = "none";
  gameContainer.classList.add("game-blurred");
  lowHealthOverlay.classList.remove("active");

  currentSpecialQTE = 0;
  specialHits = 0;
  specialSequence = [];

  if (difficulty === "easy") specialAnimationDuration = 1300;
  else if (difficulty === "hard") specialAnimationDuration = 600;
  else specialAnimationDuration = 1000;

  specialHitWindow = 120;

  for (let i = 0; i < specialSequenceTotal; i++) {
    specialSequence.push(keys[Math.floor(Math.random() * keys.length)]);
  }

  glowPlayer();
  timingQTEContainer.style.top = "calc(50% - 150px)";
  timingQTEContainer.style.left = "calc(50% - 150px)";
  timingQTEContainer.style.display = "flex";
  timingQTEContainer.offsetHeight;
  timingQTEContainer.style.opacity = 1;

  runNextSpecialQTE();
}

function runNextSpecialQTE() {
  qteFeedbackText.className = "";
  qteFeedbackText.innerText = "";
  timingQTEtarget.style.borderColor = "#ffcc00";

  if (currentSpecialQTE >= specialSequenceTotal) {
    endSpecial();
    return;
  }

  isSpecialQTEActive = true;
  specialRequiredKey = specialSequence[currentSpecialQTE];

  if (currentSpecialQTE > 0) {
    const marginTop = 20;
    const marginLeft = 20;

    const maxTop = canvas.height - 300 - marginTop;
    const maxLeft = canvas.width - 300 - marginLeft;

    const newTop = Math.floor(Math.random() * maxTop) + marginTop;
    const newLeft = Math.floor(Math.random() * maxLeft) + marginLeft;
    timingQTEContainer.style.top = `${newTop}px`;
    timingQTEContainer.style.left = `${newLeft}px`;
  }

  timingQTEContainer.style.opacity = 1;
  timingQTEKey.innerText = specialRequiredKey.toUpperCase();
  timingQTERing.style.animation = "none";
  timingQTERing.offsetHeight;
  timingQTERing.style.animation = `shrink-animation ${specialAnimationDuration}ms linear forwards`;

  specialTimerStart = Date.now();
  clearTimeout(specialTimeout);
  specialTimeout = setTimeout(() => {
    handleSpecialMiss(false);
  }, specialAnimationDuration);
}

function showQTEFeedback(isHit) {
  if (isHit) {
    qteFeedbackText.innerText = "ACERTOU!";
    qteFeedbackText.className = "hit";
  } else {
    qteFeedbackText.innerText = "ERROU!";
    qteFeedbackText.className = "miss";
  }

  setTimeout(() => {
    if (isSpecialActive && currentSpecialQTE < specialSequenceTotal) {
      qteFeedbackText.innerText = "";
      qteFeedbackText.className = "";
    }
  }, 500);
}

function handleSpecialHit() {
  if (!isSpecialQTEActive) return;

  specialHits++;
  isSpecialQTEActive = false;
  currentSpecialQTE++;
  clearTimeout(specialTimeout);
  showQTEFeedback(true);
  timingQTEtarget.style.borderColor = "#4caf50";
  timingQTERing.style.animation = "none";

  setTimeout(() => {
    if (isSpecialActive && currentSpecialQTE < specialSequenceTotal) {
      timingQTEContainer.style.opacity = 0;
    }
  }, 400);

  setTimeout(runNextSpecialQTE, 500);
}

function handleSpecialMiss(isKeyMiss) {
  if (!isSpecialQTEActive) return;

  isSpecialQTEActive = false;
  clearTimeout(specialTimeout);
  showQTEFeedback(false);
  timingQTERing.style.animation = "none";
  timingQTEContainer.style.opacity = 0;

  setTimeout(endSpecial, 500);
}

function endSpecial() {
  if (!isSpecialActive) return;

  isSpecialActive = false;
  isSpecialQTEActive = false;
  clearTimeout(specialTimeout);
  timingQTEContainer.style.opacity = 0;
  setTimeout(() => {
    timingQTEContainer.style.display = "none";
  }, 150);

  gameContainer.classList.remove("game-blurred");
  updateLowHealthEffect();
  playerSpecial = 0;
  updateHealthBars();
  comboCount = 0;
  comboMultiplier = 1;

  let baseHitDamage = 15;
  if (difficulty === "easy") baseHitDamage = 18;
  else if (difficulty === "hard") baseHitDamage = 12;

  if (specialHits < specialSequenceTotal) {
    if (specialHits === 0) {
      let penaltyDamage = baseHitDamage * specialSequenceTotal;
      player1.health -= penaltyDamage;
      actionMessage.innerText = `FALHA TOTAL! Você toma ${penaltyDamage} de dano!`;
      shakePlayer();
      createParticles(
        player1.x + player1.width / 2,
        player1.y + player1.height / 2,
        "#ff0000",
        30
      );
    } else {
      let totalDamage = specialHits * baseHitDamage;
      player2.health -= totalDamage;
      actionMessage.innerText = `Errou! ${specialHits} / ${specialSequenceTotal} acertos. ${totalDamage} de dano!`;

      // Animação de ataque
      playPlayerAttackAnimation();

      shakeCPU();
      glowPlayer();
      createParticles(
        player2.x + player2.width / 2,
        player2.y + player2.height / 2,
        "#ffcc00",
        30
      );
    }
  } else {
    let totalDamage = specialHits * baseHitDamage;
    totalDamage *= 1.5;
    totalDamage = Math.floor(totalDamage);
    player2.health -= totalDamage;
    actionMessage.innerText = `PERFEITO! ${totalDamage} de dano!`;

    // Animação de ataque
    playPlayerAttackAnimation();

    shakeCPU();
    glowPlayer();
    createParticles(
      player2.x + player2.width / 2,
      player2.y + player2.height / 2,
      "#ffcc00",
      50
    );
  }

  updateHealthBars();
  setTimeout(checkGameStatus, 3000);
}

// --- TELAS FINAIS ---
function showVictoryScreen() {
  gameState = GAME_STATE.VICTORY;
  gameContainer.style.display = "none";
  victoryScreen.style.display = "flex";
}

function showDefeatScreen() {
  gameState = GAME_STATE.DEFEAT;
  gameContainer.style.display = "none";
  defeatScreen.style.display = "flex";
}

function resetGame() {
  player1.health = MAX_HEALTH;
  player2.health = MAX_HEALTH;
  playerSpecial = 0;
  requiredKey = "";
  requiredKeyDisplay.innerText = "";
  actionMessage.innerText = "";
  timeBarContainer.style.display = "none";
  clearInterval(timeBarInterval);

  if (isSpecialActive) {
    clearTimeout(specialTimeout);
    isSpecialActive = false;
    isSpecialQTEActive = false;
  }

  timingQTEContainer.style.opacity = 0;
  timingQTEContainer.style.display = "none";
  timingQTEContainer.style.top = "calc(50% - 150px)";
  timingQTEContainer.style.left = "calc(50% - 150px)";
  timingQTERing.style.animation = "none";
  timingQTEtarget.style.borderColor = "#ffcc00";
  qteFeedbackText.innerText = "";
  qteFeedbackText.className = "";

  gameContainer.classList.remove("game-blurred");
  lowHealthOverlay.classList.remove("active");

  particles = [];
  comboCount = 0;
  comboMultiplier = 1;
  comboCounter.style.display = "none";

  updateHealthBars();
  victoryScreen.style.display = "none";
  defeatScreen.style.display = "none";
  gameContainer.style.display = "block";

  difficulty = difficultySelector.value;
  if (difficulty === "easy") {
    timeLimit = 3000;
    SPECIAL_DEFENSE_GAIN = 25;
  } else if (difficulty === "medium") {
    timeLimit = 2000;
    SPECIAL_DEFENSE_GAIN = 25;
  } else if (difficulty === "hard") {
    timeLimit = 600;
    SPECIAL_DEFENSE_GAIN = 20;
  }

  // Reset animador
  player1State = "idle";
  playerCurrentFrame = 0;
}

function backToMainMenu() {
  clearInterval(timeBarInterval);
  clearTimeout(specialTimeout);

  isSpecialActive = false;
  isSpecialQTEActive = false;
  requiredKey = "";
  gameState = GAME_STATE.IDLE;

  gameContainer.style.display = "none";
  victoryScreen.style.display = "none";
  defeatScreen.style.display = "none";
  startScreen.style.display = "flex";

  gameContainer.classList.remove("game-blurred");
  lowHealthOverlay.classList.remove("active");

  player1.health = MAX_HEALTH;
  player2.health = MAX_HEALTH;
  playerSpecial = 0;
  updateHealthBars();
}

function checkGameStatus() {
  updateHealthBars();
  if (player1.health <= 0) {
    player1.health = 0;
    if (isSpecialActive) endSpecial();
    setTimeout(() => showDefeatScreen(), 1000);
  } else if (player2.health <= 0) {
    player2.health = 0;
    if (isSpecialActive) endSpecial();
    setTimeout(() => showVictoryScreen(), 1000);
  } else {
    if (!isSpecialActive) {
      if (gameState === GAME_STATE.PLAYER_ATTACK) {
        startOpponentTurn();
      } else {
        startPlayerTurn();
      }
    }
  }
}

// --- HANDLER DE TECLAS ---
function gameKeyHandler(event) {
  const key = event.key.toLowerCase();

  if (gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT) {
    return;
  }

  // LÓGICA DO ESPECIAL
  if (isSpecialActive) {
    if (!isSpecialQTEActive) return;

    let elapsed = Date.now() - specialTimerStart;
    let hitStartTime = specialAnimationDuration - specialHitWindow;

    if (key === specialRequiredKey) {
      if (elapsed >= hitStartTime && elapsed <= specialAnimationDuration) {
        handleSpecialHit();
      } else {
        handleSpecialMiss(true);
      }
    } else if (keys.includes(key)) {
      handleSpecialMiss(true);
    }
    return;
  }

  // CHEAT ESPECIAL
  if (key === "arrowup") {
    playerSpecial = SPECIAL_MAX;
    updateHealthBars();
    console.log("CHEAT: Especial Carregado!");
    return;
  }

  // LÓGICA NORMAL
  if (key === requiredKey) {
    const reactionTime = Date.now() - startTime;

    if (reactionTime <= timeLimit) {
      const damage = calculateDamage(reactionTime);

      if (gameState === GAME_STATE.PLAYER_ATTACK) {
        player2.health -= damage;
        shakeCPU();

        // Animação de ataque
        playPlayerAttackAnimation();

        actionMessage.innerText = `Você causou ${damage} de dano!`;
        createParticles(
          player2.x + player2.width / 2,
          player2.y + player2.height / 2,
          "#3498db",
          10
        );
        comboCount++;
        comboMultiplier = 1 + comboCount * 0.1;
      } else if (gameState === GAME_STATE.OPPONENT_ATTACK) {
        actionMessage.innerText = "Defesa bem-sucedida!";
        playerSpecial = Math.min(
          SPECIAL_MAX,
          playerSpecial + SPECIAL_DEFENSE_GAIN
        );
        shakePlayer();

        // Animação de defesa
        playPlayerDefendAnimation();

        createParticles(
          player1.x + player1.width / 2,
          player1.y + player1.height / 2,
          "#00ff00",
          15
        );
        comboCount++;
        comboMultiplier = 1 + comboCount * 0.1;
      }

      comboCounter.innerText = `COMBO x${comboCount}`;
      comboCounter.style.display = "block";
      comboCounter.style.transform = "scale(1.1)";
      setTimeout(() => {
        comboCounter.style.transform = "scale(1)";
      }, 100);
    } else {
      actionMessage.innerText = "Tarde demais!";
      comboCount = 0;
      comboMultiplier = 1;
      comboCounter.style.display = "none";
    }

    updateHealthBars();
    requiredKey = "";
    requiredKeyDisplay.innerText = "";
    timeBarContainer.style.display = "none";
    clearInterval(timeBarInterval);
    setTimeout(() => checkGameStatus(), 1500);
  } else if (key === " " && playerSpecial === SPECIAL_MAX && !isSpecialActive) {
    startSpecial();
  } else if (key !== " " && requiredKey && keys.includes(key)) {
    let errorDamage = 8;
    if (difficulty === "hard") errorDamage = 15;
    else if (difficulty === "easy") errorDamage = 4;

    if (gameState === GAME_STATE.PLAYER_ATTACK) {
      shakePlayer();
      actionMessage.innerText = `Você errou o ataque! Tomou ${errorDamage} de dano!`;
      player1.health -= errorDamage;
      createParticles(
        player1.x + player1.width / 2,
        player1.y + player1.height / 2,
        "#ff0000",
        10
      );
    } else if (gameState === GAME_STATE.OPPONENT_ATTACK) {
      shakePlayer();
      actionMessage.innerText = `Você errou a defesa! Tomou ${errorDamage} de dano!`;
      player1.health -= errorDamage;
      createParticles(
        player1.x + player1.width / 2,
        player1.y + player1.height / 2,
        "#ff0000",
        10
      );
    }

    updateHealthBars();
    requiredKey = "";
    requiredKeyDisplay.innerText = "";
    timeBarContainer.style.display = "none";
    clearInterval(timeBarInterval);
    comboCount = 0;
    comboMultiplier = 1;
    comboCounter.style.display = "none";
    setTimeout(() => checkGameStatus(), 1500);
  }
}

// --- EVENTOS ---
startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameContainer.style.display = "block";
  resetGame();
  startPlayerTurn();
});

playAgainButton.addEventListener("click", () => {
  resetGame();
  startPlayerTurn();
});

mainMenuButton.addEventListener("click", backToMainMenu);

tryAgainButton.addEventListener("click", () => {
  resetGame();
  startPlayerTurn();
});

backToMenuButton.addEventListener("click", backToMainMenu);

howToPlayButton.addEventListener("click", () => {
  howToPlayOverlay.style.display = "flex";
});

closeHowToPlay.addEventListener("click", () => {
  howToPlayOverlay.style.display = "none";
});

// --- LOOP PRINCIPAL ---
function gameLoop() {
  draw();
  drawParticles();
  requestAnimationFrame(gameLoop);
}

// ===================================
// --- INICIALIZAÇÃO (MODIFICADA) ---
// ===================================

// Função chamada quando um asset (imagem) termina de carregar
function onAssetLoad() {
  assetsLoaded++;
  // Atualiza a tela de loading
  pressAnyKeyScreen.querySelector(
    "h1"
  ).innerText = `Carregando... (${assetsLoaded}/${assetsToLoad})`;

  if (assetsLoaded === assetsToLoad) {
    // Todos os assets carregados
    pressAnyKeyScreen.querySelector("h1").innerText =
      "Aperte qualquer tecla para continuar";
    document.addEventListener("keydown", startGameSequence);
  }
}

// Função que inicia o carregamento de todas as imagens
function loadAssets() {
  pressAnyKeyScreen.querySelector(
    "h1"
  ).innerText = `Carregando... (0/${assetsToLoad})`;

  // Carrega todos os 9 frames
  for (let i = 0; i < playerFrameNames.length; i++) {
    const img = new Image();
    img.src = playerFrameNames[i];
    img.onload = onAssetLoad;
    img.onerror = () => {
      console.error("Erro ao carregar imagem:", playerFrameNames[i]);
      onAssetLoad(); // Conta mesmo se der erro, para não travar o jogo
    };
    playerFrames.push(img);
  }
}

function startGameSequence() {
  pressAnyKeyScreen.style.display = "none";
  startScreen.style.display = "flex";
  document.removeEventListener("keydown", startGameSequence);
  document.addEventListener("keydown", gameKeyHandler);
}

window.addEventListener("DOMContentLoaded", () => {
  startScreen.style.display = "none";
  gameContainer.style.display = "none";
  victoryScreen.style.display = "none";
  defeatScreen.style.display = "none";
  howToPlayOverlay.style.display = "none";
  pressAnyKeyScreen.style.display = "flex";

  // Inicia o carregamento dos assets
  loadAssets();
});

// Inicia o loop do jogo
gameLoop();
