const SIZE = 7;
const boardEl = document.getElementById("board");
const infoEl = document.getElementById("info");

let board = [];
let currentPlayer = "mor";
let selected = null;
let validMoves = [];

/* =====================
   BAŞLAT
===================== */
init();
render();

/* =====================
   OYUN KURULUMU
===================== */
function init() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let c = 0; c < SIZE; c++) {
    board[6][c] = { color: "mor", startRow: 6 };
    board[0][c] = { color: "sari", startRow: 0 };
  }

  updateInfo();
}

/* =====================
   ÇİZİM
===================== */
function render() {
  boardEl.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.onclick = () => onCellClick(r, c);

      if (validMoves.some(m => m.r === r && m.c === c)) {
        cell.classList.add("move");
      }

      if (board[r][c]) {
        const stone = document.createElement("div");
        stone.className = `stone ${board[r][c].color}`;
        cell.appendChild(stone);
      }

      boardEl.appendChild(cell);
    }
  }
}

/* =====================
   TIKLAMA
===================== */
function onCellClick(r, c) {
  if (board[r][c] && board[r][c].color === currentPlayer) {
    selected = { r, c };
    validMoves = getValidMoves(r, c);
    render();
    return;
  }

  if (selected && validMoves.some(m => m.r === r && m.c === c)) {
    moveStone(selected.r, selected.c, r, c);
    
    selected = null;
    validMoves = [];
    switchTurn();
    render();
  }
}

/* =====================
   HAREKET
===================== */
function moveStone(sr, sc, tr, tc) {
  board[tr][tc] = board[sr][sc];
  board[sr][sc] = null;

  handleCaptures(tr, tc);
  checkLose();
}

/* =====================
   GEÇERLİ HAMLELER
===================== */
function getValidMoves(r, c) {
  const stone = board[r][c];
  const dirs = getMoveDirections(r, stone.color);
  const moves = [];

  for (let [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;

    if (!inside(nr, nc)) continue;
    if (board[nr][nc]) continue;
    if (nr === stone.startRow) continue;

    if (violatesOwnLastRowLimit(stone.color, nr)) continue;
    if (createsIllegalFour(r, c, nr, nc)) continue;

    moves.push({ r: nr, c: nc });
  }

  return moves;
}

/* =====================
   YÖN KURALLARI
===================== */
function getMoveDirections(r, color) {
  const up = [-1, 0], down = [1, 0];
  const ul = [-1, -1], ur = [-1, 1];
  const dl = [1, -1], dr = [1, 1];

  if (color === "mor") {
    if (r === 6 || r === 5) return [up, ul, ur];
    if (r === 0) return [down, dl, dr];
    return [up, ul, ur, down, dl, dr];
  }

  if (color === "sari") {
    if (r === 0 || r === 1) return [down, dl, dr];
    if (r === 6) return [up, ul, ur];
    return [up, ul, ur, down, dl, dr];
  }
}

/* =====================
   4 TAŞ YASAĞI
===================== */
function createsIllegalFour(sr, sc, tr, tc) {
  const stone = board[sr][sc];
  board[sr][sc] = null;
  board[tr][tc] = stone;

  const illegal =
    countRow(stone.color, tr) >= 4 ||
    countCol(stone.color, tc) >= 4 ||
    countDiag1(stone.color, tr, tc) >= 4 ||
    countDiag2(stone.color, tr, tc) >= 4;

  board[sr][sc] = stone;
  board[tr][tc] = null;

  return illegal;
}

/* =====================
   SON SATIR 1 TAŞ KURALI
===================== */
function violatesOwnLastRowLimit(color, targetRow) {
  if (color === "mor" && targetRow === 0) {
    return countRow("mor", 0) >= 1;
  }
  if (color === "sari" && targetRow === 6) {
    return countRow("sari", 6) >= 1;
  }
  return false;
}

/* =====================
   SAYMA FONKSİYONLARI
===================== */
function countRow(color, r) {
  return board[r].filter(s => s?.color === color).length;
}

function countCol(color, c) {
  let count = 0;
  for (let r = 0; r < SIZE; r++) {
    if (board[r][c]?.color === color) count++;
  }
  return count;
}

function countDiag1(color, r, c) {
  let count = 0;
  let sr = r, sc = c;
  while (sr > 0 && sc > 0) { sr--; sc--; }
  while (sr < SIZE && sc < SIZE) {
    if (board[sr][sc]?.color === color) count++;
    sr++; sc++;
  }
  return count;
}

function countDiag2(color, r, c) {
  let count = 0;
  let sr = r, sc = c;
  while (sr > 0 && sc < SIZE - 1) { sr--; sc++; }
  while (sr < SIZE && sc >= 0) {
    if (board[sr][sc]?.color === color) count++;
    sr++; sc--;
  }
  return count;
}

/* =====================
   SIKIŞTIRMA
===================== */
function handleCaptures(r, c) {
  const enemy = currentPlayer === "mor" ? "sari" : "mor";
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];

  for (let [dr, dc] of dirs) {
    const a = [r + dr, c + dc];
    const b = [r - dr, c - dc];

    if (
      inside(...a) && inside(...b) &&
      board[a[0]][a[1]]?.color === enemy &&
      board[b[0]][b[1]]?.color === currentPlayer
    ) {
      board[a[0]][a[1]] = null;
    }
  }

  checkLose();
}

