"use strict";


const SIZE = 7;
const boardEl = document.getElementById("board");
const infoEl = document.getElementById("info");

let board = [];
let currentPlayer = "mor"; // MOR = oyuncu, SARI = bot
let selected = null;
let validMoves = [];
let gameOver = false;
let Yemekontrol=false;
let Satirk;
let Satirg;
let Sutunk;
let Sutung;

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
   TIKLAMA (SADECE MOR)
===================== */
function onCellClick(r, c) {
  if (gameOver) return;

  // SARI = BOT → TIKLANAMAZ
  if (currentPlayer === "sari") return;

if (board[r][c] && board[r][c].color === "mor") {
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

    setTimeout(botMoveEasy, 500);
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
   BOT - KOLAY
===================== */
function botMoveEasy() {

  sariZorunluYemeBul();

  if (Yemekontrol === false) {

    // 🔵 SAVUNMA HAMLESİ BUL
    const hamle = savunmaHamlesiBul();

    if (hamle) {
      moveStone(hamle.sr, hamle.sc, hamle.tr, hamle.tc);
    }

  } else {

    // 🔴 ZORUNLU YEME
    moveStone(Satirk, Sutunk, Satirg, Sutung);

    Yemekontrol = false;
  }

  switchTurn();
  render();
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
   SON SATIR 1 TAŞ
===================== */
function violatesOwnLastRowLimit(color, row) {
  if (color === "mor" && row === 0) return countRow("mor", 0) >= 1;
  if (color === "sari" && row === 6) return countRow("sari", 6) >= 1;
  return false;
}

/* =====================
   SAYMA
===================== */
function countRow(color, r) {
  return board[r].filter(s => s?.color === color).length;
}

function countCol(color, c) {
  return board.reduce((n, row) => n + (row[c]?.color === color), 0);
}

function countDiag1(color, r, c) {
  let sr = r, sc = c, cnt = 0;
  while (sr > 0 && sc > 0) { sr--; sc--; }
  while (sr < SIZE && sc < SIZE) {
    if (board[sr][sc]?.color === color) cnt++;
    sr++; sc++;
  }
  return cnt;
}

function countDiag2(color, r, c) {
  let sr = r, sc = c, cnt = 0;
  while (sr > 0 && sc < SIZE - 1) { sr--; sc++; }
  while (sr < SIZE && sc >= 0) {
    if (board[sr][sc]?.color === color) cnt++;
    sr++; sc--;
  }
  return cnt;
}

/* =====================
   SIKIŞTIRMA
===================== */
const CAPTURE_DIRS = [[1,0],[0,1],[1,1],[1,-1]];

function handleCaptures(r, c) {
  const enemy = currentPlayer === "mor" ? "sari" : "mor";
  const player = currentPlayer;

  CAPTURE_DIRS.forEach(([dr, dc]) => {
    [[dr,dc],[-dr,-dc]].forEach(([a,b]) => {
      const r1=r+a,c1=c+b,r2=r+2*a,c2=c+2*b;
      if (
        inside(r2,c2) &&
        board[r1]?.[c1]?.color===enemy &&
        board[r2]?.[c2]?.color===player
      ) 
      board[r1][c1]=null;
    });
  });
}

/* =====================
   KAZANMA
===================== */
function checkLose() {
  let mor=0,sari=0;
  board.flat().forEach(s=>{
    if(!s)return;
    s.color==="mor"?mor++:sari++;
  });

  if(mor<=3){alert("SARI KAZANDI");gameOver=true;    window.location.href="index.html";}
  if(sari<=3){alert("MOR KAZANDI");gameOver=true;    window.location.href="index.html";}
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
function inside(r,c){
  return r>=0&&r<SIZE&&c>=0&&c<SIZE;
}


function cloneBoard(board) {
  return board.map(row =>
    row.map(cell => cell ? { ...cell } : null)
  );
}


function countMor(b) {
  let n = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c]?.color === "mor") n++;
    }
  }
  return n;
}


function simulateCaptures(b, r, c, color) {
  const enemy = color === "sari" ? "mor" : "sari";
  let eaten = 0;

  CAPTURE_DIRS.forEach(([dr, dc]) => {
    [[dr, dc], [-dr, -dc]].forEach(([a, b2]) => {
      const r1 = r + a, c1 = c + b2;
      const r2 = r + 2 * a, c2 = c + 2 * b2;

      if (
        inside(r2, c2) &&
        b[r1]?.[c1]?.color === enemy &&
        b[r2]?.[c2]?.color === color
      ) {
        eaten++;
      }
    });
  });

  return eaten;
}



function sariZorunluYemeBul() {
  let enCokYeme = 0;
  let enIyiHamle = null;

  Yemekontrol = false;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {

      if (board[r][c]?.color !== "sari") continue;

      const moves = getValidMoves(r, c);

      for (let m of moves) {

        // 🔁 tahta kopyala
        const testBoard = cloneBoard(board);

        // hamleyi uygula
        testBoard[m.r][m.c] = testBoard[r][c];
        testBoard[r][c] = null;

        // kaç mor yiyor?
        const yemeSayisi = simulateCaptures(
          testBoard,
          m.r,
          m.c,
          "sari"
        );

        if (yemeSayisi > enCokYeme) {
          enCokYeme = yemeSayisi;
          enIyiHamle = {
            sr: r,
            sc: c,
            tr: m.r,
            tc: m.c
          };
        }
      }
    }
  }

  // ✅ en az 1 yeme varsa
  if (enIyiHamle && enCokYeme > 0) {
    Yemekontrol = true;
    Satirk = enIyiHamle.sr;
    Sutunk = enIyiHamle.sc;
    Satirg = enIyiHamle.tr;
    Sutung = enIyiHamle.tc;

    console.log(
      "🍽️ ZORUNLU YEME:",
      `(${Satirk},${Sutunk}) → (${Satirg},${Sutung})`,
      "Yeme:", enCokYeme
    );

    return enIyiHamle;
  }

  return null;
}


