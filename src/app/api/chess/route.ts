import { NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { getChessEngine, resetChessEngine, type GameState } from '@/lib/chess-engine';

export async function GET() {
  const engine = getChessEngine();
  const state = engine.getGameState();
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'reset') {
    const engine = resetChessEngine();
    const state = engine.getGameState();
    return NextResponse.json({ state, message: 'Game reset' });
  }

  if (action === 'move') {
    const engine = getChessEngine();
    const state = engine.getGameState();

    if (state.isGameOver) {
      return NextResponse.json({
        state,
        message: 'Game is already over',
        commentary: getGameOverMessage(state),
      });
    }

    const agentName = state.turn === 'w' ? 'chessWhiteAgent' : 'chessBlackAgent';
    const agent = mastra.getAgent(agentName);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent ${agentName} not found` },
        { status: 500 }
      );
    }

    try {
      const prompt = state.turn === 'w'
        ? "It's your turn as White. Analyze the position and make your best move."
        : "It's your turn as Black. Analyze the position and make your best move.";

      const response = await agent.generate(prompt);

      const updatedState = engine.getGameState();

      return NextResponse.json({
        state: updatedState,
        commentary: response.text,
        agent: state.turn === 'w' ? 'White' : 'Black',
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
