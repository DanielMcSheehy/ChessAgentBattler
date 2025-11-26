import { NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { getBattleshipEngine, resetBattleshipEngine, type GameState, type Player } from '@/lib/battleship-engine';
import { setCurrentBattleshipPlayer } from '@/mastra/tools/battleship-tools';

export async function GET() {
  const engine = getBattleshipEngine();
  const state = engine.getGameState();

  // Return sanitized state (don't reveal boat positions to frontend)
  return NextResponse.json({
    state: {
      gridSize: state.gridSize,
      currentTurn: state.currentTurn,
      isGameOver: state.isGameOver,
      winner: state.winner,
      winReason: state.winReason,
      turnNumber: state.turnNumber,
      player1Hits: state.players.player1.boat.hits.size,
      player2Hits: state.players.player2.boat.hits.size,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'reset') {
    const engine = resetBattleshipEngine();
    const state = engine.getGameState();
    return NextResponse.json({
      state: getSanitizedState(state),
      message: 'Game reset',
    });
  }

  if (action === 'turn') {
    const engine = getBattleshipEngine();
    const state = engine.getGameState();

    if (state.isGameOver) {
      return NextResponse.json({
        state: getSanitizedState(state),
        message: 'Game is already over',
        commentary: state.winReason,
      });
    }

    const currentPlayer = state.currentTurn;
    const agentName = currentPlayer === 'player1' ? 'battleshipPlayer1Agent' : 'battleshipPlayer2Agent';
    const agent = mastra.getAgent(agentName);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent ${agentName} not found` },
        { status: 500 }
      );
    }

    // Set which player is using tools
    setCurrentBattleshipPlayer(currentPlayer);

    try {
      const prompt = `Your turn. Check status and make a move.`;

      const response = await agent.generate(prompt, {
        maxSteps: 3,
      });

      const updatedState = engine.getGameState();

      return NextResponse.json({
        state: getSanitizedState(updatedState),
        commentary: response.text,
        agent: currentPlayer === 'player1' ? 'Player 1' : 'Player 2',
      });
    } catch (error) {
      console.error('Agent error:', error);
      return NextResponse.json(
        { error: 'Failed to get agent move', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  // Get full visualization for both players (for UI display)
  if (action === 'visualize') {
    const engine = getBattleshipEngine();
    const player1View = engine.getPlayerView('player1');
    const player2View = engine.getPlayerView('player2');
    const state = engine.getGameState();

    return NextResponse.json({
      player1: {
        boat: player1View.myBoat,
        shots: player1View.myShotsHistory,
      },
      player2: {
        boat: player2View.myBoat,
        shots: player2View.myShotsHistory,
      },
      state: getSanitizedState(state),
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

function getSanitizedState(state: GameState) {
  return {
    gridSize: state.gridSize,
    currentTurn: state.currentTurn,
    isGameOver: state.isGameOver,
    winner: state.winner,
    winReason: state.winReason,
    turnNumber: state.turnNumber,
    player1Hits: state.players.player1.boat.hits.size,
    player2Hits: state.players.player2.boat.hits.size,
  };
}
