// Battleship Game Engine
// Grid: 10x10 ocean
// Boats: 3x1 sized, can be horizontal or vertical
// Actions: Fire at position OR move boat 2 spaces in any direction
// Win condition: 3 hits on enemy boat OR enemy moves into your boat

export type Position = { row: number; col: number };
export type Orientation = 'horizontal' | 'vertical';
export type Player = 'player1' | 'player2';
export type ActionType = 'fire' | 'move';

export interface Boat {
  position: Position; // Top-left position of the 3x1 boat
  orientation: Orientation;
  hits: Set<string>; // Track which cells of the boat have been hit (e.g., "0", "1", "2")
}

export interface PlayerState {
  boat: Boat;
  shotsHistory: Map<string, 'hit' | 'miss'>; // Track all shots and their results
}

export interface GameState {
  gridSize: number;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  currentTurn: Player;
  isGameOver: boolean;
  winner: Player | null;
  winReason: string | null;
  turnNumber: number;
}

export interface MoveResult {
  success: boolean;
  message: string;
  collision?: boolean;
}

export interface FireResult {
  success: boolean;
  hit: boolean;
  message: string;
  sunk?: boolean;
}

const GRID_SIZE = 10;
const BOAT_LENGTH = 3;
const MIN_SPAWN_DISTANCE = 4; // Minimum distance between boats at spawn

class BattleshipEngine {
  private state: GameState;

  constructor() {
    this.state = this.initializeGame();
  }

  private initializeGame(): GameState {
    const player1Boat = this.generateRandomBoat();
    let player2Boat = this.generateRandomBoat();

    // Ensure boats don't spawn too close to each other
    let attempts = 0;
    while (this.boatsTooClose(player1Boat, player2Boat) && attempts < 100) {
      player2Boat = this.generateRandomBoat();
      attempts++;
    }

    return {
      gridSize: GRID_SIZE,
      players: {
        player1: {
          boat: player1Boat,
          shotsHistory: new Map(),
        },
        player2: {
          boat: player2Boat,
          shotsHistory: new Map(),
        },
      },
      currentTurn: 'player1',
      isGameOver: false,
      winner: null,
      winReason: null,
      turnNumber: 1,
    };
  }

  private generateRandomBoat(): Boat {
    const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

    let maxRow = GRID_SIZE - 1;
    let maxCol = GRID_SIZE - 1;

    if (orientation === 'horizontal') {
      maxCol = GRID_SIZE - BOAT_LENGTH;
    } else {
      maxRow = GRID_SIZE - BOAT_LENGTH;
    }

    return {
      position: {
        row: Math.floor(Math.random() * (maxRow + 1)),
        col: Math.floor(Math.random() * (maxCol + 1)),
      },
      orientation,
      hits: new Set(),
    };
  }

  private boatsTooClose(boat1: Boat, boat2: Boat): boolean {
    const cells1 = this.getBoatCells(boat1);
    const cells2 = this.getBoatCells(boat2);

    for (const cell1 of cells1) {
      for (const cell2 of cells2) {
        const distance = Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
        if (distance < MIN_SPAWN_DISTANCE) {
          return true;
        }
      }
    }
    return false;
  }

  private getBoatCells(boat: Boat): Position[] {
    const cells: Position[] = [];
    for (let i = 0; i < BOAT_LENGTH; i++) {
      if (boat.orientation === 'horizontal') {
        cells.push({ row: boat.position.row, col: boat.position.col + i });
      } else {
        cells.push({ row: boat.position.row + i, col: boat.position.col });
      }
    }
    return cells;
  }

