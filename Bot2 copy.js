

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

const arrowCanvas = document.getElementById("arrowCanvas");
const arrowCtx = arrowCanvas.getContext("2d");

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
 
 arrowCanvas.width = boardEl.offsetWidth;
arrowCanvas.height = boardEl.offsetHeight;
arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
 
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

  findBestSariMove();
  if (gameOver || currentPlayer !== "sari") return;

  let moves = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]?.color === "sari") {
        const m = getValidMoves(r, c);
        m.forEach(x => {
          moves.push({ sr: r, sc: c, tr: x.r, tc: x.c });
        });
      }
    }
  }

  if (moves.length === 0) {
    alert("MOR KAZANDI");
    gameOver = true;
    return;
  }
 if (Yemekontrol === false) {

  // 🔵 ÖNCE SAVUNMA VAR MI?
  const savunma = savunmaHamlesiBul();

  if (savunma) {
    console.log("🛡️ SAVUNMA HAMLESİ");
    moveStone(savunma.sr, savunma.sc, savunma.tr, savunma.tc);
  } else {
    // ❌ rastgele yok → basit mantıklı hamle
    const move = moves[0];
    moveStone(move.sr, move.sc, move.tr, move.tc);
  }

}

 else
 {
  moveStone(Satirk,Sutunk,Satirg,Sutung)
  Yemekontrol=false;
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

  pendingCaptures = [];

  CAPTURE_DIRS.forEach(([dr, dc]) => {
    [[dr, dc], [-dr, -dc]].forEach(([a, b]) => {
      const r1 = r + a, c1 = c + b;
      const r2 = r + 2 * a, c2 = c + 2 * b;

      if (
        inside(r2, c2) &&
        board[r1]?.[c1]?.color === enemy &&
        board[r2]?.[c2]?.color === player
      ) {
        pendingCaptures.push({
          eaten: { r: r1, c: c1 },
          captors: [
            { r, c },
            { r: r2, c: c2 }
          ]
        });
      }
    });
  });

  if (pendingCaptures.length > 0) {
    highlightCaptures();
  }
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

function findBestSariMove() {
  let bestMove = null;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {

      if (board[r][c]?.color !== "sari") continue;

      const moves = getValidMoves(r, c);

      for (let m of moves) {
        const testBoard = cloneBoard(board);

        // hamleyi uygula
        testBoard[m.r][m.c] = testBoard[r][c];
        testBoard[r][c] = null;

        const before = countMor(testBoard);
        const eaten = simulateCaptures(testBoard, m.r, m.c, "sari");

        if (eaten > 0) {
          
          console.log(
            "✅ ZORUNLU YEME BULUNDU:",
            `(${r},${c}) → (${m.r},${m.c})`
            
          );
          Yemekontrol=true;
          Satirk=r;
          Satirg=m.r;
          Sutunk=c;
          Sutung=m.c;
          return { sr: r, sc: c, tr: m.r, tc: m.c };
        }
      }
    }
  }

  return null;
}



function morTehditleriBul() {
  let tehditler = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {

      if (board[r][c]?.color !== "mor") continue;

      const moves = getValidMoves(r, c);

      for (let m of moves) {
        const testBoard = cloneBoard(board);

        // mor hamleyi yapıyor
        testBoard[m.r][m.c] = testBoard[r][c];
        testBoard[r][c] = null;

        // bu hamle sarı yiyor mu?
        const eaten = simulateCaptures(testBoard, m.r, m.c, "mor");

        if (eaten > 0) {
          tehditler.push({
            morFrom: { r, c },
            morTo: { r: m.r, c: m.c }
          });
        }
      }
    }
  }

  return tehditler;
}

function savunmaHamlesiBul() {
  const tehditler = morTehditleriBul();
  if (tehditler.length === 0) return null;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {

      if (board[r][c]?.color !== "sari") continue;

      const moves = getValidMoves(r, c);

      for (let m of moves) {
        const testBoard = cloneBoard(board);

        // sarı savunma hamlesi
        testBoard[m.r][m.c] = testBoard[r][c];
        testBoard[r][c] = null;

        // bu hamleden sonra mor hâlâ yiyebiliyor mu?
        let halaTehdit = false;

        for (let t of tehditler) {
          const eaten = simulateCaptures(
            testBoard,
            t.morTo.r,
            t.morTo.c,
            "mor"
          );
          if (eaten > 0) {
            halaTehdit = true;
            break;
          }
        }

        if (!halaTehdit) {
          return { sr: r, sc: c, tr: m.r, tc: m.c };
        }
      }
    }
  }

  return null;
}



function highlightCaptures() {
  render();

  pendingCaptures.forEach(cap => {
    const { eaten, captors } = cap;

    // Yenilecek taş (yanıp sönsün)
    const eatenIdx = eaten.r * SIZE + eaten.c;
    boardEl.children[eatenIdx]
      .firstChild.classList.add("blink");

    // Sıkıştıran taşlar + oklar
    captors.forEach(p => {
      const idx = p.r * SIZE + p.c;
      boardEl.children[idx]
        .firstChild.classList.add("capture");

      drawArrow(p.r, p.c, eaten.r, eaten.c);
    });
  });

  // ⏳ DAHA UZUN BEKLE
  setTimeout(executeCaptures, 1000);
}

function executeCaptures() {
  pendingCaptures.forEach(cap => {
    const { eaten } = cap;
    board[eaten.r][eaten.c] = null;
  });

  pendingCaptures = [];
  render();
}

function drawArrow(fromR, fromC, toR, toC) {

  const cellSize = boardEl.offsetWidth / SIZE;

  const x1 = fromC * cellSize + cellSize / 2;
  const y1 = fromR * cellSize + cellSize / 2;
  const x2 = toC * cellSize + cellSize / 2;
  const y2 = toR * cellSize + cellSize / 2;

arrowCtx.strokeStyle = "lime";
arrowCtx.fillStyle = "lime";
arrowCtx.lineWidth = 6;


  arrowCtx.beginPath();
  arrowCtx.moveTo(x1, y1);
  arrowCtx.lineTo(x2, y2);
  arrowCtx.stroke();

  // ok ucu
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;

  arrowCtx.beginPath();
  arrowCtx.moveTo(x2, y2);
  arrowCtx.lineTo(
    x2 - head * Math.cos(angle - Math.PI / 6),
    y2 - head * Math.sin(angle - Math.PI / 6)
  );
  arrowCtx.lineTo(
    x2 - head * Math.cos(angle + Math.PI / 6),
    y2 - head * Math.sin(angle + Math.PI / 6)
  );
  arrowCtx.closePath();
  arrowCtx.fillStyle = "red";
  arrowCtx.fill();
}

function executeCaptures() {
  pendingCaptures.forEach(cap => {
    board[cap.eaten.r][cap.eaten.c] = null;
  });

  pendingCaptures = [];
  arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
  render();
}
