import { Race } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Radio, CheckCircle2, Calendar, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CountryFlag } from './CountryFlag';
import { useEffect, useState } from 'react';

interface RaceCardProps {
  race: Race;
  showCountdown?: boolean;
}

const statusConfig = {
  upcoming: { label: 'Race Week', icon: Calendar, color: 'text-racing-green', bg: 'bg-racing-green/10' },
  locked: { label: 'Not Yet Open', icon: Lock, color: 'text-muted-foreground', bg: 'bg-secondary' },
  live: { label: 'LIVE', icon: Radio, color: 'text-racing-red', bg: 'bg-racing-red/10' },
  finished: { label: 'Finished', icon: CheckCircle2, color: 'text-racing-green', bg: 'bg-racing-green/10' },
};

const RaceCard = ({ race, showCountdown = false }: RaceCardProps) => {
  const navigate = useNavigate();
  const config = statusConfig[race.status];
  const StatusIcon = config.icon;
  const raceDate = new Date(race.scheduledStartTime);
  const lockDate = new Date(race.lockTime);
  const isDisabled = race.status === 'locked';
  
  const [timeUntilLock, setTimeUntilLock] = useState<string>('');
  
  // Calculate countdown for races that are upcoming or live
  useEffect(() => {
    if (!showCountdown || (race.status !== 'upcoming' && race.status !== 'live')) {
      return;
    }
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = lockDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilLock('00:00:00:00');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Format: DD:HH:MM:SS with leading zeros
      const formattedTime = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeUntilLock(formattedTime);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [showCountdown, race.status, lockDate]);

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
        'rounded-lg border transition-colors',
        isDisabled
          ? 'opacity-50 cursor-not-allowed border-border'
          : 'cursor-pointer hover:border-primary/30',
        race.status === 'live' && 'border-racing-red/30 glow-red',
        showCountdown && timeUntilLock && (race.status === 'upcoming' || race.status === 'live') ? 'p-3' : 'p-4'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
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
        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap', config.bg, config.color)}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>
      
      {/* Big Countdown Timer */}
      {showCountdown && timeUntilLock && (race.status === 'upcoming' || race.status === 'live') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-border"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Predictions Lock In
            </p>
            <p className="text-[10px] text-muted-foreground">
              {lockDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 font-mono">
            {timeUntilLock.split(':').map((segment, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="flex items-baseline gap-0.5">
                  <span className={cn(
                    "font-extrabold tabular-nums",
                    race.status === 'live' ? "text-4xl text-racing-red" : "text-3xl text-racing-amber"
                  )}>
                    {segment}
                  </span>
                  {index < 3 && (
                    <span className="text-xl text-muted-foreground font-bold">:</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                  {index === 0 && 'Days'}
                  {index === 1 && 'Hours'}
                  {index === 2 && 'Mins'}
                  {index === 3 && 'Secs'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RaceCard;
