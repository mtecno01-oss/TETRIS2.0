/**
 * CYBER TETRIS NEON 2.0
 * Pure Vanilla JavaScript implementation with Web Audio API,
 * 7-Bag Randomizer, Ghost Piece, Hold System, DAS/ARR controls,
 * and Cyberpunk visual & sound effects.
 */

// Dimensiones oficiales del tablero
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Elementos del DOM
const boardElement = document.getElementById('board');
const boardWrap = document.getElementById('board-wrap');
const nextElement = document.getElementById('next-canvas');
const holdElement = document.getElementById('hold-canvas');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const highScoreElement = document.getElementById('high-score');
const gameOverElement = document.getElementById('game-over');
const pauseOverlay = document.getElementById('pause-overlay');
const toastBanner = document.getElementById('toast-banner');
const soundBtn = document.getElementById('sound-btn');

// Elementos de Game Over
const finalScoreEl = document.getElementById('final-score');
const finalHighScoreEl = document.getElementById('final-high-score');
const finalLinesEl = document.getElementById('final-lines');
const finalLevelEl = document.getElementById('final-level');
const newRecordBadge = document.getElementById('new-record-badge');

// ==========================================
// CONTROLADOR DE AUDIO (WEB AUDIO API)
// ==========================================
class SoundController {
    constructor() {
        this.ctx = null;
        this.enabled = true;

        // Recuperar preferencia guardada
        const saved = localStorage.getItem('cyber_tetris_sound');
        if (saved !== null) {
            this.enabled = saved === 'true';
        }
        this.updateIcon();
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.init();
        this.enabled = !this.enabled;
        localStorage.setItem('cyber_tetris_sound', this.enabled);
        this.updateIcon();
        if (this.enabled) {
            this.playMove();
        }
        return this.enabled;
    }

    updateIcon() {
        if (soundBtn) {
            soundBtn.innerText = this.enabled ? '🔊' : '🔇';
            soundBtn.classList.toggle('muted', !this.enabled);
        }
    }

    playMove() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    playRotate() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    playHold() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(540, now + 0.07);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playSoftDrop() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.04);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    playHardDrop() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playLineClear(lines) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const isTetris = lines === 4;
        const notes = isTetris ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25].slice(0, lines);

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.05;
            const duration = isTetris ? 0.35 : 0.18;
            osc.type = isTetris ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.linearRampToValueAtTime(0.001, t + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + duration);
        });
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const arpeggio = [392.00, 523.25, 659.25, 783.99, 1046.50];
        arpeggio.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.06;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.14, t);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.18);
        });
    }

    playGameOver() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.55);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
    }
}

const sound = new SoundController();
if (soundBtn) {
    soundBtn.addEventListener('click', () => sound.toggle());
}

// ==========================================
// DEFINICIÓN DE PIEZAS (ESTÁNDAR SRS)
// ==========================================
const SHAPES = [
    {
        name: 'I',
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: 'block-I'
    },
    {
        name: 'J',
        shape: [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        color: 'block-J'
    },
    {
        name: 'L',
        shape: [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        color: 'block-L'
    },
    {
        name: 'O',
        shape: [
            [4, 4],
            [4, 4]
        ],
        color: 'block-O'
    },
    {
        name: 'S',
        shape: [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        color: 'block-S'
    },
    {
        name: 'T',
        shape: [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        color: 'block-T'
    },
    {
        name: 'Z',
        shape: [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ],
        color: 'block-Z'
    }
];

// ==========================================
// VARIABLES DE ESTADO
// ==========================================
let grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

let score = 0;
let level = 1;
let lines = 0;
let highScore = parseInt(localStorage.getItem('cyber_tetris_highscore') || '0', 10);
if (highScoreElement) highScoreElement.innerText = highScore;

let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;
let isPlaying = false;
let isPaused = false;
let isClearing = false;

// Bolsa aleatoria de 7 piezas
let pieceBag = [];

let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    color: '',
    type: 0
};

let nextPiece = null;
let holdPieceType = null;
let canHold = true;
let combo = -1;
let lastClearWasTetris = false;

// ==========================================
// CREACIÓN DE CELDAS EN EL DOM
// ==========================================
const boardCells = [];
boardElement.innerHTML = '';
for (let r = 0; r < BOARD_HEIGHT; r++) {
    boardCells[r] = [];
    for (let c = 0; c < BOARD_WIDTH; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        boardElement.appendChild(cell);
        boardCells[r][c] = cell;
    }
}

const nextCells = [];
nextElement.innerHTML = '';
for (let r = 0; r < 4; r++) {
    nextCells[r] = [];
    for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        nextElement.appendChild(cell);
        nextCells[r][c] = cell;
    }
}

const holdCells = [];
holdElement.innerHTML = '';
for (let r = 0; r < 4; r++) {
    holdCells[r] = [];
    for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        holdElement.appendChild(cell);
        holdCells[r][c] = cell;
    }
}

// ==========================================
// GENERADOR 7-BAG (OFICIAL TETRIS)
// ==========================================
function getNextPiece() {
    if (pieceBag.length === 0) {
        pieceBag = [0, 1, 2, 3, 4, 5, 6];
        // Fisher-Yates shuffle
        for (let i = pieceBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieceBag[i], pieceBag[j]] = [pieceBag[j], pieceBag[i]];
        }
    }
    const index = pieceBag.pop();
    return {
        type: index,
        matrix: SHAPES[index].shape.map(row => [...row]),
        color: SHAPES[index].color
    };
}