  private positionKey(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  private cellIndexKey(index: number): string {
    return `${index}`;
  }

  getGameState(): GameState {
    return { ...this.state };
  }

  // Get view for a specific player (only sees their own boat and shot history)
  getPlayerView(player: Player): {
    gridSize: number;
    myBoat: { cells: Position[]; hits: number };
    myShotsHistory: Array<{ position: Position; result: 'hit' | 'miss' }>;
    currentTurn: Player;
    isGameOver: boolean;
    winner: Player | null;
    winReason: string | null;
    turnNumber: number;
  } {
    const playerState = this.state.players[player];
    const boatCells = this.getBoatCells(playerState.boat);

    const shotsHistory: Array<{ position: Position; result: 'hit' | 'miss' }> = [];
    playerState.shotsHistory.forEach((result, key) => {
      const [row, col] = key.split(',').map(Number);
      shotsHistory.push({ position: { row, col }, result });
    });

    return {
      gridSize: this.state.gridSize,
      myBoat: {
        cells: boatCells,
        hits: playerState.boat.hits.size,
      },
      myShotsHistory: shotsHistory,
      currentTurn: this.state.currentTurn,
      isGameOver: this.state.isGameOver,
      winner: this.state.winner,
      winReason: this.state.winReason,
      turnNumber: this.state.turnNumber,
    };
  }

  fire(player: Player, target: Position): FireResult {
    if (this.state.isGameOver) {
      return { success: false, hit: false, message: 'Game is already over' };
    }

    if (this.state.currentTurn !== player) {
      return { success: false, hit: false, message: 'Not your turn' };
    }

    if (target.row < 0 || target.row >= GRID_SIZE || target.col < 0 || target.col >= GRID_SIZE) {
      return { success: false, hit: false, message: 'Invalid target position' };
    }

    const posKey = this.positionKey(target);
    const playerState = this.state.players[player];

    // Check if already fired at this position
    if (playerState.shotsHistory.has(posKey)) {
      return { success: false, hit: false, message: 'Already fired at this position' };
    }

    const opponent: Player = player === 'player1' ? 'player2' : 'player1';
    const opponentBoat = this.state.players[opponent].boat;
    const opponentCells = this.getBoatCells(opponentBoat);

    // Check if hit
    let hit = false;
    let hitCellIndex = -1;
    for (let i = 0; i < opponentCells.length; i++) {
      if (opponentCells[i].row === target.row && opponentCells[i].col === target.col) {
        hit = true;
        hitCellIndex = i;
        break;
      }
    }

    // Record the shot
    playerState.shotsHistory.set(posKey, hit ? 'hit' : 'miss');

    if (hit) {
      opponentBoat.hits.add(this.cellIndexKey(hitCellIndex));

      // Check if boat is sunk (3 hits)
      if (opponentBoat.hits.size >= BOAT_LENGTH) {
        this.state.isGameOver = true;
        this.state.winner = player;
        this.state.winReason = `${player} sunk ${opponent}'s boat!`;
        return {
          success: true,
          hit: true,
          message: `HIT! You sunk the enemy boat!`,
          sunk: true
        };
      }

      this.switchTurn();
      return {
        success: true,
        hit: true,
        message: `HIT at (${target.row}, ${target.col})! Enemy boat has ${opponentBoat.hits.size}/${BOAT_LENGTH} hits.`
      };
    }

    this.switchTurn();
    return {
      success: true,
      hit: false,
      message: `MISS at (${target.row}, ${target.col}).`
    };
  }

  move(player: Player, direction: 'up' | 'down' | 'left' | 'right', spaces: number = 2): MoveResult {
    if (this.state.isGameOver) {
      return { success: false, message: 'Game is already over' };
    }

    if (this.state.currentTurn !== player) {
      return { success: false, message: 'Not your turn' };
    }

    if (spaces < 1 || spaces > 2) {
      return { success: false, message: 'Can only move 1 or 2 spaces' };
    }

    const playerState = this.state.players[player];
    const boat = playerState.boat;
    const newPosition = { ...boat.position };

    // Calculate new position
    switch (direction) {
      case 'up':
        newPosition.row -= spaces;
        break;
      case 'down':
        newPosition.row += spaces;
        break;
      case 'left':
        newPosition.col -= spaces;
        break;
      case 'right':
        newPosition.col += spaces;
        break;
    }

    // Check bounds
    const newBoat: Boat = { ...boat, position: newPosition };
    const newCells = this.getBoatCells(newBoat);

    for (const cell of newCells) {
      if (cell.row < 0 || cell.row >= GRID_SIZE || cell.col < 0 || cell.col >= GRID_SIZE) {
        return { success: false, message: 'Move would go out of bounds' };
      }
    }

    // Check for collision with enemy boat
    const opponent: Player = player === 'player1' ? 'player2' : 'player1';
    const opponentCells = this.getBoatCells(this.state.players[opponent].boat);

    for (const newCell of newCells) {
      for (const oppCell of opponentCells) {
        if (newCell.row === oppCell.row && newCell.col === oppCell.col) {
          // Collision! Moving player loses
          this.state.isGameOver = true;
          this.state.winner = opponent;
          this.state.winReason = `${player} collided with ${opponent}'s boat!`;
          return {
            success: true,
            message: `You collided with the enemy boat! You lose!`,
            collision: true
          };
        }
      }
    }

    // Apply move
    boat.position = newPosition;
    this.switchTurn();

    return {
      success: true,
      message: `Moved ${direction} ${spaces} space(s). New position: (${newPosition.row}, ${newPosition.col})`
    };
  }

  private switchTurn(): void {
    this.state.currentTurn = this.state.currentTurn === 'player1' ? 'player2' : 'player1';
    if (this.state.currentTurn === 'player1') {
      this.state.turnNumber++;
    }
  }

  reset(): GameState {
    this.state = this.initializeGame();
    return this.state;
  }

  // Get a visual representation of the board for a player
  visualizeBoard(player: Player): string {
    const view = this.getPlayerView(player);
    const grid: string[][] = [];

    // Initialize empty grid
    for (let r = 0; r < GRID_SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = '~'; // Water
      }
    }

    // Mark player's boat
    for (const cell of view.myBoat.cells) {
      grid[cell.row][cell.col] = '█'; // Boat
    }

    // Mark shots
    for (const shot of view.myShotsHistory) {
      const { row, col } = shot.position;
      if (shot.result === 'hit') {
        grid[row][col] = 'X'; // Hit
      } else {
        grid[row][col] = '○'; // Miss
      }
    }

    // Build string
    let result = '   ';
    for (let c = 0; c < GRID_SIZE; c++) {
      result += c + ' ';
    }
    result += '\n';

    for (let r = 0; r < GRID_SIZE; r++) {
      result += r.toString().padStart(2, ' ') + ' ';
      result += grid[r].join(' ') + '\n';
    }

    result += '\nLegend: ~ = water, █ = your boat, X = hit, ○ = miss\n';
    result += `Your boat hits taken: ${view.myBoat.hits}/${BOAT_LENGTH}\n`;
    result += `Turn: ${view.turnNumber}, Current: ${view.currentTurn}\n`;

    return result;
  }
}

// Singleton pattern
let battleshipEngine: BattleshipEngine | null = null;

export function getBattleshipEngine(): BattleshipEngine {
  if (!battleshipEngine) {
    battleshipEngine = new BattleshipEngine();
  }
  return battleshipEngine;
}

export function resetBattleshipEngine(): BattleshipEngine {
  battleshipEngine = new BattleshipEngine();
  return battleshipEngine;
}
