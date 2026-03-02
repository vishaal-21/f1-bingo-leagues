import { Prediction } from '@/types';
import { motion } from 'framer-motion';
import { Check, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BingoBoardProps {
  predictions: Prediction[];
  onCellClick?: (prediction: Prediction) => void;
  editable?: boolean;
  onCellEdit?: (index: number, text: string) => void;
}

const BingoBoard = ({ predictions, onCellClick, editable = false, onCellEdit }: BingoBoardProps) => {
  const getCellState = (pred: Prediction) => {
    if (pred.confirmedAt) return 'confirmed';
    if (pred.marked) return 'pending';
    return 'default';
  };

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {predictions.map((pred, index) => {
          const state = getCellState(pred);
          const isFreeSpace = pred.text === 'FREE SPACE';

          return (
            <motion.button
              key={pred.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onCellClick?.(pred)}
              disabled={editable}
              className={cn(
                'bingo-cell aspect-square rounded-md border p-1 sm:p-2 flex items-center justify-center text-center',
                'text-[10px] sm:text-xs font-medium leading-tight',
                'hover:border-primary/50 transition-all cursor-pointer',
                state === 'confirmed' && 'bg-racing-green/20 border-racing-green/50',
                state === 'pending' && 'bg-racing-amber/20 border-racing-amber/50',
                state === 'default' && 'bg-secondary border-border hover:bg-accent',
                isFreeSpace && 'bg-primary/20 border-primary/50'
              )}
            >
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-0.5">
                {state === 'confirmed' && (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-racing-green absolute -top-0.5 -right-0.5" />
                )}
                {state === 'pending' && (
                  <Clock className="w-3 h-3 text-racing-amber absolute -top-0.5 -right-0.5" />
                )}
                {isFreeSpace && (
                  <Star className="w-4 h-4 text-primary mb-0.5" />
                )}
                <span className={cn(
                  'line-clamp-3',
                  state === 'confirmed' && 'text-racing-green',
                  state === 'pending' && 'text-racing-amber',
                  isFreeSpace && 'text-primary font-bold'
                )}>
                  {editable ? (
                    <input
                      type="text"
                      value={pred.text}
                      onChange={(e) => onCellEdit?.(index, e.target.value)}
                      className="w-full bg-transparent text-center text-foreground text-[10px] sm:text-xs focus:outline-none"
                      maxLength={120}
                      placeholder="Enter prediction..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    pred.text
                  )}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BingoBoard;