function morSariYiyorMu(testBoard) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {

      if (testBoard[r][c]?.color !== "mor") continue;

      const moves = getValidMoves(r, c);

      for (let m of moves) {
        const temp = cloneBoard(testBoard);

        temp[m.r][m.c] = temp[r][c];
        temp[r][c] = null;

        if (simulateCaptures(temp, m.r, m.c, "mor") > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function sariTaslarSikisiyorMu(b) {
  const liste = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c]?.color !== "sari") continue;

      const moves = getValidMoves(r, c);
      if (moves.length === 0) {
        liste.push({ r, c });
      }
    }
  }
  return liste;
}

function morTasSikisiyorMu(testBoard) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (testBoard[r][c]?.color !== "mor") continue;

      const moves = getValidMoves(r, c);
      if (moves.length === 0) {
        return true;
      }
    }
  }
  return false;
}

function pozisyonSkoru(r, c, testBoard) {
  let skor = 0;

  // rakibin başladığı yere yaklaşmak
  skor += (r === 6 ? 6 : 0);

  // kenar bonusu
  if (r === 0 || r === 6 || c === 0 || c === 6) skor += 3;

  // köşe
  if ((r === 0 || r === 6) && (c === 0 || c === 6)) skor += 5;

  // mor arkaya sızmış mı?
  for (let mr = 0; mr < SIZE; mr++) {
    for (let mc = 0; mc < SIZE; mc++) {
      if (testBoard[mr][mc]?.color === "mor" && mr > r) {
        skor -= 6;
      }
    }
  }

  return skor;
}
function savunmaHamlesiBul() {

  let enIyiHamle = null;
  let enIyiSkor = -Infinity;

  // 🔴 1️⃣ SIKIŞAN SARI VAR MI?
  const sikisanTaslar = sariTaslarSikisiyorMu(board);

  if (sikisanTaslar.length > 0) {

    for (let tas of sikisanTaslar) {
      const moves = getValidMoves(tas.r, tas.c);

      for (let m of moves) {
        const testBoard = cloneBoard(board);

        testBoard[m.r][m.c] = testBoard[tas.r][tas.c];
        testBoard[tas.r][tas.c] = null;

        // ❌ KAÇIŞ SONRASI MOR YİYEBİLİYOR MU?
        if (morSariYiyorMu(testBoard)) continue;

        let skor =
          koseBonusu(m.r, m.c) +
          kenarBonusu(m.r, m.c) -
          merkezCezasi(m.r, m.c);

        if (skor > enIyiSkor) {
          enIyiSkor = skor;
          enIyiHamle = { sr: tas.r, sc: tas.c, tr: m.r, tc: m.c };
        }
      }
    }
  }

  // 🟡 2️⃣ MORU SIKIŞTIRAN HAMLE VAR MI?
  if (!enIyiHamle) {

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c]?.color !== "sari") continue;

        const moves = getValidMoves(r, c);

        for (let m of moves) {
          const testBoard = cloneBoard(board);

          testBoard[m.r][m.c] = testBoard[r][c];
          testBoard[r][c] = null;

          if (morSariYiyorMu(testBoard)) continue;

          if (morTasSikisiyorMu(testBoard)) {

            let skor =
              15 +
              koseBonusu(m.r, m.c) +
              kenarBonusu(m.r, m.c);

            if (skor > enIyiSkor) {
              enIyiSkor = skor;
              enIyiHamle = { sr: r, sc: c, tr: m.r, tc: m.c };
            }
          }
        }
      }
    }
  }

  // 🟢 3️⃣ EN GÜVENLİ HAMLE
  if (!enIyiHamle) {

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c]?.color !== "sari") continue;

        const moves = getValidMoves(r, c);

        for (let m of moves) {
          const testBoard = cloneBoard(board);

          testBoard[m.r][m.c] = testBoard[r][c];
          testBoard[r][c] = null;

          if (morSariYiyorMu(testBoard)) continue;

          let skor =
            koseBonusu(m.r, m.c) +
            kenarBonusu(m.r, m.c);

          if (skor > enIyiSkor) {
            enIyiSkor = skor;
            enIyiHamle = { sr: r, sc: c, tr: m.r, tc: m.c };
          }
        }
      }
    }
  }

  // 🟣 4️⃣ EMNİYET: MUTLAKA HAMLE DÖNER
  if (!enIyiHamle) {

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c]?.color !== "sari") continue;

        const moves = getValidMoves(r, c);
        if (moves.length > 0) {
          const m = moves[0];
          enIyiHamle = { sr: r, sc: c, tr: m.r, tc: m.c };
          break;
        }
      }
      if (enIyiHamle) break;
    }
  }

  return enIyiHamle;
}



function koseBonusu(r, c) {
  if (
    (r === 0 && c === 0) ||
    (r === 0 && c === SIZE - 1) ||
    (r === SIZE - 1 && c === 0) ||
    (r === SIZE - 1 && c === SIZE - 1)
  ) {
    return 5;
  }
  return 0;
}
function kenarBonusu(r, c) {
  if (r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1) {
    return 3;
  }
  return 0;
}
function merkezCezasi(r, c) {
  const merkez = Math.floor(SIZE / 2);
  const uzaklik = Math.abs(r - merkez) + Math.abs(c - merkez);
  return uzaklik; // merkeze yaklaştıkça ceza azalır
}
