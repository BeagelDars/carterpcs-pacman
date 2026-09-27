// 28 columns x 31 rows classic arcade maze
// Tile types:
// 0: Walkable with standard dot (10 pts)
// 1: Wall (impassable)
// 2: Empty walkable space (no dot, e.g. tunnels, spawn area)
// 3: Energizer / Power Pellet (50 pts, triggers frightened mode)
// 4: Ghost house wall
// 5: Ghost house door (ghosts pass, player blocked)
// 6: Ghost house interior
// 7: Bonus tech item spawn tile (walkable, no dot)

export const COLS = 28;
export const ROWS = 31;

export const RAW_MAZE = [
  // 00
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // 01
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // 02
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  // 03
  [1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1],
  // 04
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  // 05
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // 06
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  // 07
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  // 08
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  // 09
  [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
  // 10
  [2,2,2,2,2,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,2,2,2,2,2],
  // 11
  [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
  // 12
  [2,2,2,2,2,1,0,1,1,2,4,4,4,5,5,4,4,4,2,1,1,0,1,2,2,2,2,2],
  // 13
  [1,1,1,1,1,1,0,1,1,2,4,6,6,6,6,6,6,4,2,1,1,0,1,1,1,1,1,1],
  // 14 Tunnel
  [2,2,2,2,2,2,0,2,2,2,4,6,6,6,6,6,6,4,2,2,2,0,2,2,2,2,2,2],
  // 15
  [1,1,1,1,1,1,0,1,1,2,4,6,6,6,6,6,6,4,2,1,1,0,1,1,1,1,1,1],
  // 16
  [2,2,2,2,2,1,0,1,1,2,4,4,4,4,4,4,4,4,2,1,1,0,1,2,2,2,2,2],
  // 17
  [2,2,2,2,2,1,0,1,1,2,2,2,2,7,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
  // 18
  [2,2,2,2,2,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,2,2,2,2,2],
  // 19
  [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
  // 20
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // 21
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  // 22
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  // 23
  [1,3,0,0,1,1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1,1,0,0,3,1],
  // 24
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  // 25
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  // 26
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  // 27
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  // 28
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  // 29
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // 30
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export class Maze {
  constructor() {
    this.grid = [];
    this.totalDots = 0;
    this.dotsRemaining = 0;
    this.reset();
  }

  reset() {
    this.grid = RAW_MAZE.map(row => [...row]);
    this.totalDots = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === 0 || this.grid[r][c] === 3) {
          this.totalDots++;
        }
      }
    }
    this.dotsRemaining = this.totalDots;
  }

  getTile(c, r) {
    if (r < 0 || r >= ROWS) return 1;
    // Horizontal tunnel wrapping
    if (c < 0) return this.grid[r][COLS - 1];
    if (c >= COLS) return this.grid[r][0];
    return this.grid[r][c];
  }

  isWall(c, r) {
    const tile = this.getTile(c, r);
    return tile === 1 || tile === 4;
  }

  isGhostDoor(c, r) {
    return this.getTile(c, r) === 5;
  }

  isWalkable(c, r, isGhost = false, inEatenMode = false) {
    if (r < 0 || r >= ROWS) return false;
    // Tunnel tiles
    if (c < 0 || c >= COLS) return true;

    const tile = this.grid[r][c];
    if (tile === 1 || tile === 4) return false;
    if (tile === 5) {
      // Ghost door: accessible by ghosts, blocked for pacman
      return isGhost;
    }
    if (tile === 6) {
      // Ghost house interior
      return isGhost;
    }
    return true;
  }

  eatDot(c, r) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    const tile = this.grid[r][c];
    if (tile === 0) {
      this.grid[r][c] = 2; // change to empty
      this.dotsRemaining--;
      return 'dot';
    }
    if (tile === 3) {
      this.grid[r][c] = 2; // change to empty
      this.dotsRemaining--;
      return 'energizer';
    }
    return null;
  }
}
