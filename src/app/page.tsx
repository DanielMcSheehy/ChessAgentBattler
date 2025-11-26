'use client';

import { useState, useRef, useEffect } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameState {
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

interface MoveEntry {
  moveNumber: number;
  white?: string;
  black?: string;
  whiteCommentary?: string;
  blackCommentary?: string;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function ChessGame() {
  const [gameState, setGameState] = useState<GameState>({
    fen: INITIAL_FEN,
    turn: 'w',
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    moveHistory: [],
    lastMove: null,
    legalMoves: [],
    boardAscii: '',
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [moveLog, setMoveLog] = useState<MoveEntry[]>([]);
  const [currentCommentary, setCurrentCommentary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const moveLogRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    // Scroll to bottom of move log when new moves are added
    if (moveLogRef.current) {
      moveLogRef.current.scrollTop = moveLogRef.current.scrollHeight;
    }
  }, [moveLog]);

  const fetchGameState = async () => {
    try {
      const response = await fetch('/api/chess');
      const data = await response.json();
      if (data.state) {
        setGameState(data.state);
      }
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  };

  const resetGame = async () => {
    setIsPlaying(false);
    setIsThinking(false);
    setMoveLog([]);
    setCurrentCommentary('');
    setError(null);

    try {
      const response = await fetch('/api/chess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await response.json();
      if (data.state) {
        setGameState(data.state);
      }
    } catch (err) {
      setError('Failed to reset game');
      console.error(err);
    }
  };

  const makeMove = async (): Promise<boolean> => {
    if (!isPlayingRef.current) return false;

    setIsThinking(true);
    setError(null);

    try {
      const response = await fetch('/api/chess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move' }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsThinking(false);
        return false;
      }

      if (data.state) {
        setGameState(data.state);

        // Update move log
        const moveHistory = data.state.moveHistory;
        const newMoveLog: MoveEntry[] = [];

        for (let i = 0; i < moveHistory.length; i += 2) {
          const entry: MoveEntry = {
            moveNumber: Math.floor(i / 2) + 1,
            white: moveHistory[i],
            black: moveHistory[i + 1],
          };
          newMoveLog.push(entry);
        }

        setMoveLog(newMoveLog);
        setCurrentCommentary(data.commentary || '');

        if (data.state.isGameOver) {
          setIsPlaying(false);
          return false;
        }
      }

      setIsThinking(false);
      return true;
    } catch (err) {
      setError('Failed to make move');
      console.error(err);
      setIsThinking(false);
      return false;
    }
  };

  const startGame = async () => {
    await resetGame();
    setIsPlaying(true);
    runGameLoop();
  };

  const runGameLoop = async () => {
    // Small delay to allow state to update
    await new Promise((r) => setTimeout(r, 500));

    while (isPlayingRef.current) {
      const success = await makeMove();
      if (!success) break;
      // Add a delay between moves for better visualization
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  const stopGame = () => {
    setIsPlaying(false);
  };

  const getStatusMessage = (): string => {
    if (gameState.isCheckmate) {
      return gameState.turn === 'w' ? 'Checkmate! Black wins!' : 'Checkmate! White wins!';
    }
    if (gameState.isStalemate) {
      return 'Stalemate - Draw!';
    }
    if (gameState.isDraw) {
      return 'Draw!';
    }
    if (gameState.isCheck) {
      return `${gameState.turn === 'w' ? 'White' : 'Black'} is in check!`;
    }
    return `${gameState.turn === 'w' ? 'White' : 'Black'} to move`;
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">AI Chess Battle</h1>
        <p className="text-center text-zinc-400 mb-8">
          Watch two AI agents battle it out on the chess board
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Game Info */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Game Status</span>
                <Badge
                  variant={gameState.isGameOver ? 'destructive' : isPlaying ? 'default' : 'secondary'}
                >
                  {gameState.isGameOver ? 'Game Over' : isPlaying ? 'Playing' : 'Ready'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg font-medium">{getStatusMessage()}</div>

              {isThinking && (
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full" />
                  <span>{gameState.turn === 'w' ? 'White' : 'Black'} is thinking...</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {!isPlaying && !gameState.isGameOver && (
                  <Button onClick={startGame} className="w-full" size="lg">
                    Begin Game
                  </Button>
                )}
                {isPlaying && (
                  <Button onClick={stopGame} variant="destructive" className="w-full" size="lg">
                    Stop Game
                  </Button>
                )}
                {(gameState.isGameOver || (!isPlaying && gameState.moveHistory.length > 0)) && (
                  <Button onClick={resetGame} variant="outline" className="w-full" size="lg">
                    New Game
                  </Button>
                )}
              </div>

              {error && (
                <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded">{error}</div>
              )}

              <div className="pt-4 border-t border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Players</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded" />
                    <span>White: Aggressive Tactician (Tal style)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-zinc-900 border border-zinc-600 rounded" />
                    <span>Black: Positional Master (Karpov style)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Center - Chess Board */}
          <div className="flex flex-col items-center justify-center">
            <ChessBoard fen={gameState.fen} lastMove={gameState.lastMove} />
          </div>

          {/* Right Panel - Move History & Commentary */}
          <div className="space-y-4">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle>Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={moveLogRef}
                  className="h-48 overflow-y-auto font-mono text-sm space-y-1"
                >
                  {moveLog.length === 0 ? (
                    <p className="text-zinc-500">No moves yet</p>
                  ) : (
                    moveLog.map((entry) => (
                      <div key={entry.moveNumber} className="flex gap-4">
                        <span className="text-zinc-500 w-8">{entry.moveNumber}.</span>
                        <span className="w-16">{entry.white || ''}</span>
                        <span className="w-16">{entry.black || ''}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle>AI Commentary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto text-sm">
                  {currentCommentary ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{currentCommentary}</p>
                    </div>
                  ) : (
                    <p className="text-zinc-500">
                      Click &quot;Begin Game&quot; to start the AI chess battle
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
