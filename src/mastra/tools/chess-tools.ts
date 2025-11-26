import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getChessEngine } from '@/lib/chess-engine';

// Helper to create enhanced visual board representation
function createEnhancedBoardVisual(engine: ReturnType<typeof getChessEngine>): string {
  const state = engine.getGameState();
  const board = engine.getBoard();

  // Piece symbols for better visualization
  const pieceSymbols: Record<string, string> = {
    wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
    bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
  };

  // Count material
  const material = { white: 0, black: 0 };
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const pieceCounts = {
    white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    black: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };

  board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        const color = piece[0] === 'w' ? 'white' : 'black';
        const type = piece[1] as 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
        material[color] += pieceValues[type];
        if (type !== 'k') pieceCounts[color][type]++;
      }
    });
  });

  // Build visual board
  let visual = '\n┌───┬───┬───┬───┬───┬───┬───┬───┐\n';
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  board.forEach((row, i) => {
    const rank = 8 - i;
    visual += '│';
    row.forEach((piece) => {
      const symbol = piece ? pieceSymbols[piece] : ' ';
      visual += ` ${symbol} │`;
    });
    visual += ` ${rank}\n`;
    if (i < 7) {
      visual += '├───┼───┼───┼───┼───┼───┼───┼───┤\n';
    }
  });
  visual += '└───┴───┴───┴───┴───┴───┴───┴───┘\n';
  visual += '  ' + files.map(f => f + '  ').join(' ') + '\n';

  // Add game info
  visual += '\n═══════════════════════════════════\n';
  visual += `Turn: ${state.turn === 'w' ? 'WHITE' : 'BLACK'} to move\n`;
  if (state.isCheck) visual += '⚠️  IN CHECK!\n';
  if (state.lastMove) visual += `Last move: ${state.lastMove}\n`;
  visual += `Move #${Math.floor(state.moveHistory.length / 2) + 1}\n`;
  visual += '\n--- Material ---\n';
  visual += `White: ♙×${pieceCounts.white.p} ♘×${pieceCounts.white.n} ♗×${pieceCounts.white.b} ♖×${pieceCounts.white.r} ♕×${pieceCounts.white.q} (${material.white} pts)\n`;
  visual += `Black: ♟×${pieceCounts.black.p} ♞×${pieceCounts.black.n} ♝×${pieceCounts.black.b} ♜×${pieceCounts.black.r} ♛×${pieceCounts.black.q} (${material.black} pts)\n`;

  const advantage = material.white - material.black;
  if (advantage > 0) visual += `White is ahead by ${advantage} points\n`;
  else if (advantage < 0) visual += `Black is ahead by ${-advantage} points\n`;
  else visual += 'Material is equal\n';

  return visual;
}

export const visualizeBoardTool = createTool({
  id: 'visualize-board',
  description: 'IMPORTANT: Use this tool to SEE the chess board visually before making any move. Returns an ASCII art representation of the current board position with piece symbols (♔♕♖♗♘♙ for white, ♚♛♜♝♞♟ for black), material count, and game status. This helps you understand the position spatially.',
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    board: z.string().describe('Visual ASCII representation of the chess board with Unicode piece symbols'),
    summary: z.string().describe('Brief summary of the position'),
  }),
  execute: async () => {
    const engine = getChessEngine();
    const state = engine.getGameState();
    const visual = createEnhancedBoardVisual(engine);

    let summary = `Position after ${state.moveHistory.length} half-moves. `;
    if (state.isCheck) summary += 'The king is in CHECK! ';
    if (state.isCheckmate) summary += 'CHECKMATE! ';
    if (state.isStalemate) summary += 'STALEMATE! ';
    summary += `${state.turn === 'w' ? 'White' : 'Black'} to play.`;

    return {
      board: visual,
      summary,
    };
  },
});

export const getBoardStateTool = createTool({
  id: 'get-board-state',
  description: 'Get the current state of the chess board including position, whose turn it is, and game status. Use this along with visualize-board to understand the position before making a move.',
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    fen: z.string().describe('The FEN notation of the current position'),
    turn: z.enum(['w', 'b']).describe('Whose turn it is (w = white, b = black)'),
    isCheck: z.boolean().describe('Whether the current player is in check'),
    isCheckmate: z.boolean().describe('Whether the game has ended in checkmate'),
    isStalemate: z.boolean().describe('Whether the game has ended in stalemate'),
    isDraw: z.boolean().describe('Whether the game has ended in a draw'),
    isGameOver: z.boolean().describe('Whether the game is over'),
    moveHistory: z.array(z.string()).describe('List of all moves played in the game'),
    lastMove: z.string().nullable().describe('The last move played'),
    // boardVisual: z.string().describe('Visual ASCII representation of the board with piece symbols'),
  }),
  execute: async () => {
    const engine = getChessEngine();
    const state = engine.getGameState();
    return {
      fen: state.fen,
      turn: state.turn,
      isCheck: state.isCheck,
      isCheckmate: state.isCheckmate,
      isStalemate: state.isStalemate,
      isDraw: state.isDraw,
      isGameOver: state.isGameOver,
      moveHistory: state.moveHistory,
      lastMove: state.lastMove,
      // boardVisual: createEnhancedBoardVisual(engine),
    };
  },
});

export const getLegalMovesTool = createTool({
  id: 'get-legal-moves',
  description: 'Get all legal moves available in the current position. Returns moves in Standard Algebraic Notation (SAN). Use this to see what moves are possible before deciding on your move.',
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    moves: z.array(z.string()).describe('Array of legal moves in SAN notation (e.g., "e4", "Nf3", "O-O")'),
    count: z.number().describe('Number of legal moves available'),
  }),
  execute: async () => {
    const engine = getChessEngine();
    const moves = engine.getLegalMoves();
    return {
      moves,
      count: moves.length,
    };
  },
});

export const makeMoveTool = createTool({
  id: 'make-move',
  description: 'Make a chess move. Provide the move in Standard Algebraic Notation (SAN) like "e4", "Nf3", "Bxc6", "O-O" (castling kingside), "O-O-O" (castling queenside), or long algebraic notation like "e2e4". The move must be legal.',
  inputSchema: z.object({
    move: z.string().describe('The move to make in SAN notation (e.g., "e4", "Nf3", "Bxc6", "O-O")'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the move was successful'),
    move: z.string().optional().describe('The move that was played in SAN notation'),
    error: z.string().optional().describe('Error message if the move failed'),
    newFen: z.string().describe('The new FEN position after the move'),
    isCheck: z.boolean().describe('Whether the opponent is now in check'),
    isCheckmate: z.boolean().describe('Whether this move resulted in checkmate'),
    isGameOver: z.boolean().describe('Whether the game is now over'),
  }),
  execute: async ({ context }) => {
    const engine = getChessEngine();
    const result = engine.makeMove(context.move);
    return {
      success: result.success,
      move: result.move,
      error: result.error,
      newFen: result.gameState.fen,
      isCheck: result.gameState.isCheck,
      isCheckmate: result.gameState.isCheckmate,
      isGameOver: result.gameState.isGameOver,
    };
  },
});
