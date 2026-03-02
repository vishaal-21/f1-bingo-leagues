import { LeagueMember } from '@/types';
import { motion } from 'framer-motion';
import { Trophy, Target, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonLeaderboardProps {
  members: LeagueMember[];
  compact?: boolean;
}

const SeasonLeaderboard = ({ members, compact = false }: SeasonLeaderboardProps) => {
  const sorted = [...members].sort((a, b) => b.cumulativePoints - a.cumulativePoints);

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-racing-amber';
    if (index === 1) return 'text-muted-foreground';
    if (index === 2) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-2">
      {!compact && (
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Season Standings
        </h3>
      )}
      <div className="space-y-1">
        {sorted.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              index === 0 && 'bg-racing-amber/10 border border-racing-amber/20',
              index > 0 && 'hover:bg-secondary'
            )}
          >
            <span className={cn('text-lg font-bold w-6 text-center font-mono', getMedalColor(index))}>
              {index + 1}
            </span>

            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold uppercase border border-border">
              {member.user.displayName.slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{member.user.displayName}</p>
              {!compact && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {member.totalCorrectPredictions}
                  </span>
                  <span className="flex items-center gap-1">
                    <Grid3X3 className="w-3 h-3" />
                    {member.totalBingos} bingo{member.totalBingos !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm font-bold font-mono text-primary">
                {member.cumulativePoints}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">pts</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SeasonLeaderboard;
