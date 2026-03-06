import { LeagueMember, Race } from '@/types';
import { motion } from 'framer-motion';
import { Trophy, Target, Grid3X3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SeasonLeaderboardProps {
  members: LeagueMember[];
  compact?: boolean;
  onViewBoard?: (member: LeagueMember) => void;
  showViewButton?: boolean;
  currentUserId?: string;
  races?: Race[];
  leagueId?: string;
}

const SeasonLeaderboard = ({ members, compact = false, onViewBoard, showViewButton = false, currentUserId, races = [], leagueId }: SeasonLeaderboardProps) => {
  const [selectedRace, setSelectedRace] = useState<string>('overall');
  const [racePoints, setRacePoints] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch race-specific points when race is selected
  useEffect(() => {
    if (selectedRace === 'overall') return;

    const fetchRacePoints = async () => {
      setLoading(true);
      try {
        const { data: boards } = await supabase
          .from('boards')
          .select('user_id, points')
          .eq('race_identifier', selectedRace);

        const pointsMap = new Map<string, number>();
        boards?.forEach(b => {
          pointsMap.set(b.user_id, b.points || 0);
        });
        setRacePoints(pointsMap);
      } catch (error) {
        console.error('Error fetching race points:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRacePoints();
  }, [selectedRace]);

  const sorted = [...members].sort((a, b) => {
    if (selectedRace === 'overall') {
      return b.cumulativePoints - a.cumulativePoints;
    } else {
      const aPoints = racePoints.get(a.userId) || 0;
      const bPoints = racePoints.get(b.userId) || 0;
      return bPoints - aPoints;
    }
  });

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-racing-amber text-background';
    if (index === 1) return 'bg-zinc-400 text-background';
    if (index === 2) return 'bg-orange-600 text-background';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {selectedRace === 'overall' ? 'Season Standings' : 'Race Results'}
          </h3>
          <Select value={selectedRace} onValueChange={setSelectedRace}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Standings</SelectItem>
              {races.map(race => (
                <SelectItem key={race.id} value={race.id}>
                  {race.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : (
          sorted.map((member, index) => {
            const displayPoints = selectedRace === 'overall' 
              ? member.cumulativePoints 
              : (racePoints.get(member.userId) || 0);

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  member.userId === currentUserId && 'bg-highlight-cyan border-2 border-highlight-cyan text-background font-semibold',
                  member.userId !== currentUserId && 'border border-border hover:bg-secondary'
                )}
              >
                <span className={cn('text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full font-mono', getRankStyle(index))}>
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{member.user.displayName}</p>
                  {!compact && selectedRace === 'overall' && (
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
                  <p className="text-sm font-bold font-mono">
                    {displayPoints}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">pts</p>
                </div>

                {showViewButton && onViewBoard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewBoard(member)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SeasonLeaderboard;
