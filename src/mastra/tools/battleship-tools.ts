import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getBattleshipEngine, type Player } from '@/lib/battleship-engine';

// Store which player is currently using tools (set by API route)
let currentPlayer: Player = 'player1';

export function setCurrentBattleshipPlayer(player: Player): void {
  currentPlayer = player;
}

export const visualizeOceanTool = createTool({
  id: 'visualize-ocean',
  description: 'See the ocean grid with your boat position and shot history. Shows water (~), your boat (█), hits (X), and misses (○).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const engine = getBattleshipEngine();
    const visualization = engine.visualizeBoard(currentPlayer);
    return { visualization };
  },
});

export const getMyStatusTool = createTool({
  id: 'get-my-status',
  description: 'Get your current game status: boat position, hits taken, shot history with results, and whose turn it is.',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const engine = getBattleshipEngine();
    const view = engine.getPlayerView(currentPlayer);

    const hits = view.myShotsHistory.filter(s => s.result === 'hit');
    const misses = view.myShotsHistory.filter(s => s.result === 'miss');

    return {
      player: currentPlayer,
      boatCells: view.myBoat.cells,
      hitsOnMyBoat: view.myBoat.hits,
      maxHits: 3,
      myHitsOnEnemy: hits.map(h => h.position),
      myMisses: misses.map(m => m.position),
      totalShots: view.myShotsHistory.length,
      currentTurn: view.currentTurn,
      isMyTurn: view.currentTurn === currentPlayer,
      turnNumber: view.turnNumber,
      isGameOver: view.isGameOver,
      winner: view.winner,
    };
  },
});

export const fireTool = createTool({
  id: 'fire',
  description: 'Fire at a position on the grid. Provide row (0-9) and col (0-9). Returns HIT or MISS.',
  inputSchema: z.object({
    row: z.number().min(0).max(9).describe('Row to fire at (0-9)'),
    col: z.number().min(0).max(9).describe('Column to fire at (0-9)'),
  }),
  execute: async ({ context }) => {
    const engine = getBattleshipEngine();
    const result = engine.fire(currentPlayer, { row: context.row, col: context.col });
    return result;
  },
});

export const moveBoatTool = createTool({
  id: 'move-boat',
  description: 'Move your boat in a direction. Can move 1 or 2 spaces. WARNING: If you collide with enemy boat, you LOSE!',
  inputSchema: z.object({
    direction: z.enum(['up', 'down', 'left', 'right']).describe('Direction to move'),
    spaces: z.number().min(1).max(2).default(2).describe('Number of spaces to move (1 or 2)'),
  }),
  execute: async ({ context }) => {
    const engine = getBattleshipEngine();
    const result = engine.move(currentPlayer, context.direction, context.spaces ?? 2);
    return result;
  },
});
