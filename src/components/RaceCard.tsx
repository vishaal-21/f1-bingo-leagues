import { Race } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Radio, CheckCircle2, Calendar, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CountryFlag } from './CountryFlag';

interface RaceCardProps {
  race: Race;
}

const statusConfig = {
  upcoming: { label: 'Race Week', icon: Calendar, color: 'text-racing-green', bg: 'bg-racing-green/10' },
  locked: { label: 'Not Yet Open', icon: Lock, color: 'text-muted-foreground', bg: 'bg-secondary' },
  live: { label: 'LIVE', icon: Radio, color: 'text-racing-red', bg: 'bg-racing-red/10' },
  finished: { label: 'Finished', icon: CheckCircle2, color: 'text-racing-green', bg: 'bg-racing-green/10' },
};

const RaceCard = ({ race }: RaceCardProps) => {
  const navigate = useNavigate();
  const config = statusConfig[race.status];
  const StatusIcon = config.icon;
  const raceDate = new Date(race.scheduledStartTime);
  const isDisabled = race.status === 'locked';

  const handleClick = () => {
    if (isDisabled) return;
    // Navigate to standalone mode if no leagueId, otherwise league-specific
    if (race.leagueId) {
      navigate(`/league/${race.leagueId}/race/${race.id}`);
    } else {
      navigate(`/race/${race.id}`);
    }
  };

  return (
    <motion.div
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isDisabled
          ? 'opacity-50 cursor-not-allowed border-border'
          : 'cursor-pointer hover:border-primary/30',
        race.status === 'live' && 'border-racing-red/30 glow-red'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CountryFlag country={race.country} className="w-6 h-4 rounded-sm object-cover" />
            <h4 className="font-bold text-sm">{race.name}</h4>
            {race.isSprintWeekend && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-racing-yellow/20 text-racing-yellow border border-racing-yellow/30">
                SPRINT
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {raceDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {raceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full', config.bg, config.color)}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>
    </motion.div>
  );
};

export default RaceCard;
