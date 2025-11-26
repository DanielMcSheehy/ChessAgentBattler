'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Position {
  row: number;
  col: number;
}

interface PlayerView {
  boat: {
    cells: Position[];
    hits: number;
  };
  shots: Array<{ position: Position; result: 'hit' | 'miss' }>;
}

interface GameState {
  gridSize: number;
  currentTurn: 'player1' | 'player2';
  isGameOver: boolean;
  winner: 'player1' | 'player2' | null;
  winReason: string | null;
  turnNumber: number;
  player1Hits: number;
  player2Hits: number;
}

interface VisualizationData {
  player1: PlayerView;
  player2: PlayerView;
  state: GameState;
}

export function BattleshipBoard() {
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentary, setCommentary] = useState<string>('');
  const [lastAgent, setLastAgent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchVisualization = useCallback(async () => {
    try {
      const response = await fetch('/api/battleship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'visualize' }),
      });
      const data = await response.json();
      setVisualization(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch visualization:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchVisualization();
  }, [fetchVisualization]);

  const handleReset = async () => {
    setIsPlaying(false);
    setCommentary('');
    setLastAgent('');
    setError(null);
    try {
      await fetch('/api/battleship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      await fetchVisualization();
    } catch (err) {
      setError('Failed to reset game');
    }
  };

  const handleTurn = useCallback(async () => {
    try {
      const response = await fetch('/api/battleship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'turn' }),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsPlaying(false);
        return null;
      }

      setCommentary(data.commentary || '');
      setLastAgent(data.agent || '');
      await fetchVisualization();

      return data;
    } catch (err) {
      setError('Failed to make turn');
      setIsPlaying(false);
      return null;
    }
  }, [fetchVisualization]);

  useEffect(() => {
    if (!isPlaying || !visualization?.state) return;
    if (visualization.state.isGameOver) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(async () => {
      await handleTurn();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, visualization?.state, handleTurn]);

  const handleBegin = () => {
    setIsPlaying(true);
    setError(null);
  };

  const renderGrid = (playerView: PlayerView, isPlayer1: boolean, showBoat: boolean) => {
    const gridSize = 10;
    const grid: string[][] = [];

    // Initialize grid
    for (let r = 0; r < gridSize; r++) {
      grid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        grid[r][c] = 'water';
      }
    }

    // Mark boat if showing
    if (showBoat && playerView.boat) {
      for (const cell of playerView.boat.cells) {
        grid[cell.row][cell.col] = 'boat';
      }
    }

    // Mark shots
    for (const shot of playerView.shots) {
      const { row, col } = shot.position;
      if (shot.result === 'hit') {
        grid[row][col] = 'hit';
      } else {
        grid[row][col] = 'miss';
      }
    }

    return (
      <div className="flex flex-col gap-0.5">
        {/* Column headers */}
        <div className="flex gap-0.5 ml-6">
          {Array.from({ length: gridSize }, (_, i) => (
            <div key={i} className="w-6 h-6 flex items-center justify-center text-xs text-gray-500">
              {i}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-0.5">
            {/* Row header */}
            <div className="w-6 h-6 flex items-center justify-center text-xs text-gray-500">
              {rowIndex}
            </div>
            {/* Cells */}
            {row.map((cell, colIndex) => {
              let bgColor = 'bg-blue-400'; // water
              let content = '';

              if (cell === 'boat') {
                bgColor = 'bg-gray-600';
                content = '█';
              } else if (cell === 'hit') {
                bgColor = 'bg-red-500';
                content = 'X';
              } else if (cell === 'miss') {
                bgColor = 'bg-blue-200';
                content = '○';
              }

              return (
                <div
                  key={colIndex}
                  className={`w-6 h-6 ${bgColor} flex items-center justify-center text-xs font-bold text-white rounded-sm`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (!visualization) {
    return <div className="text-center p-8">Loading...</div>;
  }

  const { player1, player2, state } = visualization;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h1 className="text-3xl font-bold">Battleship - AI vs AI</h1>

      {/* Game controls */}
      <div className="flex gap-4">
        <Button
          onClick={handleBegin}
          disabled={isPlaying || state.isGameOver}
          size="lg"
        >
          {isPlaying ? 'Playing...' : 'Begin'}
        </Button>
        <Button onClick={handleReset} variant="outline" size="lg">
          Reset
        </Button>
      </div>

      {/* Game status */}
      <div className="flex gap-4 items-center">
        <Badge variant={state.currentTurn === 'player1' ? 'default' : 'secondary'}>
          Player 1 {state.currentTurn === 'player1' && !state.isGameOver && '(Turn)'}
        </Badge>
        <span className="text-lg font-semibold">Turn {state.turnNumber}</span>
        <Badge variant={state.currentTurn === 'player2' ? 'default' : 'secondary'}>
          Player 2 {state.currentTurn === 'player2' && !state.isGameOver && '(Turn)'}
        </Badge>
      </div>

      {/* Hit counters */}
      <div className="flex gap-8 text-sm">
        <div>
          <span className="font-semibold">P1 Boat Damage:</span>{' '}
          <span className={state.player1Hits >= 3 ? 'text-red-500 font-bold' : ''}>
            {state.player1Hits}/3
          </span>
        </div>
        <div>
          <span className="font-semibold">P2 Boat Damage:</span>{' '}
          <span className={state.player2Hits >= 3 ? 'text-red-500 font-bold' : ''}>
            {state.player2Hits}/3
          </span>
        </div>
      </div>

      {/* Game over message */}
      {state.isGameOver && (
        <div className="text-xl font-bold text-center p-4 bg-yellow-100 rounded-lg">
          {state.winReason}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-500 font-semibold">{error}</div>
      )}

      {/* Boards */}
      <div className="flex gap-8 flex-wrap justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Player 1&apos;s View</CardTitle>
            <p className="text-xs text-gray-500 text-center">
              Their boat + their shots on P2
            </p>
          </CardHeader>
          <CardContent>
            {renderGrid(player1, true, true)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Player 2&apos;s View</CardTitle>
            <p className="text-xs text-gray-500 text-center">
              Their boat + their shots on P1
            </p>
          </CardHeader>
          <CardContent>
            {renderGrid(player2, false, true)}
          </CardContent>
        </Card>
      </div>

      {/* Commentary */}
      {(commentary || lastAgent) && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm">
              {lastAgent && `${lastAgent}'s Action`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{commentary}</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
          <span>Water</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
          <span>Boat</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
          <span>Hit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-200 rounded-sm"></div>
          <span>Miss</span>
        </div>
      </div>
    </div>
  );
}
