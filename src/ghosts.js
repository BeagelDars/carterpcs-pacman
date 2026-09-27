// Robust, Authentic Pac-Man Ghost AI for 4 Carter Meme Ghosts
// Zero getting stuck, strictly aligned to integer corridors

export const GHOST_TYPES = {
  BLINKY: {
    id: 'blinky',
    name: 'DMV Stare',
    baseColor: '#ff0000',
    imageKey: 'mugshot',
    scatterTarget: { x: 25, y: -2 },
    startPos: { x: 13, y: 11 },
    startInHouse: false
  },
  PINKY: {
    id: 'pinky',
    name: 'Doorbell Fisheye',
    baseColor: '#ffb8ff',
    imageKey: 'doorbell',
    scatterTarget: { x: 2, y: -2 },
    startPos: { x: 13, y: 14 },
    startInHouse: true,
    dotThreshold: 0
  },
  INKY: {
    id: 'inky',
    name: 'Pink Light Selfie',
    baseColor: '#00ffff',
    imageKey: 'nice',
    scatterTarget: { x: 27, y: 32 },
    startPos: { x: 11, y: 14 },
    startInHouse: true,
    dotThreshold: 15
  },
  CLYDE: {
    id: 'clyde',
    name: 'Screaming Carter',
    baseColor: '#ffb852',
    imageKey: 'screaming',
    scatterTarget: { x: 0, y: 32 },
    startPos: { x: 15, y: 14 },
    startInHouse: true,
    dotThreshold: 35
  }
};

export const DIRS = {
  UP:    { x: 0,  y: -1, name: 'UP',    opp: 'DOWN' },
  LEFT:  { x: -1, y: 0,  name: 'LEFT',  opp: 'RIGHT' },
  DOWN:  { x: 0,  y: 1,  name: 'DOWN',  opp: 'UP' },
  RIGHT: { x: 1,  y: 0,  name: 'RIGHT', opp: 'LEFT' }
};

export class Ghost {
  constructor(config, maze) {
    this.config = config;
    this.maze = maze;
    this.reset();
  }

  reset() {
    this.x = this.config.startPos.x;
    this.y = this.config.startPos.y;
    this.dir = DIRS.LEFT;
    this.state = this.config.startInHouse ? 'IN_HOUSE' : 'CHASE';
    this.speed = 0.082;
    this.frightenedTimer = 0;
    this.isBlinking = false;
    this.houseBounceDir = 1;
    this.houseTimer = 0;
  }

  setFrightened(duration) {
    if (this.state === 'EATEN_RETURNING') return;
    this.state = 'FRIGHTENED';
    this.frightenedTimer = duration;
    // Reverse direction on energizer
    const opp = DIRS[this.dir.opp];
    if (opp) this.dir = opp;
  }

