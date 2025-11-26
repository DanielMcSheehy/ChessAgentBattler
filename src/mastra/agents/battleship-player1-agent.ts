import { Agent } from '@mastra/core/agent';
import { visualizeOceanTool, getMyStatusTool, fireTool, moveBoatTool } from '../tools/battleship-tools';

export const battleshipPlayer1Agent = new Agent({
  name: 'Battleship Player 1',
  instructions: `Play Battleship. You are Player 1.
1. Call visualize-ocean to see board
2. Call get-my-status for hits/misses
3. Choose: fire at a position OR move-boat
Strategy: Track hits to find enemy boat. Avoid firing same spot twice.`,
  model: 'anthropic/claude-haiku-4-5',
  tools: {
    visualizeOceanTool,
    getMyStatusTool,
    fireTool,
    moveBoatTool,
  },
});