// ==========================================
// TOAST NOTIFICACIONES FLOTANTES
// ==========================================
let toastTimer = null;
function showToast(text) {
    if (!toastBanner) return;
    toastBanner.innerText = text;
    toastBanner.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastBanner.classList.remove('show');
    }, 900);
}

// Screen Shake
function triggerScreenShake() {
    if (!boardWrap) return;
    boardWrap.classList.remove('screen-shake');
    // Force reflow
    void boardWrap.offsetWidth;
    boardWrap.classList.add('screen-shake');
}

// ==========================================
// RESET Y SPAWN DE PIEZA
// ==========================================
function spawnPiece(typeIndex) {
    const shapeDef = SHAPES[typeIndex];
    player.type = typeIndex;
    player.matrix = shapeDef.shape.map(row => [...row]);
    player.color = shapeDef.color;
    player.pos.y = 0;
    player.pos.x = Math.floor((BOARD_WIDTH - player.matrix[0].length) / 2);

    if (isPlaying && checkCollision(player.pos.x, player.pos.y, player.matrix)) {
        triggerGameOver();
    }
}

function resetPlayer() {
    if (!nextPiece) {
        nextPiece = getNextPiece();
    }

    const current = nextPiece;
    nextPiece = getNextPiece();

    spawnPiece(current.type);
    canHold = true;
    updateHoldBox();
    drawNextPiece();
}

// ==========================================
// DETECCIÓN DE COLISIONES
// ==========================================
function checkCollision(offsetX = player.pos.x, offsetY = player.pos.y, matrix = player.matrix) {
    if (!matrix) return false;

    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
                const newX = offsetX + c;
                const newY = offsetY + r;

                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }

                if (newY >= 0 && grid[newY][newX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ==========================================
// CALCULAR POSICIÓN DEL GHOST (SOMBRA)
// ==========================================
function getGhostY() {
    if (!player.matrix) return player.pos.y;
    let gy = player.pos.y;
    while (!checkCollision(player.pos.x, gy + 1, player.matrix)) {
        gy++;
    }
    return gy;
}

// ==========================================
// UNIR PIEZA AL TABLERO
// ==========================================
function merge() {
    player.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value !== 0) {
                const py = player.pos.y + r;
                const px = player.pos.x + c;
                if (py >= 0 && py < BOARD_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
                    grid[py][px] = player.color;
                }
            }
        });
    });
}

// ==========================================
// ROTACIÓN CON KICKS (SRS STYLE)
// ==========================================
function rotateMatrix(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const rotated = Array.from({ length: M }, () => Array(N).fill(0));

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            rotated[c][N - 1 - r] = matrix[r][c];
        }
    }
    return rotated;
}

function playerRotate() {
    if (!isPlaying || isPaused || gameOver || isClearing) return;

    const originalMatrix = player.matrix;
    const originalPos = { ...player.pos };
    const rotated = rotateMatrix(player.matrix);

    // Kicks para pared y piso
    const kickOffsets = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [-1, -1],
        [1, -1],
        [-2, 0],
        [2, 0],
        [0, -2]
    ];

    for (const [ox, oy] of kickOffsets) {
        const testX = originalPos.x + ox;
        const testY = originalPos.y + oy;
        if (!checkCollision(testX, testY, rotated)) {
            player.matrix = rotated;
            player.pos.x = testX;
            player.pos.y = testY;
            sound.playRotate();
            drawBoard();
            return;
        }
    }
}

// ==========================================
// MOVIMIENTO
// ==========================================
function playerMove(dir) {
    if (!isPlaying || isPaused || gameOver || isClearing) return;

    player.pos.x += dir;
    if (checkCollision()) {
        player.pos.x -= dir;
    } else {
        sound.playMove();
        drawBoard();
    }
}