  update(dt, player, blinkyGhost, globalMode, totalDotsEaten) {
    if (this.state === 'FRIGHTENED') {
      this.frightenedTimer -= dt;
      this.isBlinking = this.frightenedTimer < 3 && Math.floor(this.frightenedTimer * 5) % 2 === 0;
      if (this.frightenedTimer <= 0) {
        this.state = globalMode;
        this.isBlinking = false;
      }
    }

    // State 1: IN_HOUSE
    if (this.state === 'IN_HOUSE') {
      this.y += 0.02 * this.houseBounceDir;
      if (this.y > 14.3) this.houseBounceDir = -1;
      if (this.y < 13.7) this.houseBounceDir = 1;

      if (totalDotsEaten >= (this.config.dotThreshold || 0)) {
        this.state = 'EXITING_HOUSE';
      }
      return;
    }

    // State 2: EXITING_HOUSE
    if (this.state === 'EXITING_HOUSE') {
      const exitDoorX = 13.0;
      const exitDoorY = 11.0;

      // Align horizontally to door
      if (Math.abs(this.x - exitDoorX) > 0.05) {
        this.x += Math.sign(exitDoorX - this.x) * 0.05;
      } else {
        this.x = exitDoorX;
        // Move up through the door
        if (this.y > exitDoorY) {
          this.y -= 0.05;
        } else {
          this.y = exitDoorY;
          this.dir = DIRS.LEFT;
          this.state = globalMode;
        }
      }
      return;
    }

    // State 3: EATEN_RETURNING
    if (this.state === 'EATEN_RETURNING') {
      const home = { x: 13, y: 11 };
      const dist = Math.hypot(this.x - home.x, this.y - home.y);
      if (dist < 0.3) {
        this.x = 13;
        this.y = 14;
        this.state = 'EXITING_HOUSE';
        return;
      }
      this.stepTowards(home.x, home.y, 0.16, true);
      return;
    }

    // Normal moving states: CHASE, SCATTER, FRIGHTENED
    let currentSpeed = 0.082;
    if (this.state === 'FRIGHTENED') currentSpeed = 0.050;

    // Tunnel slowdown
    if (Math.round(this.y) === 14 && (this.x < 5 || this.x > 22)) {
      currentSpeed *= 0.55;
    }

    let target = { x: 13, y: 11 };
    if (this.state === 'SCATTER') {
      target = this.config.scatterTarget;
    } else if (this.state === 'FRIGHTENED') {
      target = {
        x: (Math.round(this.x) + Math.floor(Math.random() * 5 - 2) + 28) % 28,
        y: (Math.round(this.y) + Math.floor(Math.random() * 5 - 2) + 31) % 31
      };
    } else if (this.state === 'CHASE') {
      target = this.getChaseTarget(player, blinkyGhost);
    }

    this.stepTowards(target.x, target.y, currentSpeed, false);
  }

  getChaseTarget(player, blinkyGhost) {
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    const pdir = player.dir;

    switch (this.config.id) {
      case 'blinky':
        return { x: px, y: py };
      case 'pinky':
        return { x: px + pdir.x * 4, y: py + pdir.y * 4 };
      case 'inky': {
        const aheadX = px + pdir.x * 2;
        const aheadY = py + pdir.y * 2;
        const bx = blinkyGhost ? blinkyGhost.x : px;
        const by = blinkyGhost ? blinkyGhost.y : py;
        return { x: aheadX + (aheadX - bx), y: aheadY + (aheadY - by) };
      }
      case 'clyde': {
        const dist = Math.hypot(this.x - px, this.y - py);
        return dist > 8 ? { x: px, y: py } : this.config.scatterTarget;
      }
      default:
        return { x: px, y: py };
    }
  }

  stepTowards(targetX, targetY, speed, allowDoors = false) {
    // Lock perpendicular axis to prevent drift
    if (this.dir.x !== 0) {
      this.y = Math.round(this.y);
    } else if (this.dir.y !== 0) {
      this.x = Math.round(this.x);
    }

    // Move
    this.x += this.dir.x * speed;
    this.y += this.dir.y * speed;

    // Handle horizontal tunnel wrapping
    if (Math.round(this.y) === 14) {
      if (this.x < -0.5) this.x = 27.5;
      if (this.x > 27.5) this.x = -0.5;
    }

    // Check if we passed or reached an integer intersection
    const tileX = Math.round(this.x);
    const tileY = Math.round(this.y);
    const distToCenter = Math.hypot(this.x - tileX, this.y - tileY);

    if (distToCenter <= speed * 0.9) {
      // Snap to tile center
      this.x = tileX;
      this.y = tileY;

      // Find available turns excluding opposite direction
      const options = [DIRS.UP, DIRS.LEFT, DIRS.DOWN, DIRS.RIGHT].filter(d => {
        if (d.name === this.dir.opp) return false;
        const nx = tileX + d.x;
        const ny = tileY + d.y;
        return this.maze.isWalkable(nx, ny, true, allowDoors);
      });

      if (options.length > 0) {
        let bestDir = options[0];
        let bestDist = Infinity;
        for (const opt of options) {
          const nx = tileX + opt.x;
          const ny = tileY + opt.y;
          const d2 = (nx - targetX) ** 2 + (ny - targetY) ** 2;
          if (d2 < bestDist) {
            bestDist = d2;
            bestDir = opt;
          }
        }
        this.dir = bestDir;
      } else {
        // Can only reverse
        this.dir = DIRS[this.dir.opp] || this.dir;
      }
    }
  }
}
