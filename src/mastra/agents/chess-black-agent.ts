import { Agent } from '@mastra/core/agent';
import { visualizeBoardTool, getLegalMovesTool, makeMoveTool } from '../tools/chess-tools';

export const chessBlackAgent = new Agent({
  name: 'Chess Black Agent',
  instructions: `Play chess as BLACK.
1. Call visualize-board to see position
2. Call get-legal-moves for options
3. Call make-move with your choice
No explanation needed.`,
  // model: 'anthropic/claude-haiku-4-5',
  model: "anthropic/claude-sonnet-4-5-20250929",
  tools: {
    visualizeBoardTool,
    getLegalMovesTool,
    makeMoveTool
  },
});
