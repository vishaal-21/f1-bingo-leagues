import { Prediction } from '@/types';

// Bingo patterns: rows, columns, and diagonals
export const BINGO_PATTERNS = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export interface BingoAnalysis {
  completedBingos: number[][];
  totalBingos: number;
  fullBoardCompleted: boolean;
  confirmedCount: number;
  points: number;
}

/**
 * Analyzes the board and calculates:
 * - Which bingos (rows/columns/diagonals) are completed
 * - Total number of bingos
 * - Whether the full board is completed
 * - Total points earned
 */
export function analyzeBingoBoard(predictions: Prediction[]): BingoAnalysis {
  const completedBingos: number[][] = [];
  
  // Check each pattern
  for (const pattern of BINGO_PATTERNS) {
    const isComplete = pattern.every((index) => {
      const prediction = predictions.find((p) => p.positionIndex === index);
      // Must have a confirmedAt value (not null, not undefined)
      return prediction?.confirmedAt != null;
    });
    
    if (isComplete) {
      completedBingos.push(pattern);
    }
  }
  
  // Count confirmed predictions
  const confirmedCount = predictions.filter((p) => p.confirmedAt != null).length;
  
  // Count confirmed predictions excluding FREE SPACE (position 12)
  const confirmedCountExcludingFree = predictions.filter(
    (p) => p.confirmedAt != null && p.positionIndex !== 12
  ).length;
  
  // Check if full board is completed (all 25 cells)
  const fullBoardCompleted = confirmedCount === 25;
  
  // Calculate points - FREE SPACE doesn't count toward points, only for bingos
  const cellPoints = confirmedCountExcludingFree * 5; // 5 points per cell (excluding FREE SPACE)
  const bingoBonus = completedBingos.length * 25; // 25 points per bingo
  const fullBoardBonus = fullBoardCompleted ? 100 : 0; // 100 points for full board
  
  const totalPoints = cellPoints + bingoBonus + fullBoardBonus;
  
  return {
    completedBingos,
    totalBingos: completedBingos.length,
    fullBoardCompleted,
    confirmedCount,
    points: totalPoints,
  };
}

/**
 * Gets the indices of all cells that are part of completed bingos
 */
export function getHighlightedCells(completedBingos: number[][]): Set<number> {
  const highlighted = new Set<number>();
  for (const bingo of completedBingos) {
    for (const index of bingo) {
      highlighted.add(index);
    }
  }
  return highlighted;
}
