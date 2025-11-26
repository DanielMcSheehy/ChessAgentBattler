import { Agent } from '@mastra/core/agent';
import { visualizeBoardTool, getLegalMovesTool } from '../tools/chess-tools';

export const chessAdvisorAgent = new Agent({
  name: 'Chess Advisor',
  instructions: `Analyze chess position and suggest top 3 moves.
1. Call visualize-board to see position
2. Call get-legal-moves for options
3. Output only: "1. [move] 2. [move] 3. [move]"`,
  model: 'anthropic/claude-haiku-4-5',
  tools: {
    visualizeBoardTool,
    getLegalMovesTool,
  },
});
