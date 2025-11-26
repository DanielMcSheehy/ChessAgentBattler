'use client';

import { useEffect, useState } from 'react';

interface ChessBoardProps {
  fen: string;
  lastMove?: string | null;
}

const PIECE_SYMBOLS: Record<string, string> = {
  wk: '\u2654', // White King
  wq: '\u2655', // White Queen
  wr: '\u2656', // White Rook
  wb: '\u2657', // White Bishop
  wn: '\u2658', // White Knight
  wp: '\u2659', // White Pawn
  bk: '\u265A', // Black King
  bq: '\u265B', // Black Queen
  br: '\u265C', // Black Rook
  bb: '\u265D', // Black Bishop
  bn: '\u265E', // Black Knight
  bp: '\u265F', // Black Pawn
};

function parseFen(fen: string): (string | null)[][] {
  const board: (string | null)[][] = [];
  const rows = fen.split(' ')[0].split('/');

  for (const row of rows) {
    const boardRow: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        // Empty squares
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(null);
        }
      } else {
        // Piece
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const piece = char.toLowerCase();
        boardRow.push(`${color}${piece}`);
      }
    }
    board.push(boardRow);
  }

  return board;
}

export function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const [board, setBoard] = useState<(string | null)[][]>([]);
  const [animatingSquare, setAnimatingSquare] = useState<string | null>(null);

  useEffect(() => {
    setBoard(parseFen(fen));

    // Animate last move
    if (lastMove) {
      setAnimatingSquare(lastMove);
      const timer = setTimeout(() => setAnimatingSquare(null), 500);
      return () => clearTimeout(timer);
    }
  }, [fen, lastMove]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="inline-block">
      {/* Column labels - top */}
      <div className="flex ml-8">
        {files.map((file) => (
          <div
            key={`top-${file}`}
            className="w-14 h-6 flex items-center justify-center text-sm font-medium text-zinc-500"
          >
            {file}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Row labels - left */}
        <div className="flex flex-col">
          {ranks.map((rank) => (
            <div
              key={`left-${rank}`}
              className="w-8 h-14 flex items-center justify-center text-sm font-medium text-zinc-500"
            >
              {rank}
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="border-2 border-zinc-700 rounded shadow-lg">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const squareName = `${files[colIndex]}${ranks[rowIndex]}`;
                const isAnimating = animatingSquare === squareName;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-14 h-14 flex items-center justify-center text-5xl
                      transition-all duration-200
                      ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                      ${isAnimating ? 'ring-4 ring-yellow-400 ring-inset' : ''}
                    `}
                  >
                    {piece && (
                      <span
                        className={`
                          select-none
                          ${piece.startsWith('w') ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-zinc-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'}
                          ${isAnimating ? 'animate-pulse scale-110' : ''}
                        `}
                      >
                        {PIECE_SYMBOLS[piece]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Row labels - right */}
        <div className="flex flex-col">
          {ranks.map((rank) => (
            <div
              key={`right-${rank}`}
              className="w-8 h-14 flex items-center justify-center text-sm font-medium text-zinc-500"
            >
              {rank}
            </div>
          ))}
        </div>
      </div>

      {/* Column labels - bottom */}
      <div className="flex ml-8">
        {files.map((file) => (
          <div
            key={`bottom-${file}`}
            className="w-14 h-6 flex items-center justify-center text-sm font-medium text-zinc-500"
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}