// ==========================================
// CAÍDA SUAVE (DOWN)
// ==========================================
function playerDrop() {
    if (!isPlaying || isPaused || gameOver || isClearing) return;

    player.pos.y++;
    if (checkCollision()) {
        player.pos.y--;
        lockPiece();
    } else {
        score += 1; // Puntos por caída suave
        updateScoreDisplay();
        sound.playSoftDrop();
    }
    dropCounter = 0;
    drawBoard();
}

// ==========================================
// CAÍDA RÁPIDA / INSTANTÁNEA (HARD DROP)
// ==========================================
function playerHardDrop() {
    if (!isPlaying || isPaused || gameOver || isClearing) return;

    let dropDistance = 0;
    while (!checkCollision(player.pos.x, player.pos.y + 1, player.matrix)) {
        player.pos.y++;
        dropDistance++;
    }

    score += dropDistance * 2; // 2 puntos por celda en caída dura
    updateScoreDisplay();
    sound.playHardDrop();
    triggerScreenShake();
    lockPiece();
    dropCounter = 0;
}

// ==========================================
// FIJAR PIEZA Y REVISAR LÍNEAS
// ==========================================
function lockPiece() {
    merge();
    drawBoard();
    clearLines();
}

// ==========================================
// HOLD (GUARDAR PIEZA)
// ==========================================
function playerHold() {
    if (!isPlaying || isPaused || gameOver || !canHold || isClearing) return;

    sound.playHold();
    const currentType = player.type;

    if (holdPieceType === null) {
        holdPieceType = currentType;
        resetPlayer();
    } else {
        const temp = holdPieceType;
        holdPieceType = currentType;
        spawnPiece(temp);
    }

    canHold = false;
    updateHoldBox();
    drawBoard();
}

function updateHoldBox() {
    if (holdElement) {
        holdElement.classList.toggle('hold-locked', !canHold);
    }
    drawHoldPiece();
}

// ==========================================
// LIMPIEZA DE LÍNEAS Y PUNTUACIÓN
// ==========================================
function clearLines() {
    const fullRows = [];

    for (let r = 0; r < BOARD_HEIGHT; r++) {
        let isFull = true;
        for (let c = 0; c < BOARD_WIDTH; c++) {
            if (grid[r][c] === 0) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            fullRows.push(r);
        }
    }

    if (fullRows.length === 0) {
        combo = -1;
        resetPlayer();
        return;
    }

    // Efecto visual: animar filas completadas
    isClearing = true;
    fullRows.forEach(r => {
        for (let c = 0; c < BOARD_WIDTH; c++) {
            boardCells[r][c].classList.add('clearing-row');
        }
    });

    const rowCount = fullRows.length;
    sound.playLineClear(rowCount);

    if (rowCount === 4) {
        triggerScreenShake();
    }

    setTimeout(() => {
        // Remover filas y añadir nuevas vacías
        fullRows.sort((a, b) => a - b).forEach(r => {
            grid.splice(r, 1);
            grid.unshift(Array(BOARD_WIDTH).fill(0));
        });

        // Calcular puntuación Tetris
        let basePoints = 0;
        if (rowCount === 1) basePoints = 100 * level;
        else if (rowCount === 2) basePoints = 300 * level;
        else if (rowCount === 3) basePoints = 500 * level;
        else if (rowCount === 4) {
            basePoints = 800 * level;
            if (lastClearWasTetris) {
                basePoints = Math.floor(basePoints * 1.5);
                showToast('BACK-TO-BACK TETRIS!');
            } else {
                showToast('TETRIS!');
            }
            lastClearWasTetris = true;
        }

        if (rowCount !== 4) {
            lastClearWasTetris = false;
        }

        // Combo system
        combo++;
        let comboBonus = 0;
        if (combo > 0) {
            comboBonus = combo * 50 * level;
            showToast(`COMBO x${combo + 1}! +${comboBonus}`);
        }

        score += basePoints + comboBonus;
        lines += rowCount;

        // Subir de nivel cada 10 líneas
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(90, Math.floor(1000 * Math.pow(0.85, level - 1)));
            sound.playLevelUp();
            showToast(`NIVEL ${level}!`);
        }

        // Actualizar High Score en tiempo real
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('cyber_tetris_highscore', highScore);
        }

        updateScoreDisplay();
        isClearing = false;
        resetPlayer();
        drawBoard();
    }, 180);
}

