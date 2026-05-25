// assets/js/speed-dungeon.js

/**
 * Structure / pseudo-modules
 *
 * 1. DOM references
 * 2. Configuration constants (per age group)
 * 3. Shared helpers (randomInt, formatTime, ...)
 * 4. Global run state (timer, rooms, power)
 * 5. Fight room (A/D reaction)
 * 6. Lock room (math combination)
 * 7. Image room (object search)
 * 8. Riddle room (multiple choice)
 * 9. Corridor room (3-lane runner)
 * 10. Event wiring / initialization
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------------
  const root = document.getElementById("speed-dungeon-root");
  if (!root) return;

  const statusEl = document.getElementById("sd-status");

  const fightContainer = document.getElementById("sd-fight-container");
  const lockContainer = document.getElementById("sd-lock-container");
  const imageContainer = document.getElementById("sd-image-container");
  const riddleContainer = document.getElementById("sd-riddle-container");
  const corridorContainer = document.getElementById("sd-corridor-container");

  const targetEl = document.getElementById("sd-target");
  const hitsEl = document.getElementById("sd-hits");
  const timeEl = document.getElementById("sd-time");

  const fightImageEl = document.getElementById("sd-fight-image");
  const lockImageEl = document.getElementById("sd-lock-image");
  const riddleImageEl = document.getElementById("sd-riddle-image");
  const bossImageEl = document.getElementById("sd-boss-image");

  const lockQuestionEl = document.getElementById("sd-lock-question");
  const lockAnswersEl = document.getElementById("sd-lock-answers");
  const lockComboEl = document.getElementById("sd-lock-combo");
  const lockAreaEl = document.getElementById("sd-lock-area");


  const imageInstructionEl = document.getElementById("sd-image-instruction");
  const imageEl = document.getElementById("sd-image");
  const imageHotspotsEl = document.getElementById("sd-image-hotspots");

  const riddleQuestionEl = document.getElementById("sd-riddle-question");
  const riddleAnswersEl = document.getElementById("sd-riddle-answers");

  const corridorTrackEl = document.getElementById("sd-corridor-track");
  const bossContainer = document.getElementById("sd-boss-container");
  const bossBgEl = document.getElementById("sd-boss-bg");
  const bossPromptEl = document.getElementById("sd-boss-prompt");
  const bossHintEl = document.getElementById("sd-boss-hint");
  const bossHpBarEl = document.getElementById("sd-boss-hpbar");
  const playerHpBarEl = document.getElementById("sd-player-hpbar");
  const bossEndscreenEl = document.getElementById("sd-boss-endscreen");
  const bossResultTitleEl = document.getElementById("sd-boss-result-title");
  const bossResultTextEl = document.getElementById("sd-boss-result-text");
  const corridorInfoEl = document.getElementById("sd-corridor-info");

  const startDungeonBtn = document.getElementById("sd-start-dungeon-btn");
  const startPanel = document.getElementById("sd-start-panel");

  const mobileControlsEl = document.getElementById("sd-mobile-controls");
  const mobileCorridorControlsEl = document.getElementById("sd-mobile-corridor-controls");
  const mobileFightControlsEl = document.getElementById("sd-mobile-fight-controls");
  const mobileBossControlsEl = document.getElementById("sd-mobile-boss-controls");
  const mobileControlButtons = document.querySelectorAll("[data-sd-mobile-key]");

  const roomsEl = document.getElementById("sd-rooms");
  const powerEl = document.getElementById("sd-power");
  const timerEl = document.getElementById("sd-timer");

  const ageForm = document.getElementById("sd-age-form");

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  const TOTAL_RUN_TIME_MS = 3 * 60 * 1000; // 3 minutes

  const AGE_CONFIG_FIGHT = {
    "0_7": { minMs: 700, maxMs: 900, hitsMin: 3, hitsMax: 5 },
    "8_11": { minMs: 600, maxMs: 800, hitsMin: 5, hitsMax: 8 },
    "12_15": { minMs: 500, maxMs: 700, hitsMin: 8, hitsMax: 12 },
    "16_plus": { minMs: 400, maxMs: 600, hitsMin: 10, hitsMax: 15 }
  };

  const AGE_CONFIG_LOCK = {
    "0_7": { comboMin: 3, comboMax: 3 },
    "8_11": { comboMin: 3, comboMax: 3 },
    "12_15": { comboMin: 3, comboMax: 5 },
    "16_plus": { comboMin: 3, comboMax: 5 }
  };

  const LOCK_DOOR_IMAGES = {
    3: [
      "assets/images/lockgame/door3a.webp",
      "assets/images/lockgame/door3b.webp",
      "assets/images/lockgame/door3c.webp"
    ],
    4: [
      "assets/images/lockgame/door4a.webp",
      "assets/images/lockgame/door4b.webp",
      "assets/images/lockgame/door4c.webp",
      "assets/images/lockgame/door4d.webp"
    ],
    5: [
      "assets/images/lockgame/door5a.webp",
      "assets/images/lockgame/door5b.webp",
      "assets/images/lockgame/door5c.webp"
    ]
  };

  const POWER_GAIN_PER_ROOM = {
    "0_7": 3.5,
    "8_11": 3,
    "12_15": 2.5,
    "16_plus": 2
  };

  // Corridor difficulty per age group
  const AGE_CONFIG_CORRIDOR = {
    "0_7": {
      baseSpeed: 0.60,
      spawnIntervalMs: 600,
      maxObstaclesPerRow: 1,
      chanceEmptyRow: 0.35
    },
    "8_11": {
      baseSpeed: 0.75,
      spawnIntervalMs: 500,
      maxObstaclesPerRow: 2,
      chanceEmptyRow: 0.25
    },
    "12_15": {
      baseSpeed: 0.90,
      spawnIntervalMs: 400,
      maxObstaclesPerRow: 2,
      chanceEmptyRow: 0.20
    },
    "16_plus": {
      baseSpeed: 1.10,
      spawnIntervalMs: 200,
      maxObstaclesPerRow: 2,
      chanceEmptyRow: 0.15
    }
  };

  // ---------------------------------------------------------------------------
  // Global run state (whole dungeon run)
  // ---------------------------------------------------------------------------
  const runState = {
    ageKey: "0_7",
    roomsCleared: 0,
    lastRoomType: null,
    powerPoints: 0,
    currentRoomType: "none", // "none" | "fight" | "lock" | "image" | "riddle" | "corridor"
    runStarted: false,
    runEnded: false,
    timeRemainingMs: TOTAL_RUN_TIME_MS,
    timerIntervalId: null
  };

  // ---------------------------------------------------------------------------
  // Fight room state
  // ---------------------------------------------------------------------------
  const fightState = {
    active: false,
    requiredHits: 0,
    currentHits: 0,
    timeLimitMs: 0,
    currentTarget: null,
    roundTimeoutId: null,
    lastKey: null,
    sameKeyCount: 0,
    countdownActive: false,
    countdownRemaining: 0,
    countdownIntervalId: null,

    // input during current fight round
    roundSuccess: false,
    roundFailed: false
  };


  // ---------------------------------------------------------------------------
  // Lock room state
  // ---------------------------------------------------------------------------
  const lockState = {
    active: false,
    comboLength: 0,
    currentIndex: 0,
    values: [],
    hadWrongChoice: false,
    currentEquation: null,
    doorImage: null,
    selectedAnswerIndex: 0
  };
  // ---------------------------------------------------------------------------
  // Image room state
  // ---------------------------------------------------------------------------
  const imageState = {
    active: false,
    data: null,
    currentImage: null,
    currentTarget: null,
    usedIdsByAge: {}
  };

  // ---------------------------------------------------------------------------
  // Riddle room state
  // ---------------------------------------------------------------------------
  const riddleState = {
    active: false,
    data: null,
    currentRiddle: null,
    hadWrongChoice: false,
    usedIdsByAge: {},
    selectedAnswerIndex: 0
  };

  // ---------------------------------------------------------------------------
  // Corridor room state
  // ---------------------------------------------------------------------------
  const corridorState = {
    active: false,
    durationMs: 0,
    elapsedMs: 0,
    startDelayMs: 0,
    playerLane: 1,
    lanes: 3,
    obstacles: [],
    speed: 0.25,
    spawnIntervalMs: 700,
    spawnAccumulatorMs: 0,
    stuck: false,
    lastObstacleId: 0,
    lastTimestamp: null,
    lastSpawnHadBlock: false,
    lastBlockLane: null
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getSelectedAgeKey() {
    if (!ageForm) return "0_7";
    const radios = ageForm.querySelectorAll('input[name="sd-age"]');
    for (const radio of radios) {
      if (radio.checked) return radio.value;
    }
    return "0_7";
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function updateHudTimer() {
    if (timerEl) timerEl.textContent = formatTime(runState.timeRemainingMs);
  }

  function updateHud() {
    if (roomsEl) roomsEl.textContent = String(runState.roomsCleared);
    if (powerEl) powerEl.textContent = String(runState.powerPoints);
    updateHudTimer();
  }

  function isMobileControlScreen() {
    return window.matchMedia("(max-width: 800px)").matches;
  }

  function hideMobileControls() {
    mobileControlsEl?.classList.add("is-hidden");
    mobileCorridorControlsEl?.classList.add("is-hidden");
    mobileFightControlsEl?.classList.add("is-hidden");
    mobileBossControlsEl?.classList.add("is-hidden");
  }

  function updateMobileControls(roomType = runState.currentRoomType) {
    hideMobileControls();

    if (!isMobileControlScreen()) return;

    if (roomType === "corridor") {
      mobileControlsEl?.classList.remove("is-hidden");
      mobileCorridorControlsEl?.classList.remove("is-hidden");
    } else if (roomType === "fight") {
      mobileControlsEl?.classList.remove("is-hidden");
      mobileFightControlsEl?.classList.remove("is-hidden");
    } else if (roomType === "boss") {
      mobileControlsEl?.classList.remove("is-hidden");
      mobileBossControlsEl?.classList.remove("is-hidden");
    }
  }

  function handleMobileControlKey(key) {
    if (!key) return;

    if (runState.currentRoomType === "corridor") {
      handleCorridorKey(key);
      updateCorridorPlayerPosition();
      return;
    }

    if (runState.currentRoomType === "fight") {
      handleFightKeyPress(key);
      return;
    }

    if (runState.currentRoomType === "boss" || bossState.active) {
      handleBossKey(key);
    }
  }

  function hideAllRooms() {
    fightContainer?.classList.add("is-hidden");
    lockContainer?.classList.add("is-hidden");
    imageContainer?.classList.add("is-hidden");
    riddleContainer?.classList.add("is-hidden");
    corridorContainer?.classList.add("is-hidden");
    if (bossContainer) bossContainer.classList.add("is-hidden");
    hideMobileControls();
  }

  function showFightUi() {
    runState.currentRoomType = "fight";
    fightContainer?.classList.remove("is-hidden");
    lockContainer?.classList.add("is-hidden");
    imageContainer?.classList.add("is-hidden");
    riddleContainer?.classList.add("is-hidden");
    corridorContainer?.classList.add("is-hidden");
    updateMobileControls("fight");
  }

  function showLockUi() {
    runState.currentRoomType = "lock";
    lockContainer?.classList.remove("is-hidden");
    fightContainer?.classList.add("is-hidden");
    imageContainer?.classList.add("is-hidden");
    riddleContainer?.classList.add("is-hidden");
    corridorContainer?.classList.add("is-hidden");
    hideMobileControls();
  }

  function showImageUi() {
    runState.currentRoomType = "image";
    imageContainer?.classList.remove("is-hidden");
    fightContainer?.classList.add("is-hidden");
    lockContainer?.classList.add("is-hidden");
    riddleContainer?.classList.add("is-hidden");
    corridorContainer?.classList.add("is-hidden");
    hideMobileControls();
  }

  const RIDDLE_BACKGROUNDS = [
    "riddle1.webp",
    "riddle2.webp",
    "riddle3.webp",
    "riddle4.webp",
    "riddle5.webp"
  ];

  function showRiddleUi() {
    runState.currentRoomType = "riddle";
    riddleContainer?.classList.remove("is-hidden");
    fightContainer?.classList.add("is-hidden");
    lockContainer?.classList.add("is-hidden");
    imageContainer?.classList.add("is-hidden");
    corridorContainer?.classList.add("is-hidden");
    const bgFile = RIDDLE_BACKGROUNDS[
      randomInt(0, RIDDLE_BACKGROUNDS.length - 1)
    ];

    if (riddleImageEl && bgFile) {
      riddleImageEl.src = `assets/images/riddlegame/${bgFile}`;
      riddleImageEl.alt = "Dungeon riddle room background";
    }

    hideMobileControls();
  }
    
  function showCorridorUi() {
    runState.currentRoomType = "corridor";
    corridorContainer?.classList.remove("is-hidden");
    fightContainer?.classList.add("is-hidden");
    lockContainer?.classList.add("is-hidden");
    imageContainer?.classList.add("is-hidden");
    riddleContainer?.classList.add("is-hidden");
    updateMobileControls("corridor");
  }

  // ---------------------------------------------------------------------------
  // Run timer
  // ---------------------------------------------------------------------------
    
  function startRunIfNeeded() {
    if (runState.runStarted || runState.runEnded) return;

    runState.runStarted = true;
    runState.timeRemainingMs = TOTAL_RUN_TIME_MS;
    updateHudTimer();

    runState.timerIntervalId = window.setInterval(() => {
      if (runState.runEnded) return;

      runState.timeRemainingMs -= 250;
      if (runState.timeRemainingMs <= 0) {
        runState.timeRemainingMs = 0;
        updateHudTimer();
        endRun();
      } else {
        updateHudTimer();
      }
    }, 250);
  }

  function stopRunTimer() {
    if (runState.timerIntervalId !== null) {
      clearInterval(runState.timerIntervalId);
      runState.timerIntervalId = null;
    }
  }

  function resumeRunTimer() {
    if (runState.runEnded) return;
    if (runState.timerIntervalId !== null) return;

    runState.timerIntervalId = window.setInterval(() => {
      if (runState.runEnded) return;

      runState.timeRemainingMs -= 250;
      if (runState.timeRemainingMs <= 0) {
        runState.timeRemainingMs = 0;
        updateHudTimer();
        endRun();
      } else {
        updateHudTimer();
      }
    }, 250);
  }


  // ---------------------------------------------------------------------------
  // Boss Fight
  // ---------------------------------------------------------------------------



  const BOSS_BACKGROUNDS = {
    "0_7":     ["endboss_1a","endboss_1b","endboss_1c"],
    "8_11":    ["endboss_2a","endboss_2b","endboss_2c"],
    "12_15":   ["endboss_3a","endboss_3b","endboss_3c"],
    "16_plus": ["endboss_4a","endboss_4b","endboss_4c"]
  };

  const BOSS_CONFIG = {
    "0_7":     { bossHp: 500, playerHp: 100, bossDmg: 15, timeMs: 1900,  showHint: true  },
    "8_11":    { bossHp: 500, playerHp: 100, bossDmg: 20, timeMs: 1600,  showHint: true  },
    "12_15":   { bossHp: 500, playerHp: 100, bossDmg: 25, timeMs: 1250,  showHint: true },
    "16_plus": { bossHp: 500, playerHp: 100, bossDmg: 30, timeMs: 1000,  showHint: true }
  };

  const bossState = {
    active: false,
    bossHp: 500,
    bossHpMax: 500,
    playerHp: 100,
    playerHpMax: 100,
    phase: "idle",      // idle | attack | open
    phaseTimeoutId: null,
    countdownId: null,
    roundTimeoutId: null,
    currentDodgeKey: null,
    powerPoints: 0,
    bgFile: null,

    // input during current boss round
    roundSuccess: false,
    roundFailed: false
  };

  function startBossCountdown() {
    if (bossState.active || bossState.countdownId !== null) return;

    runState.ageKey = getSelectedAgeKey();
    runState.currentRoomType = "boss";

    fightState.active = false;
    lockState.active = false;
    imageState.active = false;
    riddleState.active = false;
    corridorState.active = false;

    clearFightRoundTimeout();
    clearImageHotspots();
    clearCorridorUi();

    hideAllRooms();
    if (bossContainer) bossContainer.classList.remove("is-hidden");
    updateMobileControls("boss");

    const cfg = BOSS_CONFIG[runState.ageKey];
    bossState.active = false;
    bossState.bossHp = cfg.bossHp;
    bossState.bossHpMax = cfg.bossHp;
    bossState.playerHp = cfg.playerHp;
    bossState.playerHpMax = cfg.playerHp;
    bossState.powerPoints = runState.powerPoints;
    bossState.phase = "idle";
    bossState.currentDodgeKey = null;
    bossState.roundTimeoutId = null;
    bossState.lastKey = null;
    bossState.sameKeyCount = 0;

    // Pick random boss background
    const bgList = BOSS_BACKGROUNDS[runState.ageKey];
    bossState.bgFile = bgList[randomInt(0, bgList.length - 1)];
    if (bossImageEl) {
      bossImageEl.src = `assets/images/endboss/${bossState.bgFile}.webp`;
      bossImageEl.alt = "Dungeon boss background";
    }

    updateBossHpBars();
    if (bossEndscreenEl) bossEndscreenEl.classList.add("is-hidden");
    if (bossPromptEl) bossPromptEl.textContent = "5";
    if (bossHintEl) bossHintEl.textContent = "Final battle: Dodge with A, S, and D. When W appears, press W to attack.";

    // 3-second countdown like fight room
    let count = 5;
    bossState.countdownId = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(bossState.countdownId);
        bossState.countdownId = null;
        startBossFight();
      } else {
        if (bossPromptEl) bossPromptEl.textContent = count;
      }
    }, 1000);
  }

  function startBossFight() {
    bossState.active = true;
    const cfg = BOSS_CONFIG[runState.ageKey];
    setStatus("Boss Fight! Dodge with A/S/D. Attack with W when W appears!");
    if (bossHintEl) bossHintEl.textContent = cfg.showHint ? "Dodge A/S/D · Attack W" : "";
    startBossRound();
  }

  function clearBossRoundTimeout() {
    if (bossState.roundTimeoutId !== null) {
      clearTimeout(bossState.roundTimeoutId);
      bossState.roundTimeoutId = null;
    }
  }

  function pickBossKey() {
    // Weighted pool:
    // A/S/D together = about 60%
    // W = about 40%
    // But no key may appear more than 2 times in a row.
    let pool = ["A", "S", "D", "W", "W"];

    if (bossState.lastKey && bossState.sameKeyCount >= 2) {
      pool = pool.filter((key) => key !== bossState.lastKey);
    }

    const picked = pool[randomInt(0, pool.length - 1)];

    if (picked === bossState.lastKey) {
      bossState.sameKeyCount++;
    } else {
      bossState.lastKey = picked;
      bossState.sameKeyCount = 1;
    }

    return picked;
  }

  function startBossRound() {
    if (!bossState.active) return;

    clearBossRoundTimeout();
    stopBossProgressBar();

    const cfg = BOSS_CONFIG[runState.ageKey];
    const key = pickBossKey();

    bossState.roundSuccess = false;
    bossState.roundFailed = false;

    if (key === "W") {
      bossState.phase = "open";
      bossState.currentDodgeKey = null;

      if (bossPromptEl) {
        bossPromptEl.textContent = "W";
      }

      if (bossHintEl) {
        bossHintEl.textContent = cfg.showHint ? "Attack! Press W" : "";
      }

      startBossProgressBar(cfg.timeMs, false);

      bossState.roundTimeoutId = window.setTimeout(() => {
        if (!bossState.active) return;

        // W window:
        // - W pressed = damage boss
        // - no key pressed = no damage
        // - wrong key pressed = ignored
        if (bossState.roundSuccess && bossState.active) {
          applyPlayerAttack();
        }

        bossState.phase = "idle";
        bossState.currentDodgeKey = null;
        bossState.roundSuccess = false;
        bossState.roundFailed = false;

        if (bossPromptEl) bossPromptEl.textContent = "–";
        if (bossHintEl) bossHintEl.textContent = cfg.showHint ? "Dodge A/S/D · Attack W" : "";

        stopBossProgressBar();

        if (bossState.active) startBossRound();
      }, cfg.timeMs);

    } else {
      bossState.phase = "attack";
      bossState.currentDodgeKey = key;

      if (bossPromptEl) bossPromptEl.textContent = key;
      if (bossHintEl) bossHintEl.textContent = cfg.showHint ? "Dodge!" : "";

      startBossProgressBar(cfg.timeMs, true);

      bossState.roundTimeoutId = window.setTimeout(() => {
        if (!bossState.active) return;

        // Damage only if:
        // 1. player pressed a wrong key, OR
        // 2. player never pressed the correct key
        if (bossState.roundFailed || !bossState.roundSuccess) {
          applyBossDamage();
        } else {
          flashBossPrompt("hit");
        }

        bossState.phase = "idle";
        bossState.currentDodgeKey = null;
        bossState.roundSuccess = false;
        bossState.roundFailed = false;

        if (bossPromptEl) bossPromptEl.textContent = "–";
        if (bossHintEl) bossHintEl.textContent = cfg.showHint ? "Dodge A/S/D · Attack W" : "";

        stopBossProgressBar();

        if (bossState.active) startBossRound();
      }, cfg.timeMs);
    }
  }

  // Progress bar
  function startBossProgressBar(durationMs, isDanger) {
    const bar = document.getElementById("sd-boss-progress-bar");
    const track = document.getElementById("sd-boss-progress-track");
    if (!bar || !track) return;
    track.style.display = "block";
    bar.style.transition = "none";
    bar.style.width = "100%";
    bar.style.background = isDanger ? "#ef4444" : "#22c55e";
    // force reflow
    bar.offsetWidth;
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = "0%";
  }

  function stopBossProgressBar() {
    const bar = document.getElementById("sd-boss-progress-bar");
    const track = document.getElementById("sd-boss-progress-track");
    if (!bar || !track) return;
    track.style.display = "none";
    bar.style.transition = "none";
    bar.style.width = "100%";
  }

  function applyBossDamage() {
    const cfg = BOSS_CONFIG[runState.ageKey];
    bossState.playerHp = Math.max(0, bossState.playerHp - cfg.bossDmg);
    updateBossHpBars();
    flashBossPrompt("miss");
    if (bossState.playerHp <= 0) endBossFight("lose");
  }

  function applyPlayerAttack() {
    const dmg = 10 + bossState.powerPoints;
    bossState.bossHp = Math.max(0, bossState.bossHp - dmg);
    updateBossHpBars();
    flashBossPrompt("hit");
    if (bossState.bossHp <= 0) endBossFight("win");
  }

  function updateBossHpBars() {
    if (bossHpBarEl) {
      bossHpBarEl.style.width = (bossState.bossHp / bossState.bossHpMax * 100) + "%";
    }
    if (playerHpBarEl) {
      playerHpBarEl.style.width = (bossState.playerHp / bossState.playerHpMax * 100) + "%";
    }
  }

  function flashBossPrompt(type) {
    if (!bossPromptEl) return;
    bossPromptEl.classList.remove("sd-target-key--hit", "sd-target-key--miss");
    const cls = type === "hit" ? "sd-target-key--hit" : "sd-target-key--miss";
    bossPromptEl.classList.add(cls);
    window.setTimeout(() => bossPromptEl.classList.remove(cls), 200);
  }

  function endBossFight(result) {
    bossState.active = false;
    hideMobileControls();
    clearBossRoundTimeout();
    if (bossState.countdownId) clearInterval(bossState.countdownId);
    if (bossPromptEl) bossPromptEl.textContent = result === "win" ? "🏆" : "💀";
    if (bossHintEl) bossHintEl.textContent = "";

    if (bossEndscreenEl) bossEndscreenEl.classList.remove("is-hidden");
    if (result === "win") {
      if (bossResultTitleEl) bossResultTitleEl.textContent = "You won!";
      if (bossResultTextEl) bossResultTextEl.textContent = `Boss defeated! You had ${bossState.powerPoints} power points.`;
    } else {
      if (bossResultTitleEl) bossResultTitleEl.textContent = "Game Over";
      if (bossResultTextEl) bossResultTextEl.textContent = "The boss was too powerful. Try again!";
    }
  }

  function handleBossKey(key) {
    if (!bossState.active) return;

    const pressedKey = key.toUpperCase();

    // Only boss keys are relevant
    if (!["A", "S", "D", "W"].includes(pressedKey)) return;

    // Ignore input between rounds
    if (bossState.phase === "idle") return;

    // Dodge phase: shown key must be pressed.
    // Correct key can be pressed multiple times.
    // Any other boss key marks the round as failed.
    if (bossState.phase === "attack") {
      if (pressedKey === bossState.currentDodgeKey) {
        bossState.roundSuccess = true;
        flashBossPrompt("hit");
      } else {
        bossState.roundFailed = true;
        flashBossPrompt("miss");
      }

      return;
    }

    // Open phase: W is the attack window.
    // W pressed = damage boss later when the bar ends.
    // Wrong key = ignored, no player damage.
    if (bossState.phase === "open") {
      if (pressedKey === "W") {
        bossState.roundSuccess = true;
        flashBossPrompt("hit");
      }

      return;
    }
  }


  function endRun() {
    if (runState.runEnded) return;
    runState.runEnded = true;

    stopRunTimer();

    fightState.active = false;
    clearFightRoundTimeout();
    lockState.active = false;
    imageState.active = false;
    riddleState.active = false;
    corridorState.active = false;

    updateFightUi();
    updateLockUi();
    updateImageUi();
    clearRiddleUi();
    clearImageHotspots();
    clearCorridorUi();

    setStatus("Run time is over! Prepare for the Boss Fight...");
    window.setTimeout(() => {
      startBossCountdown();
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Fight room
  // ---------------------------------------------------------------------------
  function pickRandomFightKeyWithLimit() {
    const keys = ["A", "D"];

    while (true) {
      const k = keys[randomInt(0, keys.length - 1)];

      if (k === fightState.lastKey && fightState.sameKeyCount >= 3) {
        continue;
      }

      if (k === fightState.lastKey) {
        fightState.sameKeyCount++;
      } else {
        fightState.lastKey = k;
        fightState.sameKeyCount = 1;
      }

      return k;
    }
  }

  function updateFightUi() {
    // Wenn ein Countdown läuft, zeigen wir nur den Countdown groß an.
    if (fightState.countdownActive) {
      if (targetEl) {
        if (fightState.countdownRemaining > 0) {
          targetEl.textContent = String(fightState.countdownRemaining);
        } else {
          targetEl.textContent = "GO!";
        }
      }
      return;
    }

    // Normale Kampf-UI (Treffer / Zeit – auch wenn wir sie später optisch ausblenden)
    if (hitsEl) {
      hitsEl.textContent = `Hits: ${fightState.currentHits} / ${fightState.requiredHits}`;
    }
    if (timeEl) {
      if (fightState.timeLimitMs > 0) {
        timeEl.textContent = `Time limit: ${fightState.timeLimitMs} ms`;
      } else {
        timeEl.textContent = "Time limit: – ms";
      }
    }
    if (targetEl) {
      targetEl.textContent = fightState.currentTarget || "–";
    }
  }

  function clearFightRoundTimeout() {
    if (fightState.roundTimeoutId !== null) {
      clearTimeout(fightState.roundTimeoutId);
      fightState.roundTimeoutId = null;
    }
  }

  function applyFightRoomReward() {
    const gain = POWER_GAIN_PER_ROOM[runState.ageKey] ?? 1;
    runState.roomsCleared += 1;
    runState.powerPoints += gain;
    updateHud();
  }

  function startFightProgressBar(durationMs) {
    const bar = document.getElementById("sd-fight-progress-bar");
    const track = document.getElementById("sd-fight-progress-track");

    if (!bar || !track) return;

    track.style.display = "block";
    bar.style.transition = "none";
    bar.style.width = "100%";
    bar.style.background = "#ef4444";

    // force browser to apply width before animation starts
    bar.offsetWidth;

    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = "0%";
  }

  function stopFightProgressBar() {
    const bar = document.getElementById("sd-fight-progress-bar");
    const track = document.getElementById("sd-fight-progress-track");

    if (!bar || !track) return;

    track.style.display = "none";
    bar.style.transition = "none";
    bar.style.width = "100%";
  }

  const FIGHT_BACKGROUNDS = {
    "0_7":     ["fight_1a","fight_1b","fight_1c","fight_1d","fight_1e"],
    "8_11":    ["fight_2a","fight_2b","fight_2c","fight_2d","fight_2e"],
    "12_15":   ["fight_3a","fight_3b","fight_3c","fight_3d","fight_3e"],
    "16_plus": ["fight_4a","fight_4b","fight_4c","fight_4d","fight_4e"]
  };

  function startFightRoom() {
    if (runState.runEnded) return;

    runState.ageKey = getSelectedAgeKey();
    const cfg = AGE_CONFIG_FIGHT[runState.ageKey];
    if (!cfg) return;

    const bgList = FIGHT_BACKGROUNDS[runState.ageKey];
    const bgFile = bgList[randomInt(0, bgList.length - 1)];

    if (fightImageEl) {
      fightImageEl.src = `assets/images/fightinggame/${bgFile}.webp`;
      fightImageEl.alt = "Dungeon fight room background";
    }

    lockState.active = false;
    imageState.active = false;
    riddleState.active = false;
    corridorState.active = false;
    clearFightRoundTimeout();
    updateLockUi();
    updateImageUi();
    clearRiddleUi();
    clearCorridorUi();

    fightState.timeLimitMs = randomInt(cfg.minMs, cfg.maxMs);
    fightState.requiredHits = randomInt(cfg.hitsMin, cfg.hitsMax);
    fightState.currentHits = 0;
    fightState.currentTarget = null;

    fightState.lastKey = null;
    fightState.sameKeyCount = 0;

    fightState.countdownActive = true;
    fightState.countdownRemaining = 3;
    if (fightState.countdownIntervalId !== null) {
      clearInterval(fightState.countdownIntervalId);
      fightState.countdownIntervalId = null;
    }

    fightState.active = true;

    showFightUi();

    setStatus("Get ready… fight starts in 3 seconds.");
    updateFightUi();

    startFightCountdown();
  }

  function startFightCountdown() {
    // Globalen Timer für die Dauer des Countdowns anhalten
    stopRunTimer();

    // Sicherstellen, dass kein alter Countdown läuft
    if (fightState.countdownIntervalId !== null) {
      clearInterval(fightState.countdownIntervalId);
      fightState.countdownIntervalId = null;
    }

    fightState.countdownActive = true;
    if (fightState.countdownRemaining <= 0) {
      fightState.countdownRemaining = 3;
    }
    updateFightUi();

    fightState.countdownIntervalId = window.setInterval(() => {
      fightState.countdownRemaining -= 1;

      if (fightState.countdownRemaining > 0) {
        updateFightUi();
      } else {
        // Countdown fertig
        clearInterval(fightState.countdownIntervalId);
        fightState.countdownIntervalId = null;
        fightState.countdownActive = false;

        // Run-Timer starten oder fortsetzen
        if (!runState.runStarted) {
          startRunIfNeeded();
        } else {
          resumeRunTimer();
        }

        setStatus("Fight started! Hit the shown keys (A/D).");
        startFightRound();
      }
    }, 1000);
  }

  function startFightRound() {
    if (!fightState.active || runState.runEnded) return;

    clearFightRoundTimeout();
    stopFightProgressBar();

    fightState.currentTarget = pickRandomFightKeyWithLimit();
    fightState.roundSuccess = false;
    fightState.roundFailed = false;

    updateFightUi();
    setStatus(`Hit the key: ${fightState.currentTarget}`);

    startFightProgressBar(fightState.timeLimitMs);

    fightState.roundTimeoutId = window.setTimeout(() => {
      if (!fightState.active || runState.runEnded) return;

      if (fightState.roundSuccess && !fightState.roundFailed) {
        fightState.currentHits++;
        flashFightFeedback("hit");
        setStatus(`Good! ${fightState.currentTarget} was pressed in time.`);
      } else if (fightState.roundFailed) {
        flashFightFeedback("miss");
        setStatus(`Wrong key! Target was ${fightState.currentTarget}.`);
      } else {
        flashFightFeedback("miss");
        setStatus(`Too slow! Target was ${fightState.currentTarget}.`);
      }

      stopFightProgressBar();

      if (fightState.currentHits >= fightState.requiredHits) {
        finishFightRoom();
      } else {
        fightState.currentTarget = null;
        updateFightUi();

        window.setTimeout(() => {
          if (fightState.active && !runState.runEnded) {
            startFightRound();
          }
        }, 250);
      }
    }, fightState.timeLimitMs);
  }

  function finishFightRoom() {
    clearFightRoundTimeout();
    stopFightProgressBar();

    fightState.active = false;
    fightState.currentTarget = null;
    fightState.roundSuccess = false;
    fightState.roundFailed = false;
    updateFightUi();

    applyFightRoomReward();

    setStatus("Fight room cleared! Rooms and power have been updated. Moving back to the corridor...");

    if (!runState.runEnded) startCorridorRoom();
  }

  function flashFightFeedback(type) {
    if (!targetEl) return;

    // Erst alte Effekte entfernen
    targetEl.classList.remove("sd-target-key--hit", "sd-target-key--miss");

    const cls = type === "hit" ? "sd-target-key--hit" : "sd-target-key--miss";
    targetEl.classList.add(cls);

    // Nach kurzer Zeit wieder zurück auf normal
    window.setTimeout(() => {
      targetEl.classList.remove(cls);
    }, 160);
  }

  function handleFightKeyPress(key) {
    if (!fightState.active || runState.runEnded) return;
    if (runState.currentRoomType !== "fight") return;
    if (!fightState.currentTarget) return;

    const upper = key.toUpperCase();

    // Only A and D matter in the normal fight room
    if (upper !== "A" && upper !== "D") return;

    // Correct key may be pressed multiple times.
    // It only saves success for this round.
    if (upper === fightState.currentTarget) {
      fightState.roundSuccess = true;
      flashFightFeedback("hit");
    } else {
      fightState.roundFailed = true;
      flashFightFeedback("miss");
    }

    // Important:
    // Do NOT clear the timeout here.
    // Do NOT start the next round here.
    // The time bar must always finish first.
  }

  // ---------------------------------------------------------------------------
  // Lock room
  // ---------------------------------------------------------------------------
  function buildChoices(correct, count, rangeLimit, resultMin, resultMax) {
    const choices = [correct];

    while (choices.length < count) {
      const offset = randomInt(1, rangeLimit);
      let wrong = correct + (Math.random() < 0.5 ? offset : -offset);

      wrong = Math.max(resultMin, Math.min(resultMax, wrong));

      if (!choices.includes(wrong)) {
        choices.push(wrong);
      }
    }

    for (let i = choices.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return choices;
  }

  function generateLockEquation(ageKey) {
    if (ageKey === "0_7") {
      while (true) {
        const op = Math.random() < 0.5 ? "+" : "-";
        let a, b, result;
        if (op === "+") {
          a = randomInt(0, 10);
          b = randomInt(0, 10);
          result = a + b;
        } else {
          a = randomInt(0, 20);
          b = randomInt(0, a);
          result = a - b;
        }
        if (result >= 0 && result <= 20) {
          const expression = `${a} ${op} ${b}`;
          const choices = buildChoices(result, 3, 5, 0, 20);
          return { expression, result, choices };
        }
      }
    }

    if (ageKey === "8_11") {
      while (true) {
        const ops = ["+", "-", "*"];
        const op = ops[randomInt(0, ops.length - 1)];
        let a, b, result;

        if (op === "+") {
          a = randomInt(5, 60);
          b = randomInt(5, 40);
          result = a + b;
        } else if (op === "-") {
          a = randomInt(20, 100);
          b = randomInt(0, a);
          result = a - b;
        } else {
          a = randomInt(2, 12);
          b = randomInt(2, 12);
          result = a * b;
        }

        if (result >= 1 && result <= 100) {
          const expression =
            op === "*" ? `${a} × ${b}` : `${a} ${op} ${b}`;
          const choices = buildChoices(result, 3, 15, 1, 100);
          return { expression, result, choices };
        }
      }
    }

    // Age 12–15 and 16+: more complex patterns, 5 choices, results 1–999
    while (true) {
      const pattern = randomInt(0, 2);
      let expression;
      let result;

      if (pattern === 0) {
        const ops = ["+", "-", "*", "/"];
        const op = ops[randomInt(0, ops.length - 1)];
        let a, b;

        if (op === "+") {
          a = randomInt(10, 500);
          b = randomInt(10, 500);
          result = a + b;
        } else if (op === "-") {
          a = randomInt(50, 999);
          b = randomInt(0, a);
          result = a - b;
        } else if (op === "*") {
          a = randomInt(5, 30);
          b = randomInt(3, 30);
          result = a * b;
        } else {
          const divisor = randomInt(2, 20);
          const rVal = randomInt(2, 50);
          a = divisor * rVal;
          b = divisor;
          result = rVal;
        }

        if (result < 1 || result > 999) continue;

        if (op === "*") expression = `${a} × ${b}`;
        else if (op === "/") expression = `${a} ÷ ${b}`;
        else expression = `${a} ${op} ${b}`;
      } else if (pattern === 1) {
        const ops1 = ["+", "-"];
        const ops2 = ["*", "+", "-"];
        const op1 = ops1[randomInt(0, ops1.length - 1)];
        const op2 = ops2[randomInt(0, ops2.length - 1)];

        const a = randomInt(5, 80);
        const b = randomInt(5, 80);
        const c = randomInt(2, 20);

        let t = op1 === "+" ? a + b : a - b;
        if (op2 === "*") result = t * c;
        else if (op2 === "+") result = t + c;
        else result = t - c;

        if (result < 1 || result > 999) continue;

        const inner = `${a} ${op1} ${b}`;
        if (op2 === "*") expression = `(${inner}) × ${c}`;
        else expression = `(${inner}) ${op2} ${c}`;
      } else {
        const a = randomInt(10, 200);
        const b = randomInt(10, 200);
        const c = randomInt(10, 200);
        const useMinus = Math.random() < 0.5;

        result = useMinus ? a + b - c : a + b + c;
        if (result < 1 || result > 999) continue;

        expression = useMinus
          ? `${a} + ${b} - ${c}`
          : `${a} + ${b} + ${c}`;
      }

      const choices = buildChoices(result, 5, 50, 1, 999);
      return { expression, result, choices };
    }
  }

  function applyLockRoomReward(hadWrongChoice) {
    const base = POWER_GAIN_PER_ROOM[runState.ageKey] ?? 1;
    let bonus = 0;

    if (!hadWrongChoice) {
      bonus = 2;
    }

    runState.roomsCleared += 1;
    runState.powerPoints += base + bonus;
    updateHud();
  }

  function updateLockUi() {
    if (!lockState.active) {
      if (lockQuestionEl) {
        lockQuestionEl.textContent =
          "Start the lock room to see a math question.";
      }
      if (lockAnswersEl) lockAnswersEl.innerHTML = "";
      if (lockComboEl) lockComboEl.textContent = "–";
      if (lockImageEl) {
        lockImageEl.src = "";
        lockImageEl.alt = "";
      }
      return;
    }

    const eq = lockState.currentEquation;
    if (lockQuestionEl) {
      lockQuestionEl.textContent = eq
        ? eq.expression
        : "Loading next equation…";
    }

    if (lockAnswersEl) {
      lockAnswersEl.innerHTML = "";
      if (eq) {
        eq.choices.forEach((value, index) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "sd-lock-answer-btn";

          if (index === lockState.selectedAnswerIndex) {
            btn.classList.add("sd-answer-btn--selected");
          }

          btn.textContent = String(value);
          btn.addEventListener("click", () => handleLockAnswerClick(value));
          lockAnswersEl.appendChild(btn);
        });
      }
    }

    if (lockComboEl) {
      if (lockState.values.length === 0) {
        lockComboEl.textContent = "–";
      } else {
        const parts = [];
        for (let i = 0; i < lockState.comboLength; i++) {
          if (i < lockState.values.length) {
            parts.push(String(lockState.values[i]));
          } else {
            parts.push("__");
          }
        }
        lockComboEl.textContent = parts.join(" - ");
      }
    }
  }

  function startLockRoom() {
    if (runState.runEnded) return;

    runState.ageKey = getSelectedAgeKey();
    const cfg = AGE_CONFIG_LOCK[runState.ageKey];
    if (!cfg) return;

    fightState.active = false;
    clearFightRoundTimeout();
    imageState.active = false;
    riddleState.active = false;
    corridorState.active = false;
    updateFightUi();
    updateImageUi();
    clearRiddleUi();
    clearCorridorUi();

    lockState.comboLength = randomInt(cfg.comboMin, cfg.comboMax);
    lockState.currentIndex = 0;
    lockState.values = [];
    lockState.hadWrongChoice = false;
    lockState.selectedAnswerIndex = 0;

    // passende Türbilder-Liste nach Kombination (3 / 4 / 5 Zahlen)
    const doorList = LOCK_DOOR_IMAGES[lockState.comboLength];
    if (Array.isArray(doorList) && doorList.length > 0) {
      const chosen = doorList[randomInt(0, doorList.length - 1)];
      lockState.doorImage = chosen;

      if (lockImageEl) {
        lockImageEl.src = chosen;
        lockImageEl.alt = "Dungeon lock door";
      }
    }

    lockState.active = true;
    lockState.currentEquation = generateLockEquation(runState.ageKey);

    showLockUi();
    startRunIfNeeded();

    setStatus(
      "Lock room started. Solve each equation to build the combination."
    );
    updateLockUi();
  }

  function handleLockAnswerClick(value) {
    if (!lockState.active || runState.runEnded) return;
    if (runState.currentRoomType !== "lock") return;
    const eq = lockState.currentEquation;
    if (!eq) return;

    if (value === eq.result) {
      lockState.values.push(eq.result);
      lockState.currentIndex++;

      if (lockState.currentIndex >= lockState.comboLength) {
        finishLockRoom();
      } else {
        setStatus(
          "Correct! The number was added to the combination. Next equation…"
        );
        lockState.currentEquation = generateLockEquation(runState.ageKey);
        lockState.selectedAnswerIndex = 0;
        updateLockUi();
      }
    } else {
      lockState.hadWrongChoice = true;
      setStatus(
        "That answer is not correct. You can try again – but the room " +
          "will no longer count as perfect."
      );
    }
  }

  function finishLockRoom() {
    lockState.active = false;
    updateLockUi();

    applyLockRoomReward(lockState.hadWrongChoice);

    setStatus(
      lockState.hadWrongChoice
        ? "Lock room cleared! Rooms and power updated (no bonus this time)."
        : "Lock room cleared perfectly! Rooms and power updated with a small bonus."
    );

    if (!runState.runEnded) startCorridorRoom();
  }

  // ---------------------------------------------------------------------------
  // Image room
  // ---------------------------------------------------------------------------
  async function loadImageDataIfNeeded() {
    if (imageState.data) return;

    // Hilfsfunktion: Eine Datei laden, JSON sicher parsen, bei Fehlern [] zurückgeben
    const safeLoad = async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          console.warn(`[ImageRoom] HTTP ${res.status} for ${url}`);
          return [];
        }

        let json;
        try {
          json = await res.json();
        } catch (parseErr) {
          console.error(`[ImageRoom] Failed to parse JSON from ${url}`, parseErr);
          return [];
        }

        // Erlaubte Strukturen:
        // 1) [ ... ]
        if (Array.isArray(json)) return json;
        // 2) { "images": [ ... ] }
        if (Array.isArray(json.images)) return json.images;
        // 3) { "data": [ ... ] }
        if (Array.isArray(json.data)) return json.data;

        // 4) Deine Struktur: { "0_7": [ ... ] } oder { "8_11": [ ... ] } usw.
        const firstKey = Object.keys(json).find((k) =>
          Array.isArray(json[k])
        );
        if (firstKey) {
          return json[firstKey];
        }

        console.warn(
          `[ImageRoom] JSON from ${url} has unexpected shape. Using empty array.`
        );
        return [];
      } catch (err) {
        console.error(`[ImageRoom] Network/error while loading ${url}`, err);
        return [];
      }
    };

    try {
      const [data0_7, data8_11, data12_15, data16_plus] = await Promise.all([
        safeLoad("assets/data/speedDungeon-search0-7.json"),
        safeLoad("assets/data/speedDungeon-search8-11.json"),
        safeLoad("assets/data/speedDungeon-search12-15.json"),
        safeLoad("assets/data/speedDungeon-search16+.json")
      ]);

      imageState.data = {
        "0_7": data0_7,
        "8_11": data8_11,
        "12_15": data12_15,
        "16_plus": data16_plus
      };

    } catch (err) {
      console.error("Failed to load image hunt data (unexpected error):", err);
      imageState.data = {
        "0_7": [],
        "8_11": [],
        "12_15": [],
        "16_plus": []
      };
    }
  }

  function clearImageHotspots() {
    if (imageHotspotsEl) {
      imageHotspotsEl.innerHTML = "";
    }
  }

  function pickRandomImageForAge(ageKey) {
    if (!imageState.data) return null;
    const list = imageState.data[ageKey];
    if (!Array.isArray(list) || list.length === 0) return null;

    // Set für bereits verwendete IDs der Altersgruppe
    if (!imageState.usedIdsByAge[ageKey]) {
      imageState.usedIdsByAge[ageKey] = new Set();
    }
    const used = imageState.usedIdsByAge[ageKey];

    // Alle Bilder, die in dieser Runde noch nicht dran waren
    const available = list.filter(
      (img) => img.id != null && !used.has(img.id)
    );
    // Wenn alle schon benutzt: Reset, aber das aktuelle Bild wird trotzdem
    // zufällig gewählt – so haben wir Zyklen ohne Wiederholung.
    const pool = available.length > 0 ? available : list;

    const chosen = pool[randomInt(0, pool.length - 1)];

    const chosenId = chosen.id;
    if (available.length > 0 && chosenId != null) {
      used.add(chosenId);
    } else if (chosenId != null) {
      // neuer Zyklus: Set zurücksetzen und aktuelle ID eintragen
      imageState.usedIdsByAge[ageKey] = new Set([chosen.id]);
    }

    return chosen;
  }

  function pickRandomTarget(imageObj) {
    if (!imageObj || !Array.isArray(imageObj.targets)) return null;
    if (imageObj.targets.length === 0) return null;
    const idx = randomInt(0, imageObj.targets.length - 1);
    return imageObj.targets[idx];
  }

  function updateImageUi() {
    if (!imageState.active) {
      if (imageInstructionEl) {
        imageInstructionEl.textContent =
          "Start the image room to see a picture and an object to find.";
      }
      if (imageEl) {
        imageEl.src = "";
        imageEl.alt = "";
      }
      clearImageHotspots();
      return;
    }

    const imgObj = imageState.currentImage;
    const target = imageState.currentTarget;

    if (!imgObj || !target) {
      if (imageInstructionEl) {
        imageInstructionEl.textContent =
          "No image data available for this age group yet.";
      }
      if (imageEl) {
        imageEl.src = "";
        imageEl.alt = "";
      }
      clearImageHotspots();
      return;
    }

    if (imageInstructionEl) {
      imageInstructionEl.innerHTML = `
        <span class="sd-image-find-label">Find this object:</span>
        <strong class="sd-image-find-target">${target.name}</strong>
      `;
    }

    if (imageEl) {
      imageEl.src = imgObj.src;
      imageEl.alt = imgObj.alt || "Image hunt scene";
    }

    clearImageHotspots();
    if (!imageHotspotsEl) return;

    imgObj.targets.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sd-image-hotspot-btn";
      btn.dataset.targetId = String(t.id);
      btn.style.left = `${t.x}%`;
      btn.style.top = `${t.y}%`;
      btn.style.width = `${t.width}%`;
      btn.style.height = `${t.height}%`;
      btn.addEventListener("click", () => handleImageHotspotClick(t));
      imageHotspotsEl.appendChild(btn);
    });
  }

  function applyImageRoomReward() {
    const gain = POWER_GAIN_PER_ROOM[runState.ageKey] ?? 1;
    runState.roomsCleared += 1;
    runState.powerPoints += gain;
    updateHud();
  }

  function handleImageHotspotClick(clickedTarget) {
    if (!imageState.active || runState.runEnded) return;
    if (runState.currentRoomType !== "image") return;

    const correctId = imageState.currentTarget?.id;
    if (clickedTarget.id === correctId) {
      applyImageRoomReward();
      imageState.active = false;
      updateImageUi();
      setStatus(
        "Correct object! Image room cleared – rooms and power updated."
      );

      if (!runState.runEnded) startCorridorRoom();

    } else {
      setStatus("That is not the correct object. Try again.");
    }
  }

  async function startImageRoom() {
    if (runState.runEnded) return;

    await loadImageDataIfNeeded();
    if (!imageState.data) {
      setStatus(
        "Image room could not be started – image data is not available yet."
      );
      return;
    }

    runState.ageKey = getSelectedAgeKey();

    fightState.active = false;
    clearFightRoundTimeout();
    lockState.active = false;
    riddleState.active = false;
    corridorState.active = false;
    updateFightUi();
    updateLockUi();
    clearRiddleUi();
    clearCorridorUi();

    const imgObj = pickRandomImageForAge(runState.ageKey);
    if (!imgObj) {
      imageState.active = false;
      updateImageUi();
      setStatus(
        "No image configured for this age group yet. Please add data to the JSON file."
      );
      return;
    }

    const target = pickRandomTarget(imgObj);
    if (!target) {
      imageState.active = false;
      updateImageUi();
      setStatus(
        "The selected image has no targets defined yet. Please update the JSON file."
      );
      return;
    }

    imageState.active = true;
    imageState.currentImage = imgObj;
    imageState.currentTarget = target;

    showImageUi();
    startRunIfNeeded();
    setStatus("Image room started. Find the requested object and click on it.");
    updateImageUi();
  }

  // ---------------------------------------------------------------------------
  // Riddle room
  // ---------------------------------------------------------------------------
  async function loadRiddleDataIfNeeded() {
    if (riddleState.data) return;

    try {
      const [res0_7, res8_11, res12_15, res16_plus] = await Promise.all([
        fetch("assets/data/speedDungeon-riddles0-7.json", { cache: "no-store" }),
        fetch("assets/data/speedDungeon-riddle8-11.json", { cache: "no-store" }),
        fetch("assets/data/speedDungeon-riddle12-15.json", { cache: "no-store" }),
        fetch("assets/data/speedDungeon-riddle16+.json", { cache: "no-store" })
      ]);

      if (!res0_7.ok || !res8_11.ok || !res12_15.ok || !res16_plus.ok) {
        throw new Error(
          `HTTP error while loading riddle data: ` +
            `${res0_7.status}/${res8_11.status}/${res12_15.status}/${res16_plus.status}`
        );
      }

      const [json0_7, json8_11, json12_15, json16_plus] = await Promise.all([
        res0_7.json(),
        res8_11.json(),
        res12_15.json(),
        res16_plus.json()
      ]);

      riddleState.data = {
        "0_7": json0_7.riddles ?? [],
        "8_11": json8_11.riddles ?? [],
        "12_15": json12_15.riddles ?? [],
        "16_plus": json16_plus.riddles ?? []
      };
    } catch (err) {
      console.error("Failed to load riddle data:", err);
      riddleState.data = null;
    }
  }

  function clearRiddleUi() {
    if (riddleQuestionEl) {
      riddleQuestionEl.textContent =
        "Start the riddle room to see a question.";
    }
    if (riddleAnswersEl) {
      riddleAnswersEl.innerHTML = "";
    }
  }

  function pickNextRiddleForAge(ageKey) {
    if (!riddleState.data) return null;
    const list = riddleState.data[ageKey];
    if (!Array.isArray(list) || list.length === 0) return null;

    if (!riddleState.usedIdsByAge[ageKey]) {
      riddleState.usedIdsByAge[ageKey] = new Set();
    }
    const used = riddleState.usedIdsByAge[ageKey];

    // 1. alle noch nicht benutzten
    const available = list.filter((r) => !used.has(r.id));
    // 2. wenn alle schon dran waren, Pool zurücksetzen
    const pool = available.length > 0 ? available : list;

    // 3. zufällige Basis-Frage auswählen
    const base = pool[randomInt(0, pool.length - 1)];

    // 4. Antworten aus JSON bauen (correctAnswer + wrongAnswers)
    const answers = [...(base.wrongAnswers ?? [])];
    answers.push(base.correctAnswer);

    // 5. Antworten mischen
    for (let i = answers.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      const tmp = answers[i];
      answers[i] = answers[j];
      answers[j] = tmp;
    }

    const correctIndex = answers.findIndex(
      (a) => a === base.correctAnswer
    );

    const chosen = {
      id: base.id,
      question: base.question,
      options: answers,
      correctIndex,
      correctAnswer: base.correctAnswer
    };

    // 6. „benutzt“-Liste aktualisieren
    if (available.length > 0) {
      used.add(base.id);
    } else {
      riddleState.usedIdsByAge[ageKey] = new Set([base.id]);
    }

    return chosen;
  }


  function updateRiddleUi() {
    if (!riddleState.active || !riddleState.currentRiddle) {
      clearRiddleUi();
      return;
    }

    const r = riddleState.currentRiddle;

    if (riddleQuestionEl) {
      riddleQuestionEl.textContent = r.question;
    }

    if (!riddleAnswersEl) return;
    riddleAnswersEl.innerHTML = "";

    r.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sd-riddle-answer-btn";

      if (index === riddleState.selectedAnswerIndex) {
        btn.classList.add("sd-answer-btn--selected");
      }

      btn.textContent = opt;
      btn.addEventListener("click", () =>
        handleRiddleAnswerClick(index)
      );
      riddleAnswersEl.appendChild(btn);
    });
  }

  function applyRiddleRoomReward(hadWrongChoice) {
    const base = POWER_GAIN_PER_ROOM[runState.ageKey] ?? 1;
    let bonus = 0;

    if (!hadWrongChoice) {
      bonus = 2;
    }

    runState.roomsCleared += 1;
    runState.powerPoints += base + bonus;
    updateHud();
  }

  function handleRiddleAnswerClick(index) {
    if (!riddleState.active || runState.runEnded) return;
    if (runState.currentRoomType !== "riddle") return;
    const r = riddleState.currentRiddle;
    if (!r) return;

    if (index === r.correctIndex) {
      applyRiddleRoomReward(riddleState.hadWrongChoice);
      riddleState.active = false;
      riddleState.currentRiddle = null;
      updateRiddleUi();

      setStatus(
        riddleState.hadWrongChoice
          ? "Riddle solved! Rooms and power updated (no bonus this time)."
          : "Riddle solved perfectly! Rooms and power updated with a small bonus."
      );

      if (!runState.runEnded) startCorridorRoom();

    } else {
      riddleState.hadWrongChoice = true;
      setStatus(
        "That answer is not correct. You can try again – but the room " +
          "will no longer count as perfect."
      );
    }
  }

  async function startRiddleRoom() {
    if (runState.runEnded) return;

    runState.ageKey = getSelectedAgeKey();

    if (runState.ageKey === "0_7") {
      setStatus(
        "The riddle room is not used for this age group. A different room will be added here in the final game."
      );
      return;
    }

    await loadRiddleDataIfNeeded();
    if (!riddleState.data) {
      setStatus(
        "Riddle room could not be started – riddle data is not available yet."
      );
      return;
    }

    fightState.active = false;
    clearFightRoundTimeout();
    lockState.active = false;
    imageState.active = false;
    corridorState.active = false;
    updateFightUi();
    updateLockUi();
    updateImageUi();
    clearCorridorUi();

    const next = pickNextRiddleForAge(runState.ageKey);
    if (!next) {
      riddleState.active = false;
      clearRiddleUi();
      setStatus(
        "No riddle configured for this age group yet. Please add data to the JSON file."
      );
      return;
    }

    riddleState.active = true;
    riddleState.currentRiddle = next;
    riddleState.hadWrongChoice = false;
    riddleState.selectedAnswerIndex = 0;

    showRiddleUi();
    startRunIfNeeded();

    setStatus(
      "Riddle room started. Read the question carefully and choose your answer."
    );
    updateRiddleUi();
  }

  // ---------------------------------------------------------------------------
  // Corridor room
  // ---------------------------------------------------------------------------
  function clearCorridorUi() {
    if (corridorTrackEl) {
      corridorTrackEl.innerHTML = "";
    }
    if (corridorInfoEl) {
      corridorInfoEl.textContent =
        "Start the corridor to run through 3 lanes and dodge dungeon walls with A and D.";
    }
    corridorState.lastTimestamp = null;
    corridorState.obstacles = [];
    corridorState.stuck = false;
  }

  function createCorridorPlayerEl() {
    if (!corridorTrackEl) return;
    let player = corridorTrackEl.querySelector(".sd-corridor-player");
    if (!player) {
      player = document.createElement("div");
      player.className = "sd-corridor-player";
      corridorTrackEl.appendChild(player);
    }
    return player;
  }

  function updateCorridorPlayerPosition() {
    const player = createCorridorPlayerEl();
    if (!player) return;

    const laneWidth = 100 / corridorState.lanes;
    const xPercent = corridorState.playerLane * laneWidth + laneWidth / 2;
    player.style.left = `${xPercent}%`;
    player.style.bottom = "8%";

    if (corridorState.stuck) {
      player.classList.add("sd-corridor-player--stuck");
    } else {
      player.classList.remove("sd-corridor-player--stuck");
    }
  }

  function renderCorridorObstacles() {
    if (!corridorTrackEl) {
      console.error("[Corridor] corridorTrackEl is NULL – no track element found");
      return;
    }

    // DEBUG: prüfen, ob die Funktion überhaupt läuft

    const old = corridorTrackEl.querySelectorAll(".sd-corridor-obstacle");
    old.forEach((el) => el.remove());

    corridorState.obstacles.forEach((obs) => {
      const el = document.createElement("div");
      el.className = "sd-corridor-obstacle";
      const laneWidth = 100 / corridorState.lanes;
      const xPercent = obs.lane * laneWidth + laneWidth / 2;
      el.style.left = `${xPercent}%`;
      el.style.top = `${obs.y * 100}%`;
      corridorTrackEl.appendChild(el);
    });
  }
  
  function applyCorridorRoomReward() {
    const gain = POWER_GAIN_PER_ROOM[runState.ageKey] ?? 1;
    runState.roomsCleared += 1;
    runState.powerPoints += gain;
    updateHud();
  }

  function pickNextRoom() {
    let rooms = ["fight", "lock", "image", "riddle"];

    // 0–7 currently does not use the riddle room.
    if (runState.ageKey === "0_7") {
      rooms = rooms.filter((room) => room !== "riddle");
    }

    const available = rooms.filter(r => r !== runState.lastRoomType);
    const picked = available[randomInt(0, available.length - 1)];
    runState.lastRoomType = picked;
    if (picked === "fight") startFightRoom();
    else if (picked === "lock") startLockRoom();
    else if (picked === "image") startImageRoom();
    else if (picked === "riddle") startRiddleRoom();
  }

  function startCorridorRoom() {
  if (runState.runEnded) return;

  // Korridor explizit aktivieren
  corridorState.active = true;

  runState.ageKey = getSelectedAgeKey();
  const cfg = AGE_CONFIG_CORRIDOR[runState.ageKey];
  if (!cfg) return;

  // Andere Räume deaktivieren
  fightState.active = false;
  clearFightRoundTimeout();
  lockState.active = false;
  imageState.active = false;
  riddleState.active = false;
  updateFightUi();
  updateLockUi();
  updateImageUi();
  clearRiddleUi();

  // UI leeren (alte Hindernisse weg, Text zurücksetzen)
  clearCorridorUi();

  // Frische Werte setzen
  corridorState.durationMs = randomInt(12000, 15000);      // 12-15 Sekunden
  corridorState.elapsedMs = 0;
  corridorState.startDelayMs = randomInt(500, 505);     // 0,5 s sicherer Start
  corridorState.playerLane = 1;
  corridorState.spawnAccumulatorMs = 0;
  corridorState.stuck = false;
  corridorState.lastTimestamp = null;
  corridorState.obstacles = [];
  corridorState.lastObstacleId = 0;
  corridorState.lastSpawnHadBlock = false;
  corridorState.lastBlockLane = null;

  // Altersabhängige Geschwindigkeit (inkl. 10 % schneller / 5 % langsamer)
  let speedFactor = 1;
  if (runState.ageKey === "12_15" || runState.ageKey === "16_plus") {
    const r = Math.random();
    if (r < 0.33) speedFactor = 1.1;       // 10 % schneller
    else if (r < 0.66) speedFactor = 0.95; // 5 % langsamer
  }

  corridorState.speed = cfg.baseSpeed * speedFactor;
  corridorState.spawnIntervalMs = cfg.spawnIntervalMs;

  // Buttons aktualisieren

  // UI anzeigen
  showCorridorUi();
  startRunIfNeeded();
  updateCorridorPlayerPosition();
  renderCorridorObstacles();

  setStatus(
    "Corridor started. Use A and D to dodge the dungeon walls."
  );

  // Animationsschleife starten
  requestAnimationFrame(corridorLoop);
}

function spawnCorridorRow() {
  const cfg = AGE_CONFIG_CORRIDOR[runState.ageKey];
  if (!cfg) return;

  // Wenn beim letzten Spawn bereits ein Block erzeugt wurde,
  // machen wir diesmal garantiert eine "Pause" (keine neuen Blöcke).
  if (corridorState.lastSpawnHadBlock) {
    corridorState.lastSpawnHadBlock = false;
    return;
  }

  // Diesmal kommt EIN Block auf einer zufälligen Lane
  const lanes = [0, 1, 2];
  let candidateLanes = lanes;

  if (typeof corridorState.lastBlockLane === "number") {
    // Alle Lanes, die NICHT die letzte Block-Lane sind
    candidateLanes = lanes.filter(
      (lane) => lane !== corridorState.lastBlockLane
    );

    // Sicherung: falls aus irgendeinem Grund nichts übrig bleibt,
    // verwenden wir wieder alle Lanes.
    if (candidateLanes.length === 0) {
      candidateLanes = lanes;
    }
  }

  const laneIndex = randomInt(0, candidateLanes.length - 1);
  const lane = candidateLanes[laneIndex];

  corridorState.lastObstacleId += 1;
  corridorState.obstacles.push({
    id: corridorState.lastObstacleId,
    lane: lane,
    y: -0.2 // knapp oberhalb des sichtbaren Bereichs starten
  });

  corridorState.lastSpawnHadBlock = true;
  corridorState.lastBlockLane = lane;
}


    function corridorLoop(timestamp) {
    if (!corridorState.active || runState.runEnded) return;

    // Erstes Frame: Referenz-Zeit setzen
    if (corridorState.lastTimestamp == null) {
      corridorState.lastTimestamp = timestamp;
      requestAnimationFrame(corridorLoop);
      return;
    }

    const deltaMs = timestamp - corridorState.lastTimestamp;
    corridorState.lastTimestamp = timestamp;
    const deltaSec = deltaMs / 1000;

    // Gesamtzeit hochzählen – nur wenn Spieler nicht feststeckt
    if (!corridorState.stuck) {
      corridorState.elapsedMs += deltaMs;
    }

    // Erst nach der sicheren Startphase (1,5–2 Sekunden) Hindernisse bewegen/spawnen
    if (corridorState.elapsedMs > corridorState.startDelayMs) {
      // Nur bewegen/spawnen, wenn der Spieler NICHT feststeckt
      if (!corridorState.stuck) {
        // Hindernisse nach unten bewegen
        corridorState.obstacles.forEach((obs) => {
          obs.y += corridorState.speed * deltaSec;
        });

        // Hindernisse entfernen, die unten raus sind
        corridorState.obstacles = corridorState.obstacles.filter(
          (obs) => obs.y <= 1.1
        );

        // Neue Reihe erzeugen
        corridorState.spawnAccumulatorMs += deltaMs;
        if (corridorState.spawnAccumulatorMs >= corridorState.spawnIntervalMs) {
          corridorState.spawnAccumulatorMs = 0;
          spawnCorridorRow();
        }
      }

      // ---------- Fairness-Check: es muss IMMER eine freie Lane geben ----------
      const blockedLanes = [];
      for (let lane = 0; lane < corridorState.lanes; lane++) {
        if (laneHasBlockingObstacle(lane)) {
          blockedLanes.push(lane);
        }
      }

      if (blockedLanes.length === corridorState.lanes) {
        // Alle Lanes im Gefahrenbereich blockiert – wir räumen eine frei

        // Bevorzugt eine Lane, die NICHT die aktuelle Spieler-Lane ist,
        // damit du irgendwohin ausweichen kannst.
        let candidateLanes = blockedLanes.filter(
          (lane) => lane !== corridorState.playerLane
        );
        if (candidateLanes.length === 0) {
          candidateLanes = blockedLanes.slice();
        }

        const laneToFree =
          candidateLanes.length === 1
            ? candidateLanes[0]
            : candidateLanes[randomInt(0, candidateLanes.length - 1)];

        // In dieser Lane ein Hindernis im Gefahrenbereich löschen
        let indexToRemove = -1;
        let smallestY = 2;
        corridorState.obstacles.forEach((obs, index) => {
          if (
            obs.lane === laneToFree &&
            obs.y >= 0.75 &&
            obs.y <= 0.95 &&
            obs.y < smallestY
          ) {
            smallestY = obs.y;
            indexToRemove = index;
          }
        });

        if (indexToRemove !== -1) {
          corridorState.obstacles.splice(indexToRemove, 1);
        }
      }
      // ---------- Ende Fairness-Check ----------------------------------------

      // Kollision mit der aktuellen Lane prüfen
      const collision = corridorState.obstacles.some(
        (obs) =>
          obs.lane === corridorState.playerLane &&
          obs.y >= 0.75 &&
          obs.y <= 0.95
      );
      corridorState.stuck = collision;
    }

    // UI aktualisieren (Kugel + Hindernisse)
    updateCorridorPlayerPosition();
    renderCorridorObstacles();

    // Infotext unten im Corridor-Bereich
    if (corridorInfoEl) {
      if (corridorState.elapsedMs < corridorState.startDelayMs) {
        corridorInfoEl.textContent =
          "Get ready… no walls for the first moments.";
      } else if (corridorState.stuck) {
        corridorInfoEl.textContent =
          "You are blocked! Move to another lane with A or D.";
      } else {
        corridorInfoEl.textContent =
          "Run forward and dodge the dungeon walls with A and D.";
      }
    }

    // Corridor fertig?
    if (corridorState.elapsedMs >= corridorState.durationMs) {
      corridorState.active = false;
      applyCorridorRoomReward();

      if (!runState.runEnded) pickNextRoom();
      
      return;
    }

    requestAnimationFrame(corridorLoop);
  }


  function laneHasBlockingObstacle(lane) {
    // Prüft, ob auf der Ziel-Lane in der Nähe der Kugel ein Block ist
    return corridorState.obstacles.some(
      (obs) =>
        obs.lane === lane &&
        obs.y >= 0.75 && // ungefähr auf Kugel-Höhe
        obs.y <= 0.95
    );
  }

  function handleCorridorKey(key) {
  if (!corridorState.active || runState.runEnded) return;
  if (runState.currentRoomType !== "corridor") return;

  let targetLane = corridorState.playerLane;

  if (key === "A") {
    targetLane = Math.max(0, corridorState.playerLane - 1);
  } else if (key === "D") {
    targetLane = Math.min(
      corridorState.lanes - 1,
      corridorState.playerLane + 1
    );
  } else {
    return; // andere Tasten ignorieren
  }

  // Wenn wir tatsächlich die Lane wechseln wollen:
  if (targetLane !== corridorState.playerLane) {
    // 1) Prüfen, ob auf der Ziel-Lane direkt ein Block ist -> wie eine Wand
    if (laneHasBlockingObstacle(targetLane)) {
      // Wir laufen nicht seitlich IN einen Block rein
      return;
    }

    // 2) Lane wechseln
    corridorState.playerLane = targetLane;

    // 3) Nach dem Wechsel direkt "entstucken":
    //    Sobald wir auf einer freien Lane sind, soll der Korridor wieder laufen.
    if (!laneHasBlockingObstacle(corridorState.playerLane)) {
      corridorState.stuck = false;
    }

    // 4) Sofort neu zeichnen, damit sich die Kugel sichtbar bewegt
    updateCorridorPlayerPosition();
  }
}

function handleLockKeyboard(key) {
  if (!lockState.active || runState.currentRoomType !== "lock") return;
  if (!lockState.currentEquation) return;

  const choices = lockState.currentEquation.choices;
  if (!Array.isArray(choices) || choices.length === 0) return;

  if (key === "A" || key === "ARROWLEFT") {
    lockState.selectedAnswerIndex =
      (lockState.selectedAnswerIndex - 1 + choices.length) % choices.length;
    updateLockUi();
    return;
  }

  if (key === "D" || key === "ARROWRIGHT") {
    lockState.selectedAnswerIndex =
      (lockState.selectedAnswerIndex + 1) % choices.length;
    updateLockUi();
    return;
  }

  if (key === "ENTER") {
    const value = choices[lockState.selectedAnswerIndex];
    handleLockAnswerClick(value);
  }
}

function handleRiddleKeyboard(key) {
  if (!riddleState.active || runState.currentRoomType !== "riddle") return;
  if (!riddleState.currentRiddle) return;

  const options = riddleState.currentRiddle.options;
  if (!Array.isArray(options) || options.length === 0) return;

  if (key === "A" || key === "ARROWLEFT") {
    riddleState.selectedAnswerIndex =
      (riddleState.selectedAnswerIndex - 1 + options.length) % options.length;
    updateRiddleUi();
    return;
  }

  if (key === "D" || key === "ARROWRIGHT") {
    riddleState.selectedAnswerIndex =
      (riddleState.selectedAnswerIndex + 1) % options.length;
    updateRiddleUi();
    return;
  }

  if (key === "ENTER") {
    handleRiddleAnswerClick(riddleState.selectedAnswerIndex);
  }
}

  // ---------------------------------------------------------------------------
  // Event wiring & init
  // ---------------------------------------------------------------------------
  if (startDungeonBtn) {
    startDungeonBtn.addEventListener("click", () => {
      if (runState.runStarted || runState.runEnded) return;

      runState.ageKey = getSelectedAgeKey();

      if (startPanel) {
        startPanel.classList.add("is-hidden");
      }

      startCorridorRoom();
    });
  }

  mobileControlButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handleMobileControlKey(button.dataset.sdMobileKey);
    });
  });

  window.addEventListener("resize", () => {
    updateMobileControls();
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();

    // Boss-Raum: A/S/D ausweichen, W angreifen
    if (runState.currentRoomType === "boss" || bossState.active) {
      if (["A", "S", "D", "W"].includes(key)) {
        event.preventDefault();
        handleBossKey(key);
      }
      return;
    }

    // Fight-Raum: A/D drücken
    if (runState.currentRoomType === "fight") {
      handleFightKeyPress(event.key);
      return;
    }

    // Lock Room: Antwort mit A/D oder Pfeiltasten wählen, Enter bestätigt
    if (runState.currentRoomType === "lock") {
      if (["A", "D", "ARROWLEFT", "ARROWRIGHT", "ENTER"].includes(key)) {
        event.preventDefault();
        handleLockKeyboard(key);
      }
      return;
    }

    // Riddle Room: Antwort mit A/D oder Pfeiltasten wählen, Enter bestätigt
    if (runState.currentRoomType === "riddle") {
      if (["A", "D", "ARROWLEFT", "ARROWRIGHT", "ENTER"].includes(key)) {
        event.preventDefault();
        handleRiddleKeyboard(key);
      }
      return;
    }

    // Korridor: A/D zum Ausweichen
    if (runState.currentRoomType === "corridor") {
      if (key === "A" || key === "D") {
        event.preventDefault();
        handleCorridorKey(key);
        updateCorridorPlayerPosition();
      }
    }
  });

  updateHud();
  updateFightUi();
  updateLockUi();
  updateImageUi();
  clearRiddleUi();
  clearCorridorUi();
  hideMobileControls();
  setStatus(
    "A brave adventurer enters the Speed Dungeon. You must move from room to room and survive as many challenges as possible before time runs out. In the corridor, dodge the dungeon walls with A and D. In other rooms, you may need to find a hidden object, crack a number lock by solving math problems, react quickly against dangerous creatures, or answer a riddle to move forward.\n\n" +
    "Each cleared room gives you power for the final battle. If you complete a room without mistakes, you earn extra power. After 3 minutes, the final boss appears. Dodge its attacks with A, S, and D, then wait for an opening and strike with W. The stronger you became in the dungeon, the better your chance to defeat the boss."
  );
});
