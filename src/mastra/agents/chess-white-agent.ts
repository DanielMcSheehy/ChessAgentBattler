import { Agent } from '@mastra/core/agent';
import { getBoardStateTool, getLegalMovesTool, makeMoveTool } from '../tools/chess-tools';

export const chessWhiteAgent = new Agent({
  name: 'Chess White Agent',
  instructions: `Play chess as WHITE.
1. Call get-board-state to GET the current state of the board
2. Call get-legal-moves for options
3. Call make-move with your choice
No explanation needed.`,
  model: 'anthropic/claude-haiku-4-5',
  tools: {
    getBoardStateTool,
    getLegalMovesTool,
    makeMoveTool
  },
});