function updateScoreDisplay() {
    if (scoreElement) scoreElement.innerText = score;
    if (levelElement) levelElement.innerText = level;
    if (linesElement) linesElement.innerText = lines;
    if (highScoreElement) highScoreElement.innerText = highScore;
}

// ==========================================
// RENDERIZADO DEL TABLERO Y GHOST
// ==========================================
function drawBoard() {
    // 1. Limpiar y dibujar bloques estáticos del tablero
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
            const cell = boardCells[r][c];
            cell.className = 'cell';
            if (grid[r][c] !== 0) {
                cell.classList.add(grid[r][c]);
            }
        }
    }

    if (!player.matrix || isClearing) return;

    // 2. Dibujar Ghost Piece (Sombra)
    const ghostY = getGhostY();
    player.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value !== 0) {
                const gy = ghostY + r;
                const gx = player.pos.x + c;
                if (gy >= 0 && gy < BOARD_HEIGHT && gx >= 0 && gx < BOARD_WIDTH) {
                    const cell = boardCells[gy][gx];
                    if (grid[gy][gx] === 0) {
                        cell.classList.add('ghost', player.color);
                    }
                }
            }
        });
    });

    // 3. Dibujar Pieza Activa del Jugador
    player.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value !== 0) {
                const drawY = player.pos.y + r;
                const drawX = player.pos.x + c;
                if (drawY >= 0 && drawY < BOARD_HEIGHT && drawX >= 0 && drawX < BOARD_WIDTH) {
                    const cell = boardCells[drawY][drawX];
                    cell.className = 'cell ' + player.color;
                }
            }
        });
    });
}

// ==========================================
// RENDERIZADO DE NEXT Y HOLD
// ==========================================
function drawNextPiece() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            nextCells[r][c].className = 'cell';
        }
    }

    if (nextPiece) {
        const m = nextPiece.matrix;
        const offsetX = Math.floor((4 - m[0].length) / 2);
        const offsetY = Math.floor((4 - m.length) / 2);

        m.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value !== 0) {
                    nextCells[offsetY + r][offsetX + c].className = 'cell ' + nextPiece.color;
                }
            });
        });
    }
}

function drawHoldPiece() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            holdCells[r][c].className = 'cell';
        }
    }

    if (holdPieceType !== null) {
        const shapeDef = SHAPES[holdPieceType];
        const m = shapeDef.shape;
        const offsetX = Math.floor((4 - m[0].length) / 2);
        const offsetY = Math.floor((4 - m.length) / 2);

        m.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value !== 0) {
                    holdCells[offsetY + r][offsetX + c].className = 'cell ' + shapeDef.color;
                }
            });
        });
    }
}

// ==========================================
// BUCLE PRINCIPAL (GAME LOOP)
// ==========================================
function update(time = 0) {
    if (!isPlaying) return;

    let deltaTime = time - lastTime;
    if (deltaTime > 500) {
        deltaTime = 0; // Evitar saltos bruscos tras pausas o cambio de pestaña
    }
    lastTime = time;

    if (!isPaused && !isClearing) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        drawBoard();
    }

    requestAnimationFrame(update);
}

// ==========================================
// PAUSA
// ==========================================
function togglePause() {
    if (!isPlaying || gameOver) return;

    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.style.display = 'flex';
    } else {
        pauseOverlay.style.display = 'none';
        lastTime = performance.now();
    }
    updatePauseButtons();
}

function updatePauseButtons() {
    const pauseBtn = document.getElementById('pause-btn');
    const pauseTouchBtn = document.getElementById('pause-touch-btn');
    const text = isPaused ? '▶ SEGUIR' : '⏸ PAUSA';

    if (pauseBtn) pauseBtn.innerText = text;
    if (pauseTouchBtn) pauseTouchBtn.innerText = text;
}

// ==========================================
// GAME OVER
// ==========================================
function triggerGameOver() {
    gameOver = true;
    isPlaying = false;
    isPaused = false;

    sound.playGameOver();
    triggerScreenShake();

    const isNewRecord = score > 0 && score >= highScore;
    if (isNewRecord) {
        highScore = score;
        localStorage.setItem('cyber_tetris_highscore', highScore);
    }

    if (finalScoreEl) finalScoreEl.innerText = score;
    if (finalHighScoreEl) finalHighScoreEl.innerText = highScore;
    if (finalLinesEl) finalLinesEl.innerText = lines;
    if (finalLevelEl) finalLevelEl.innerText = level;
    if (newRecordBadge) {
        newRecordBadge.style.display = isNewRecord ? 'block' : 'none';
    }

    pauseOverlay.style.display = 'none';
    gameOverElement.style.display = 'flex';
    updatePauseButtons();
}

