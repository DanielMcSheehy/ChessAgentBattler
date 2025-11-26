import { Agent } from '@mastra/core/agent';
import { visualizeBoardTool, getLegalMovesTool, makeMoveTool, getBoardStateTool } from '../tools/chess-tools';

export const chessBlackAgent = new Agent({
  name: 'Chess Black Agent',
  instructions: `Play chess as BLACK.
1. Call get-board-state to GET the current state of the board
2. Call get-legal-moves for options
3. Call make-move with your choice
No explanation needed.`,
  // model: 'anthropic/claude-haiku-4-5',
  model: "anthropic/claude-opus-4-5-20251101",
  tools: {
    getBoardStateTool,
    // visualizeBoardTool,
    getLegalMovesTool,
    makeMoveTool
  },
});
