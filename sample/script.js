const L_INDEXES = [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18];
const V_INDEXES = [0, 2, 4, 6, 8, 12, 13, 17, 18, 20];
const HANGUL_BASE = 0xac00;
const STORAGE_KEY = "hangul_shuffle_progress_v1";

const gridModeButton = document.getElementById("gridModeButton");
const singleModeButton = document.getElementById("singleModeButton");
const gridView = document.getElementById("gridView");
const singleView = document.getElementById("singleView");
const letterGrid = document.getElementById("letterGrid");
const singleCard = document.getElementById("singleCard");
const singleMeta = document.getElementById("singleMeta");
const shuffleGridButton = document.getElementById("shuffleGridButton");
const shuffleSingleButton = document.getElementById("shuffleSingleButton");
const prevCardButton = document.getElementById("prevCardButton");
const nextCardButton = document.getElementById("nextCardButton");

function buildTableLetters() {
  const letters = [];

  for (const lIndex of L_INDEXES) {
    for (const vIndex of V_INDEXES) {
      const codePoint = HANGUL_BASE + (lIndex * 21 + vIndex) * 28;
      letters.push(String.fromCharCode(codePoint));
    }
  }

  return letters;
}

function shuffle(items) {
  const copied = [...items];

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

const baseLetters = buildTableLetters();

function isValidDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== baseLetters.length) {
    return false;
  }

  const deckSet = new Set(deck);
  if (deckSet.size !== baseLetters.length) {
    return false;
  }

  return baseLetters.every((letter) => deckSet.has(letter));
}

function clampIndex(index) {
  if (!Number.isInteger(index)) {
    return 0;
  }

  if (index < 0 || index >= baseLetters.length) {
    return 0;
  }

  return index;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (!isValidDeck(parsed.deck)) {
      return null;
    }

    const mode = parsed.mode === "single" ? "single" : "grid";
    return {
      deck: parsed.deck,
      index: clampIndex(parsed.index),
      mode,
    };
  } catch {
    return null;
  }
}

let shuffledDeck = shuffle(baseLetters);
let currentCardIndex = 0;
let currentMode = "grid";

const savedProgress = loadProgress();
if (savedProgress) {
  shuffledDeck = savedProgress.deck;
  currentCardIndex = savedProgress.index;
  currentMode = savedProgress.mode;
}

function saveProgress() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        deck: shuffledDeck,
        index: currentCardIndex,
        mode: currentMode,
      }),
    );
  } catch {
    // localStorage가 비활성화된 환경에서는 저장을 건너뜁니다.
  }
}

function renderGrid() {
  letterGrid.innerHTML = "";

  shuffledDeck.forEach((letter, idx) => {
    const tile = document.createElement("div");
    tile.className = "letter";
    tile.style.animationDelay = `${Math.min(idx * 8, 400)}ms`;
    tile.textContent = letter;
    letterGrid.appendChild(tile);
  });
}

function renderSingleCard() {
  const letter = shuffledDeck[currentCardIndex];
  singleCard.textContent = letter;
  singleCard.style.animation = "none";
  void singleCard.offsetWidth;
  singleCard.style.animation = "";
  singleMeta.textContent = `${currentCardIndex + 1} / ${shuffledDeck.length}`;
}

function shuffleDeck() {
  shuffledDeck = shuffle(baseLetters);
  currentCardIndex = 0;
  renderGrid();
  renderSingleCard();
  saveProgress();
}

function moveCard(step) {
  currentCardIndex = (currentCardIndex + step + shuffledDeck.length) % shuffledDeck.length;
  renderSingleCard();
  saveProgress();
}

function setMode(mode) {
  const isGrid = mode === "grid";
  currentMode = isGrid ? "grid" : "single";
  gridView.hidden = !isGrid;
  singleView.hidden = isGrid;
  gridModeButton.classList.toggle("is-active", isGrid);
  singleModeButton.classList.toggle("is-active", !isGrid);
  saveProgress();
}

gridModeButton.addEventListener("click", () => setMode("grid"));
singleModeButton.addEventListener("click", () => setMode("single"));
shuffleGridButton.addEventListener("click", shuffleDeck);
shuffleSingleButton.addEventListener("click", shuffleDeck);
prevCardButton.addEventListener("click", () => moveCard(-1));
nextCardButton.addEventListener("click", () => moveCard(1));

renderGrid();
renderSingleCard();
setMode(currentMode);
