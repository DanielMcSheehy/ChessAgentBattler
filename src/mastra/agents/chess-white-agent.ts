import { Agent } from '@mastra/core/agent';
import { visualizeBoardTool, getLegalMovesTool, makeMoveTool } from '../tools/chess-tools';

export const chessWhiteAgent = new Agent({
  name: 'Chess White Agent',
  instructions: `Play chess as WHITE.
1. Call visualize-board to see position
2. Call get-legal-moves for options
3. Call make-move with your choice
No explanation needed.`,
  model: 'anthropic/claude-haiku-4-5',
  tools: {
    visualizeBoardTool,
    getLegalMovesTool,
    makeMoveTool
  },
});
