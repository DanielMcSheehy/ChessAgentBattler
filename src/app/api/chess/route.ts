import { NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { getChessEngine, resetChessEngine, type GameState } from '@/lib/chess-engine';
import { chessAdvisorAgent } from '@/mastra/agents/chess-advisor-agent';

// Store pre-computed advisor analysis for each player
const advisorCache: {
  white: { fen: string; analysis: string } | null;
  black: { fen: string; analysis: string } | null;
} = {
  white: null,
  black: null,
};

// Track pending advisor tasks so we can cancel them
let pendingAdvisorTask: {
  player: 'white' | 'black';
  abortController: AbortController;
  fen: string;
} | null = null;

export async function GET() {
  const engine = getChessEngine();
  const state = engine.getGameState();
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'reset') {
    // Cancel any pending advisor task
    if (pendingAdvisorTask) {
      pendingAdvisorTask.abortController.abort();
      pendingAdvisorTask = null;
    }

    const engine = resetChessEngine();
    const state = engine.getGameState();
    // Clear advisor cache on reset
    advisorCache.white = null;
    advisorCache.black = null;
    return NextResponse.json({ state, message: 'Game reset' });
  }

  if (action === 'move') {
    // Cancel any pending advisor task - opponent moved before advisor finished
    if (pendingAdvisorTask) {
      pendingAdvisorTask.abortController.abort();
      pendingAdvisorTask = null;
    }

    const engine = getChessEngine();
    const state = engine.getGameState();

    if (state.isGameOver) {
      return NextResponse.json({
        state,
        message: 'Game is already over',
        commentary: getGameOverMessage(state),
      });
    }

    const currentPlayer = state.turn === 'w' ? 'white' : 'black';
    const agentName = state.turn === 'w' ? 'chessWhiteAgent' : 'chessBlackAgent';
    const agent = mastra.getAgent(agentName);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent ${agentName} not found` },
        { status: 500 }
      );
    }

    try {
      // Check if we have pre-computed advice for this player
      const cachedAdvice = advisorCache[currentPlayer];
      let adviceContext = '';
      let usedAdvisor = false;

      if (cachedAdvice && cachedAdvice.fen === state.fen) {
        adviceContext = `\n\nYour advisor has pre-analyzed this position:\n${cachedAdvice.analysis}\n\nConsider this advice when making your move.`;
        usedAdvisor = true;
        // Clear used advice
        advisorCache[currentPlayer] = null;
      }

      const prompt = `Make a move.${adviceContext}`;

      // Make the move - maxSteps: 2 = get legal moves + make move
      const mainResponse = await agent.generate(prompt, {
        maxSteps: 2,
      });
      const updatedState = engine.getGameState();

      // After move is made, start advisor for the player who just moved
      // (thinking about their next move while opponent thinks)
      if (!updatedState.isGameOver) {
        // Fire and forget - start advisor in background
        startAdvisorInBackground(currentPlayer, updatedState.fen);
      }

      return NextResponse.json({
        state: updatedState,
        commentary: mainResponse.text,
        agent: state.turn === 'w' ? 'White' : 'Black',
        usedAdvisor,
      });
    } catch (error) {
      console.error('Agent error:', error);
      return NextResponse.json(
        { error: 'Failed to get agent move', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// Start advisor analysis in background (non-blocking)
function startAdvisorInBackground(player: 'white' | 'black', currentFen: string): void {
  const abortController = new AbortController();

  pendingAdvisorTask = {
    player,
    abortController,
    fen: currentFen,
  };

  // Run advisor in background - don't await
  runAdvisorAnalysis(player, currentFen, abortController.signal)
    .then((analysis) => {
      if (analysis && pendingAdvisorTask?.fen === currentFen) {
        // Only cache if this task wasn't cancelled and position is still relevant
        const engine = getChessEngine();
        const state = engine.getGameState();

        // Cache for when it's this player's turn again
        advisorCache[player] = {
          fen: state.fen, // Store the FEN that the advice is for (after opponent moves)
          analysis,
        };
        console.log(`Advisor cached analysis for ${player}`);
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        console.error(`Advisor error for ${player}:`, err);
      }
    })
    .finally(() => {
      // Clear pending task if it's still this one
      if (pendingAdvisorTask?.fen === currentFen) {
        pendingAdvisorTask = null;
      }
    });
}

// Run the advisor agent analysis (can be cancelled)
async function runAdvisorAnalysis(
  player: 'white' | 'black',
  startFen: string,
  signal: AbortSignal
): Promise<string | null> {
  // Check if already aborted
  if (signal.aborted) {
    return null;
  }

  try {
    const response = await chessAdvisorAgent.generate(
      `Get moves for ${player}.`,
      { maxSteps: 1 }
    );

    // Check if cancelled during execution
    if (signal.aborted) {
      return null;
    }

    return response.text;
  } catch (error) {
    if (signal.aborted) {
      return null;
    }
    throw error;
  }
}

function getGameOverMessage(state: GameState): string {
  if (state.isCheckmate) {
    const winner = state.turn === 'w' ? 'Black' : 'White';
    return `Checkmate! ${winner} wins!`;
  }
  if (state.isStalemate) {
    return 'Stalemate! The game is a draw.';
  }
  if (state.isDraw) {
    return 'The game is a draw.';
  }
  return 'Game over.';
}
