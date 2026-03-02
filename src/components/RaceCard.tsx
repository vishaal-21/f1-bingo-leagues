import { Race } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Radio, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface RaceCardProps {
  race: Race;
}

const statusConfig = {
  upcoming: { label: 'Upcoming', icon: Calendar, color: 'text-muted-foreground', bg: 'bg-secondary' },
  locked: { label: 'Locked', icon: Clock, color: 'text-racing-amber', bg: 'bg-racing-amber/10' },
  live: { label: 'LIVE', icon: Radio, color: 'text-racing-red', bg: 'bg-racing-red/10' },
  finished: { label: 'Finished', icon: CheckCircle2, color: 'text-racing-green', bg: 'bg-racing-green/10' },
};

const RaceCard = ({ race }: RaceCardProps) => {
  const navigate = useNavigate();
  const config = statusConfig[race.status];
  const StatusIcon = config.icon;
  const raceDate = new Date(race.scheduledStartTime);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/league/${race.leagueId}/race/${race.id}`)}
      className={cn(
        'rounded-lg border p-4 cursor-pointer transition-colors hover:border-primary/30',
        race.status === 'live' && 'border-racing-red/30 glow-red'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{race.flagEmoji}</span>
            <h4 className="font-bold text-sm">{race.name}</h4>
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