// ==========================================
// INICIO Y REINICIO
// ==========================================
function startGame() {
    sound.init();
    if (isPlaying) return;

    resetGame();
    isPlaying = true;
    isPaused = false;

    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.style.display = 'none';
    pauseOverlay.style.display = 'none';
    updatePauseButtons();

    lastTime = performance.now();
    requestAnimationFrame(update);
}

function restartGame() {
    sound.init();
    isPlaying = false;
    isPaused = false;

    resetGame();
    isPlaying = true;

    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.style.display = 'none';
    gameOverElement.style.display = 'none';
    pauseOverlay.style.display = 'none';
    updatePauseButtons();

    lastTime = performance.now();
    requestAnimationFrame(update);
}

function resetGame() {
    grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    dropCounter = 0;
    gameOver = false;
    isClearing = false;
    pieceBag = [];
    holdPieceType = null;
    canHold = true;
    combo = -1;
    lastClearWasTetris = false;

    updateScoreDisplay();
    gameOverElement.style.display = 'none';
    pauseOverlay.style.display = 'none';

    nextPiece = null;
    resetPlayer();
    updateHoldBox();
    drawBoard();
    updatePauseButtons();
}

// ==========================================
// SISTEMA DAS / ARR (REPETICIÓN SUAVE)
// ==========================================
const keyTimers = {};

function startActionRepeat(key, action, initialDelay = 160, repeatInterval = 45) {
    if (keyTimers[key]) return;
    action();
    keyTimers[key] = setTimeout(() => {
        keyTimers[key] = setInterval(() => {
            action();
        }, repeatInterval);
    }, initialDelay);
}

function stopActionRepeat(key) {
    if (keyTimers[key]) {
        clearTimeout(keyTimers[key]);
        clearInterval(keyTimers[key]);
        delete keyTimers[key];
    }
}

// ==========================================
// CONTROLES DE TECLADO
// ==========================================
window.addEventListener('keydown', event => {
    // Si presiona M para sonido
    if (event.key === 'm' || event.key === 'M') {
        sound.toggle();
        return;
    }

    // Tecla de pausa
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        togglePause();
        return;
    }

    if (!isPlaying || isPaused || gameOver) {
        if (event.key === 'Enter' || event.key === ' ') {
            if (gameOver) restartGame();
            else if (!isPlaying) startGame();
        }
        return;
    }

    const preventKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'c', 'C'];
    if (preventKeys.includes(event.key)) {
        event.preventDefault();
    }

    if (event.repeat) return; // Gestionado por DAS

    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            startActionRepeat('left', () => playerMove(-1));
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            startActionRepeat('right', () => playerMove(1));
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            startActionRepeat('down', () => playerDrop(), 80, 50);
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            playerRotate();
            break;
        case ' ':
            playerHardDrop();
            break;
        case 'c':
        case 'C':
        case 'Shift':
            playerHold();
            break;
    }
});

window.addEventListener('keyup', event => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            stopActionRepeat('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            stopActionRepeat('right');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            stopActionRepeat('down');
            break;
    }
});

// ==========================================
// CONTROLES TÁCTILES Y RATÓN (CON REPEAT)
// ==========================================
function bindTouchButton(id, action, repeat = false, initialDelay = 180, repeatInterval = 60) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const start = (e) => {
        e.preventDefault();
        sound.init();
        if (!isPlaying && !gameOver) {
            startGame();
            return;
        }
        if (!isPlaying || isPaused) return;

        if (repeat) {
            startActionRepeat(id, action, initialDelay, repeatInterval);
        } else {
            action();
        }
    };

    const stop = (e) => {
        e.preventDefault();
        if (repeat) {
            stopActionRepeat(id);
        }
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
}

bindTouchButton('left-btn', () => playerMove(-1), true, 160, 55);
bindTouchButton('right-btn', () => playerMove(1), true, 160, 55);
bindTouchButton('down-btn', () => playerDrop(), true, 90, 50);
bindTouchButton('rotate-btn', () => playerRotate(), false);
bindTouchButton('hold-btn', () => playerHold(), false);
bindTouchButton('hard-btn', () => playerHardDrop(), false);

const pauseTouchBtn = document.getElementById('pause-touch-btn');
if (pauseTouchBtn) {
    pauseTouchBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        sound.init();
        togglePause();
    });
}

// Cargar estado inicial visible al abrir la página
resetPlayer();
drawBoard();
drawNextPiece();
drawHoldPiece();
