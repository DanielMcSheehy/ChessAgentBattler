import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Chess } from 'chess.js';

class ChessEngine {
  constructor() {
    this.moveHistory = [];
    this.game = new Chess();
  }
  reset() {
    this.game = new Chess();
    this.moveHistory = [];
    return this.getGameState();
  }
  getGameState() {
    const moves = this.game.moves({ verbose: true });
    return {
      fen: this.game.fen(),
      turn: this.game.turn(),
      isCheck: this.game.isCheck(),
      isCheckmate: this.game.isCheckmate(),
      isStalemate: this.game.isStalemate(),
      isDraw: this.game.isDraw(),
      isGameOver: this.game.isGameOver(),
      moveHistory: [...this.moveHistory],
      lastMove: this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null,
      legalMoves: moves.map((m) => m.san),
      boardAscii: this.game.ascii()
    };
  }
  getLegalMoves() {
    return this.game.moves();
  }
  getLegalMovesVerbose() {
    return this.game.moves({ verbose: true });
  }
  makeMove(move) {
    try {
      const result = this.game.move(move);
      if (result) {
        this.moveHistory.push(result.san);
        return {
          success: true,
          move: result.san,
          gameState: this.getGameState()
        };
      }
      return {
        success: false,
        error: `Invalid move: ${move}`,
        gameState: this.getGameState()
      };
    } catch (error) {
      return {
        success: false,
        error: `Invalid move: ${move}. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        gameState: this.getGameState()
      };
    }
  }
  getBoard() {
    const board = this.game.board();
    return board.map(
      (row) => row.map(
        (square) => square ? `${square.color}${square.type}` : null
      )
    );
  }
  getPieceAt(square) {
    const piece = this.game.get(square);
    return piece ? `${piece.color}${piece.type}` : null;
  }
  getCurrentTurn() {
    return this.game.turn() === "w" ? "white" : "black";
  }
  loadFen(fen) {
    try {
      this.game.load(fen);
      return true;
    } catch {
      return false;
    }
  }
}
let gameInstance = null;
function getChessEngine() {
  if (!gameInstance) {
    gameInstance = new ChessEngine();
  }
  return gameInstance;
}

function createEnhancedBoardVisual(engine) {
  const state = engine.getGameState();
  const board = engine.getBoard();
  const pieceSymbols = {
    wk: "\u2654",
    wq: "\u2655",
    wr: "\u2656",
    wb: "\u2657",
    wn: "\u2658",
    wp: "\u2659",
    bk: "\u265A",
    bq: "\u265B",
    br: "\u265C",
    bb: "\u265D",
    bn: "\u265E",
    bp: "\u265F"
  };
  const material = { white: 0, black: 0 };
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const pieceCounts = {
    white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    black: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };
  board.forEach((row) => {
    row.forEach((piece) => {
      if (piece) {
        const color = piece[0] === "w" ? "white" : "black";
        const type = piece[1];
        material[color] += pieceValues[type];
        if (type !== "k") pieceCounts[color][type]++;
      }
    });
  });
  let visual = "\n\u250C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2510\n";
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  board.forEach((row, i) => {
    const rank = 8 - i;
    visual += "\u2502";
    row.forEach((piece) => {
      const symbol = piece ? pieceSymbols[piece] : " ";
      visual += ` ${symbol} \u2502`;
    });
    visual += ` ${rank}
`;
    if (i < 7) {
      visual += "\u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524\n";
    }
  });
  visual += "\u2514\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2518\n";
  visual += "  " + files.map((f) => f + "  ").join(" ") + "\n";
  visual += "\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n";
  visual += `Turn: ${state.turn === "w" ? "WHITE" : "BLACK"} to move
`;
  if (state.isCheck) visual += "\u26A0\uFE0F  IN CHECK!\n";
  if (state.lastMove) visual += `Last move: ${state.lastMove}
`;
  visual += `Move #${Math.floor(state.moveHistory.length / 2) + 1}
`;
  visual += "\n--- Material ---\n";
  visual += `White: \u2659\xD7${pieceCounts.white.p} \u2658\xD7${pieceCounts.white.n} \u2657\xD7${pieceCounts.white.b} \u2656\xD7${pieceCounts.white.r} \u2655\xD7${pieceCounts.white.q} (${material.white} pts)
`;
  visual += `Black: \u265F\xD7${pieceCounts.black.p} \u265E\xD7${pieceCounts.black.n} \u265D\xD7${pieceCounts.black.b} \u265C\xD7${pieceCounts.black.r} \u265B\xD7${pieceCounts.black.q} (${material.black} pts)
`;
  const advantage = material.white - material.black;
  if (advantage > 0) visual += `White is ahead by ${advantage} points
`;
  else if (advantage < 0) visual += `Black is ahead by ${-advantage} points
`;
  else visual += "Material is equal\n";
  return visual;
}
const visualizeBoardTool = createTool({
  id: "visualize-board",
  description: "IMPORTANT: Use this tool to SEE the chess board visually before making any move. Returns an ASCII art representation of the current board position with piece symbols (\u2654\u2655\u2656\u2657\u2658\u2659 for white, \u265A\u265B\u265C\u265D\u265E\u265F for black), material count, and game status. This helps you understand the position spatially.",
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    board: z.string().describe("Visual ASCII representation of the chess board with Unicode piece symbols"),
    summary: z.string().describe("Brief summary of the position")
  }),
  execute: async () => {
    const engine = getChessEngine();
    const state = engine.getGameState();
    const visual = createEnhancedBoardVisual(engine);
    let summary = `Position after ${state.moveHistory.length} half-moves. `;
    if (state.isCheck) summary += "The king is in CHECK! ";
    if (state.isCheckmate) summary += "CHECKMATE! ";
    if (state.isStalemate) summary += "STALEMATE! ";
    summary += `${state.turn === "w" ? "White" : "Black"} to play.`;
    return {
      board: visual,
      summary
    };
  }
});
const getBoardStateTool = createTool({
  id: "get-board-state",
  description: "Get the current state of the chess board including position, whose turn it is, and game status. Use this along with visualize-board to understand the position before making a move.",
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    fen: z.string().describe("The FEN notation of the current position"),
    turn: z.enum(["w", "b"]).describe("Whose turn it is (w = white, b = black)"),
    isCheck: z.boolean().describe("Whether the current player is in check"),
    isCheckmate: z.boolean().describe("Whether the game has ended in checkmate"),
    isStalemate: z.boolean().describe("Whether the game has ended in stalemate"),
    isDraw: z.boolean().describe("Whether the game has ended in a draw"),
    isGameOver: z.boolean().describe("Whether the game is over"),
    moveHistory: z.array(z.string()).describe("List of all moves played in the game"),
    lastMove: z.string().nullable().describe("The last move played"),
    boardVisual: z.string().describe("Visual ASCII representation of the board with piece symbols")
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
      boardVisual: createEnhancedBoardVisual(engine)
    };
  }
});
const getLegalMovesTool = createTool({
  id: "get-legal-moves",
  description: "Get all legal moves available in the current position. Returns moves in Standard Algebraic Notation (SAN). Use this to see what moves are possible before deciding on your move.",
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    moves: z.array(z.string()).describe('Array of legal moves in SAN notation (e.g., "e4", "Nf3", "O-O")'),
    count: z.number().describe("Number of legal moves available")
  }),
  execute: async () => {
    const engine = getChessEngine();
    const moves = engine.getLegalMoves();
    return {
      moves,
      count: moves.length
    };
  }
});
const makeMoveTool = createTool({
  id: "make-move",
  description: 'Make a chess move. Provide the move in Standard Algebraic Notation (SAN) like "e4", "Nf3", "Bxc6", "O-O" (castling kingside), "O-O-O" (castling queenside), or long algebraic notation like "e2e4". The move must be legal.',
  inputSchema: z.object({
    move: z.string().describe('The move to make in SAN notation (e.g., "e4", "Nf3", "Bxc6", "O-O")')
  }),
  outputSchema: z.object({
    success: z.boolean().describe("Whether the move was successful"),
    move: z.string().optional().describe("The move that was played in SAN notation"),
    error: z.string().optional().describe("Error message if the move failed"),
    newFen: z.string().describe("The new FEN position after the move"),
    isCheck: z.boolean().describe("Whether the opponent is now in check"),
    isCheckmate: z.boolean().describe("Whether this move resulted in checkmate"),
    isGameOver: z.boolean().describe("Whether the game is now over")
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
      isGameOver: result.gameState.isGameOver
    };
  }
});

export { getBoardStateTool, getLegalMovesTool, makeMoveTool, visualizeBoardTool };
