import { Chess, Move, Square } from 'chess.js';

export interface GameState {
  fen: string;
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  moveHistory: string[];
  lastMove: string | null;
  legalMoves: string[];
  boardAscii: string;
}

export interface MoveResult {
  success: boolean;
  move?: string;
  error?: string;
  gameState: GameState;
}

class ChessEngine {
  private game: Chess;
  private moveHistory: string[] = [];

  constructor() {
    this.game = new Chess();
  }

  reset(): GameState {
    this.game = new Chess();
    this.moveHistory = [];
    return this.getGameState();
  }

  getGameState(): GameState {
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
      legalMoves: moves.map(m => m.san),
      boardAscii: this.game.ascii(),
    };
  }

  getLegalMoves(): string[] {
    return this.game.moves();
  }

  getLegalMovesVerbose(): Move[] {
    return this.game.moves({ verbose: true });
  }

  makeMove(move: string): MoveResult {
    try {
      const result = this.game.move(move);
      if (result) {
        this.moveHistory.push(result.san);
        return {
          success: true,
          move: result.san,
          gameState: this.getGameState(),
        };
      }
      return {
        success: false,
        error: `Invalid move: ${move}`,
        gameState: this.getGameState(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Invalid move: ${move}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameState: this.getGameState(),
      };
    }
  }

  getBoard(): (string | null)[][] {
    const board = this.game.board();
    return board.map(row =>
      row.map(square =>
        square ? `${square.color}${square.type}` : null
      )
    );
  }

  getPieceAt(square: Square): string | null {
    const piece = this.game.get(square);
    return piece ? `${piece.color}${piece.type}` : null;
  }

  getCurrentTurn(): 'white' | 'black' {
    return this.game.turn() === 'w' ? 'white' : 'black';
  }

  loadFen(fen: string): boolean {
    try {
      this.game.load(fen);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance for game state
let gameInstance: ChessEngine | null = null;

export function getChessEngine(): ChessEngine {
  if (!gameInstance) {
    gameInstance = new ChessEngine();
  }
  return gameInstance;
}

export function resetChessEngine(): ChessEngine {
  gameInstance = new ChessEngine();
  return gameInstance;
}
