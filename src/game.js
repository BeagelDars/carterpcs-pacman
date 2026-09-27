import { Maze, COLS, ROWS } from './maze.js';
import { Ghost, GHOST_TYPES, DIRS } from './ghosts.js';
import { soundEngine } from './audio.js';

import cuteImg from '../assets/carter-cute.jpg';
import mugshotImg from '../assets/carter-mugshot.png';
import doorbellImg from '../assets/carter-doorbell.png';
import niceImg from '../assets/carter-nice.png';
import screamingImg from '../assets/carter-screaming.gif';

const FRUITS = [
  { name: 'Cherry', points: 100, icon: '🍒' },
  { name: 'Strawberry', points: 300, icon: '🍓' },
  { name: 'Orange', points: 500, icon: '🍊' },
  { name: 'Apple', points: 700, icon: '🍎' },
  { name: 'Melon', points: 1000, icon: '🍈' },
  { name: 'Galaxian', points: 2000, icon: '🚀' },
  { name: 'Bell', points: 3000, icon: '🔔' },
  { name: 'Key', points: 5000, icon: '🗝️' }
];

export class Game {
  constructor(canvas, uiElements) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiElements;

    this.maze = new Maze();
    this.tileSize = 20;

    // State
    this.state = 'START'; // START, READY, PLAYING, DYING, LEVEL_CLEAR, GAMEOVER, PAUSED
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('carter_pacman_highscore') || '10000', 10);
    this.level = 1;
    this.lives = 3;

    // Mode cycle
    this.globalMode = 'SCATTER';
    this.modeTimer = 7;

    // Bonus fruit
    this.bonusFruit = null;
    this.bonusTimer = 0;
    this.bonusSpawnedCount = 0;

    // Floating text
    this.floatingTexts = [];

    // Player state (Cute Carter)
    this.player = {
      x: 13.5,
      y: 23.0,
      dir: DIRS.LEFT,
      nextDir: DIRS.LEFT,
      speed: 0.088,
      mouthAngle: 0.25,
      mouthSpeed: 0.06,
      mouthDir: 1,
      deathAngle: 0
    };

    // Ghosts (The 4 weird Carters)
    this.ghosts = [
      new Ghost(GHOST_TYPES.BLINKY, this.maze),
      new Ghost(GHOST_TYPES.PINKY, this.maze),
      new Ghost(GHOST_TYPES.INKY, this.maze),
      new Ghost(GHOST_TYPES.CLYDE, this.maze)
    ];

    // Image assets
    this.images = {
      player: new Image(),
      blinky: new Image(),
      pinky: new Image(),
      inky: new Image(),
      clyde: new Image()
    };
    this.imagesLoaded = false;
    this.sprites = {};

    this.lastTime = 0;
    this.readyTimer = 0;
    this.clearTimer = 0;
    this.deathTimer = 0;
    this.ghostsEatenInEnergizer = 0;

    this.init();
  }

  init() {
    this.updateHUD();
    this.loadImages();
    this.setupInputs();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    requestAnimationFrame(t => this.loop(t));
  }

  loadImages() {
    let count = 0;
    const onLoad = () => {
      count++;
      if (count === 5) {
        this.imagesLoaded = true;
        this.preRenderSprites();
      }
    };

    this.images.player.src = cuteImg;
    this.images.blinky.src = mugshotImg;
    this.images.pinky.src = doorbellImg;
    this.images.inky.src = niceImg;
    this.images.clyde.src = screamingImg;

    this.images.player.onload = onLoad;
    this.images.blinky.onload = onLoad;
    this.images.pinky.onload = onLoad;
    this.images.inky.onload = onLoad;
    this.images.clyde.onload = onLoad;
  }

  preRenderSprites() {
    // Clean circular cutouts with ZERO OUTLINE
    this.sprites.player = this.createFaceToken(this.images.player, { cx: 0.5, cy: 0.45, zoom: 1.1 });
    this.sprites.mugshot = this.createFaceToken(this.images.blinky, { cx: 0.5, cy: 0.42, zoom: 1.1 });
    this.sprites.doorbell = this.createFaceToken(this.images.pinky, { cx: 0.5, cy: 0.4, zoom: 1.25 });
    this.sprites.nice = this.createFaceToken(this.images.inky, { cx: 0.5, cy: 0.4, zoom: 1.15 });
    this.sprites.screaming = this.createFaceToken(this.images.clyde, { cx: 0.5, cy: 0.45, zoom: 1.15 });
  }

  createFaceToken(img, { cx = 0.5, cy = 0.5, zoom = 1.0 }) {
    const size = 128;
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const ctx = off.getContext('2d');

    // Smooth circular clip with NO OUTLINE
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.48, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const sw = img.naturalWidth || img.width || 100;
    const sh = img.naturalHeight || img.height || 100;
    const cropSize = Math.min(sw, sh) / zoom;
    const sx = Math.max(0, Math.min(sw - cropSize, sw * cx - cropSize / 2));
    const sy = Math.max(0, Math.min(sh - cropSize, sh * cy - cropSize / 2));

    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
    ctx.restore();

    return off;
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const maxW = Math.min(window.innerWidth - 20, 560);
    this.tileSize = Math.floor(maxW / COLS);
    if (this.tileSize < 12) this.tileSize = 12;

    const width = this.tileSize * COLS;
    const height = this.tileSize * ROWS;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  setupInputs() {
    window.addEventListener('keydown', e => {
      soundEngine.init();

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        soundEngine.setMuted(!soundEngine.muted);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.setNextDir(DIRS.UP);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.setNextDir(DIRS.DOWN);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.setNextDir(DIRS.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.setNextDir(DIRS.RIGHT);
          break;
      }
    });

    // Touch Swipe
    let sx = 0, sy = 0;
    this.canvas.addEventListener('touchstart', e => {
      soundEngine.init();
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.hypot(dx, dy) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.setNextDir(dx > 0 ? DIRS.RIGHT : DIRS.LEFT);
        } else {
          this.setNextDir(dy > 0 ? DIRS.DOWN : DIRS.UP);
        }
      }
    }, { passive: true });
  }

  setNextDir(dir) {
    if (this.state === 'START' || this.state === 'GAMEOVER') {
      this.startGame();
    }
    this.player.nextDir = dir;
  }

  startGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.maze.reset();
    this.resetPositions();
    this.state = 'READY';
    this.readyTimer = 4.2; // length of beginning jingle
    this.bonusFruit = null;
    this.bonusSpawnedCount = 0;
    soundEngine.playStartJingle();
    this.updateHUD();
  }

  resetPositions() {
    this.player.x = 13.5;
    this.player.y = 23.0;
    this.player.dir = DIRS.LEFT;
    this.player.nextDir = DIRS.LEFT;
    this.player.deathAngle = 0;

    this.ghosts.forEach(g => g.reset());
    this.globalMode = 'SCATTER';
    this.modeTimer = 7;
  }

  togglePause() {
    if (this.state === 'PLAYING') this.state = 'PAUSED';
    else if (this.state === 'PAUSED') this.state = 'PLAYING';
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.6 * dt * 20;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.state === 'READY') {
      this.readyTimer -= dt;
      if (this.readyTimer <= 0) {
        this.state = 'PLAYING';
      }
      return;
    }

    if (this.state === 'DYING') {
      this.player.deathAngle += dt * 6;
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.lives--;
        this.updateHUD();
        if (this.lives <= 0) {
          this.state = 'GAMEOVER';
          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('carter_pacman_highscore', this.highScore.toString());
          }
        } else {
          this.resetPositions();
          this.state = 'READY';
          this.readyTimer = 1.5;
        }
      }
      return;
    }

    if (this.state === 'LEVEL_CLEAR') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.level++;
        this.maze.reset();
        this.resetPositions();
        this.bonusFruit = null;
        this.bonusSpawnedCount = 0;
        this.state = 'READY';
        this.readyTimer = 2.0;
        this.updateHUD();
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    // Mode cycle
    this.modeTimer -= dt;
    if (this.modeTimer <= 0) {
      if (this.globalMode === 'SCATTER') {
        this.globalMode = 'CHASE';
        this.modeTimer = 20;
      } else {
        this.globalMode = 'SCATTER';
        this.modeTimer = 7;
      }
    }

    // Fruit spawn
    const dotsEaten = this.maze.totalDots - this.maze.dotsRemaining;
    if (this.bonusSpawnedCount === 0 && dotsEaten > 70) {
      this.spawnFruit();
    } else if (this.bonusSpawnedCount === 1 && dotsEaten > 170) {
      this.spawnFruit();
    }

    if (this.bonusFruit) {
      this.bonusTimer -= dt;
      if (this.bonusTimer <= 0) this.bonusFruit = null;
    }

    // Update Player
    this.updatePlayer(dt);

    // Update Ghosts
    const blinky = this.ghosts.find(g => g.config.id === 'blinky');
    this.ghosts.forEach(ghost => {
      ghost.update(dt, this.player, blinky, this.globalMode, dotsEaten);
      this.checkGhostCollision(ghost);
    });

    // Check Win
    if (this.maze.dotsRemaining === 0) {
      this.state = 'LEVEL_CLEAR';
      this.clearTimer = 3.0;
      soundEngine.playWinJingle();
    }
  }

  spawnFruit() {
    this.bonusSpawnedCount++;
    const idx = Math.min(this.level - 1, FRUITS.length - 1);
    this.bonusFruit = { ...FRUITS[idx], x: 13.5, y: 17.0 };
    this.bonusTimer = 9.0;
  }

  updatePlayer(dt) {
    const p = this.player;

    // Mouth animation
    p.mouthAngle += p.mouthSpeed * p.mouthDir;
    if (p.mouthAngle > 0.45) p.mouthDir = -1;
    if (p.mouthAngle < 0.05) p.mouthDir = 1;

    // Perpendicular alignment
    if (p.dir.x !== 0) {
      p.y = Math.round(p.y);
    } else if (p.dir.y !== 0) {
      p.x = Math.round(p.x);
    }

    // Try applying buffered turn
    if (p.nextDir && p.nextDir !== p.dir) {
      if (p.nextDir.name === p.dir.opp) {
        p.dir = p.nextDir;
      } else {
        const curTileX = Math.round(p.x);
        const curTileY = Math.round(p.y);
        const dist = Math.hypot(p.x - curTileX, p.y - curTileY);
        if (dist <= 0.3) {
          const nx = curTileX + p.nextDir.x;
          const ny = curTileY + p.nextDir.y;
          if (this.maze.isWalkable(nx, ny, false)) {
            p.x = curTileX;
            p.y = curTileY;
            p.dir = p.nextDir;
          }
        }
      }
    }

    // Forward collision
    const curX = Math.round(p.x);
    const curY = Math.round(p.y);
    const nextX = curX + p.dir.x;
    const nextY = curY + p.dir.y;
    const blocked = !this.maze.isWalkable(nextX, nextY, false);

    if (blocked && ((p.dir.x > 0 && p.x >= curX) ||
                    (p.dir.x < 0 && p.x <= curX) ||
                    (p.dir.y > 0 && p.y >= curY) ||
                    (p.dir.y < 0 && p.y <= curY))) {
      p.x = curX;
      p.y = curY;
    } else {
      p.x += p.dir.x * p.speed;
      p.y += p.dir.y * p.speed;
    }

    // Wrap tunnel
    if (Math.round(p.y) === 14) {
      if (p.x < -0.5) p.x = 27.5;
      if (p.x > 27.5) p.x = -0.5;
    }

    // Eat dot
    const eatX = Math.round(p.x);
    const eatY = Math.round(p.y);
    if (Math.hypot(p.x - eatX, p.y - eatY) < 0.35) {
      const eaten = this.maze.eatDot(eatX, eatY);
      if (eaten === 'dot') {
        this.addScore(10);
        soundEngine.playChomp();
      } else if (eaten === 'energizer') {
        this.addScore(50);
        this.triggerEnergizer();
      }
    }

    // Eat fruit
    if (this.bonusFruit && Math.hypot(p.x - this.bonusFruit.x, p.y - this.bonusFruit.y) < 0.6) {
      this.addScore(this.bonusFruit.points);
      this.addFloatingText(`+${this.bonusFruit.points}`, this.bonusFruit.x, this.bonusFruit.y);
      soundEngine.playEatFruit();
      this.bonusFruit = null;
    }
  }

  triggerEnergizer() {
    this.ghostsEatenInEnergizer = 0;
    const duration = Math.max(5, 9 - this.level * 0.5);
    this.ghosts.forEach(g => g.setFrightened(duration));
  }

  checkGhostCollision(ghost) {
    if (this.state !== 'PLAYING') return;
    const dist = Math.hypot(this.player.x - ghost.x, this.player.y - ghost.y);
    if (dist < 0.65) {
      if (ghost.state === 'FRIGHTENED') {
        ghost.state = 'EATEN_RETURNING';
        this.ghostsEatenInEnergizer++;
        const points = 200 * Math.pow(2, this.ghostsEatenInEnergizer - 1);
        this.addScore(points);
        this.addFloatingText(`+${points}`, ghost.x, ghost.y, '#00ffff');
        soundEngine.playEatGhost();
      } else if (ghost.state === 'CHASE' || ghost.state === 'SCATTER') {
        this.state = 'DYING';
        this.deathTimer = 1.6;
        soundEngine.playDeath();
      }
    }
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('carter_pacman_highscore', this.highScore.toString());
    }
    this.updateHUD();
  }

  addFloatingText(text, x, y, color = '#ffff00') {
    this.floatingTexts.push({
      text,
      x: x * this.tileSize,
      y: y * this.tileSize,
      color,
      life: 1.2
    });
  }

  updateHUD() {
    if (this.ui.scoreEl) this.ui.scoreEl.textContent = this.score.toString().padStart(2, '0');
    if (this.ui.highScoreEl) this.ui.highScoreEl.textContent = this.highScore.toString().padStart(2, '0');

    if (this.ui.livesEl) {
      this.ui.livesEl.innerHTML = '';
      for (let i = 0; i < Math.max(0, this.lives - 1); i++) {
        const icon = document.createElement('img');
        icon.src = cuteImg;
        icon.className = 'arcade-life-icon';
        icon.alt = 'Life';
        this.ui.livesEl.appendChild(icon);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const ts = this.tileSize;

    // Authentic Pac-Man deep black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, COLS * ts, ROWS * ts);

    // Draw Maze (authentic double neon blue walls)
    this.renderMaze(ctx, ts);

    // Draw Pellets & Energizers
    this.renderDots(ctx, ts);

    // Draw Bonus Fruit
    if (this.bonusFruit) {
      this.renderFruit(ctx, ts);
    }

    // Draw Ghosts
    this.ghosts.forEach(g => this.renderGhost(ctx, g, ts));

    // Draw Cute Carter Player
    if (this.state !== 'DYING' || (this.deathTimer > 0 && Math.floor(this.deathTimer * 8) % 2 === 0)) {
      this.renderPlayer(ctx, ts);
    }

    // Floating Points
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x + ts / 2, ft.y);
      ctx.restore();
    });

    // Overlays
    this.renderOverlays(ctx, ts);
  }

  renderMaze(ctx, ts) {
    const wallColor = '#2121de'; // Classic Pac-Man cobalt blue

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.maze.grid[r][c];
        const x = c * ts;
        const y = r * ts;

        if (tile === 1 || tile === 4) {
          ctx.fillStyle = wallColor;
          ctx.fillRect(x, y, ts, ts);

          // Authentic thin dark inner fill
          ctx.fillStyle = '#000000';
          ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
        } else if (tile === 5) {
          // Ghost door: delicate pink line
          ctx.fillStyle = '#ffb8ff';
          ctx.fillRect(x, y + ts * 0.4, ts, ts * 0.2);
        }
      }
    }
  }

  renderDots(ctx, ts) {
    const now = performance.now() / 1000;
    const dotColor = '#ffb8ae'; // Classic Pac-Man dot peach color

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.maze.grid[r][c];
        const cx = c * ts + ts / 2;
        const cy = r * ts + ts / 2;

        if (tile === 0) {
          ctx.fillStyle = dotColor;
          ctx.fillRect(cx - 2, cy - 2, 4, 4);
        } else if (tile === 3) {
          // Energizer flashing
          if (Math.floor(now * 5) % 2 === 0) {
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(cx, cy, ts * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  renderFruit(ctx, ts) {
    const f = this.bonusFruit;
    const cx = f.x * ts + ts / 2;
    const cy = f.y * ts + ts / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(ts * 1.3)}px sans-serif`;
    ctx.fillText(f.icon, cx, cy);
    ctx.restore();
  }

  renderPlayer(ctx, ts) {
    const p = this.player;
    const cx = p.x * ts + ts / 2;
    const cy = p.y * ts + ts / 2;
    const r = ts * 0.72;

    ctx.save();
    ctx.translate(cx, cy);

    let rot = 0;
    if (p.dir === DIRS.RIGHT) rot = 0;
    else if (p.dir === DIRS.DOWN) rot = Math.PI / 2;
    else if (p.dir === DIRS.LEFT) rot = Math.PI;
    else if (p.dir === DIRS.UP) rot = -Math.PI / 2;

    if (this.state === 'DYING') rot += this.player.deathAngle;
    ctx.rotate(rot);

    // Mouth cutout wedge
    ctx.beginPath();
    ctx.arc(0, 0, r, p.mouthAngle, Math.PI * 2 - p.mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.clip();

    // Render Cute Carter with NO OUTLINE
    if (this.sprites.player) {
      ctx.drawImage(this.sprites.player, -r, -r, r * 2, r * 2);
    } else {
      ctx.fillStyle = '#ffff00';
      ctx.fill();
    }

    ctx.restore();
  }

  renderGhost(ctx, ghost, ts) {
    const cx = ghost.x * ts + ts / 2;
    const cy = ghost.y * ts + ts / 2;
    const r = ts * 0.68;

    ctx.save();
    ctx.translate(cx, cy);

    // Eyes only
    if (ghost.state === 'EATEN_RETURNING') {
      this.renderEyes(ctx, ghost.dir, r);
      ctx.restore();
      return;
    }

    // Frightened: classic blue/white ghost
    if (ghost.state === 'FRIGHTENED') {
      const isWhite = ghost.isBlinking;
      ctx.fillStyle = isWhite ? '#ffffff' : '#2121de';

      this.drawGhostSilhouette(ctx, r);
      ctx.fill();

      // Scared eyes & mouth
      ctx.fillStyle = isWhite ? '#ff0000' : '#ffb8ae';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.2, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.2, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isWhite ? '#ff0000' : '#ffb8ae';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.3);
      ctx.lineTo(-r * 0.25, r * 0.15);
      ctx.lineTo(0, r * 0.3);
      ctx.lineTo(r * 0.25, r * 0.15);
      ctx.lineTo(r * 0.5, r * 0.3);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // Normal ghost body
    ctx.fillStyle = ghost.config.baseColor;
    this.drawGhostSilhouette(ctx, r);
    ctx.fill();

    // Render the weird Carter meme face with NO OUTLINE
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r * 0.65, 0, Math.PI * 2);
    ctx.clip();

    let sprite = this.sprites[ghost.config.imageKey];
    if (sprite) {
      ctx.drawImage(sprite, -r * 0.65, -r * 0.8, r * 1.3, r * 1.3);
    }
    ctx.restore();

    this.renderEyes(ctx, ghost.dir, r * 0.8);
    ctx.restore();
  }

  drawGhostSilhouette(ctx, r) {
    const now = performance.now() / 200;
    const wave = Math.sin(now) * (r * 0.1);

    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r, Math.PI, 0, false);
    ctx.lineTo(r, r);
    ctx.lineTo(r * 0.66, r - wave);
    ctx.lineTo(r * 0.33, r + wave);
    ctx.lineTo(0, r - wave);
    ctx.lineTo(-r * 0.33, r + wave);
    ctx.lineTo(-r * 0.66, r - wave);
    ctx.lineTo(-r, r);
    ctx.closePath();
  }

  renderEyes(ctx, dir, r) {
    const eyeOffset = {
      x: dir.x * (r * 0.25),
      y: dir.y * (r * 0.25)
    };

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.35 + eyeOffset.x, -r * 0.2 + eyeOffset.y, r * 0.22, 0, Math.PI * 2);
    ctx.arc(r * 0.35 + eyeOffset.x, -r * 0.2 + eyeOffset.y, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2121de';
    ctx.beginPath();
    ctx.arc(-r * 0.35 + eyeOffset.x * 1.5, -r * 0.2 + eyeOffset.y * 1.5, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.35 + eyeOffset.x * 1.5, -r * 0.2 + eyeOffset.y * 1.5, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  renderOverlays(ctx, ts) {
    const cx = (COLS * ts) / 2;
    const cy = (ROWS * ts) / 2;

    if (this.state === 'START') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText('CARTER-MAN', cx, cy - 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText('PRESS ANY KEY TO PLAY', cx, cy + 15);
      ctx.restore();
    } else if (this.state === 'READY') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText('READY!', cx, cy + 20);
      ctx.restore();
    } else if (this.state === 'PAUSED') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillText('PAUSED', cx, cy);
      ctx.restore();
    } else if (this.state === 'GAMEOVER') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillText('GAME  OVER', cx, cy);
      ctx.restore();
    }
  }
}