/* =====================
   KAZANMA
===================== */
function checkLose() {
  let mor = 0, sari = 0;

  board.flat().forEach(s => {
    if (!s) return;
    s.color === "mor" ? mor++ : sari++;
  });

  if (mor <= 3) {
    alert("SARI KAZANDI");
    gameOver = true;
    window.location.href="index.html";
  }

  if (sari <= 3) {
    alert("MOR KAZANDI");
    gameOver = true;
        window.location.href="index.html";
  }
}

/* =====================
   TUR
===================== */
function switchTurn() {
  currentPlayer = currentPlayer === "mor" ? "sari" : "mor";
  updateInfo();
}

function updateInfo() {
  infoEl.textContent = "Sıra: " + currentPlayer.toUpperCase();
}

/* =====================
   YARDIMCI
===================== */
function inside(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}


/* =====================
   SIKIŞTIRMA (CAPTURE)
   KURAL:
   - Sadece hamle yapan oyuncunun
     sıkıştırdığı rakip taşlar silinir
===================== */
const CAPTURE_DIRS = [
  [1, 0],   // dikey
  [0, 1],   // yatay
  [1, 1],   // çapraz \
  [1, -1]   // çapraz /
];

function handleCaptures(r, c) {
  const player = currentPlayer;                 // hamleyi yapan
  const enemy = player === "mor" ? "sari" : "mor";

  const toRemove = [];

  for (let [dr, dc] of CAPTURE_DIRS) {

    // ileri yön kontrolü: PLAYER - ENEMY - PLAYER
    let r1 = r + dr, c1 = c + dc;
    let r2 = r + 2 * dr, c2 = c + 2 * dc;

    if (
      inside(r2, c2) &&
      board[r1][c1]?.color === enemy &&
      board[r2][c2]?.color === player
    ) {
      toRemove.push({ r: r1, c: c1 });
    }

    // geri yön kontrolü: PLAYER - ENEMY - PLAYER
    r1 = r - dr; c1 = c - dc;
    r2 = r - 2 * dr; c2 = c - 2 * dc;

    if (
      inside(r2, c2) &&
      board[r1][c1]?.color === enemy &&
      board[r2][c2]?.color === player
    ) {
      toRemove.push({ r: r1, c: c1 });
    }
  }

  // Aynı hamlede bulunan TÜM rakip taşları sil
  toRemove.forEach(pos => {
    board[pos.r][pos.c] = null;
  });
}
