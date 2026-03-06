import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Race } from '@/types';
import { supabase } from '@/lib/supabase';
import { getCurrentTime } from '@/lib/devTime';

interface RaceContextType {
  races: Race[];
  loading: boolean;
  refreshRaces: () => Promise<void>;
}

const RaceContext = createContext<RaceContextType | null>(null);

export const useRaces = () => {
  const ctx = useContext(RaceContext);
  if (!ctx) throw new Error('useRaces must be used within RaceProvider');
  return ctx;
};

export const RaceProvider = ({ children }: { children: ReactNode }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('global_races')
        .select('*')
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;

      if (data) {
        const now = getCurrentTime();
        console.log('[RaceContext] Current date:', now.toISOString());
        
        const formattedRaces: Race[] = data.map(r => {
          const scheduledStart = new Date(r.scheduled_start_time);
          const lockTime = new Date(r.lock_time);
          
          // Calculate finish_time if not in DB yet (for backward compatibility)
          const finishTime = r.finish_time 
            ? new Date(r.finish_time)
            : new Date(scheduledStart.getTime() + 4 * 60 * 60 * 1000); // 4 hours after start
          
          const raceWeekStart = new Date(scheduledStart);
          raceWeekStart.setDate(raceWeekStart.getDate() - 6); // Monday of race week
          
          // Auto-calculate status based on time
          let status: Race['status'];
          
          if (now >= finishTime) {
            // Race finished (4 hours after race start) - always respect finish time
            status = 'finished';
          } else if (now >= lockTime) {
            // Qualifying started - boards are locked, race is live
            status = 'live';
          } else if (now >= raceWeekStart) {
            // Race week - can fill board until qualifying starts
            status = 'upcoming';
          } else {
            // Too early - disabled/locked
            status = 'locked';
          }
          
          // Admin can manually mark race as finished early (but can't keep it live past finish_time)
          // Only override if DB says 'finished' and calculated status is not 'finished'
          if (r.status === 'finished' && status !== 'finished') {
            status = 'finished';
          }
          
          // Log first 3 races for debugging
          if (data.indexOf(r) < 3) {
            console.log(`[RaceContext] ${r.name}: calculated="${status}", locks at ${lockTime.toISOString()}, finishes at ${finishTime.toISOString()}`);
          }
          
          return {
            id: r.id,
            name: r.name,
            scheduledStartTime: r.scheduled_start_time,
            lockTime: r.lock_time,
            finishTime: finishTime.toISOString(), // Store as string
            status,
            country: r.country,
            flagEmoji: r.flag_emoji,
            isSprintWeekend: r.is_sprint_weekend || false,
            leagueId: '', // Global races don't belong to specific league
          };
        });
        
        setRaces(formattedRaces);
      }
    } catch (error) {
      console.error('[RaceContext] Error fetching races:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRaces();

    // Subscribe to race changes
    const channel = supabase
      .channel('global-races')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_races',
        },
        () => {
          console.log('[RaceContext] Race updated, refreshing...');
          refreshRaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <RaceContext.Provider value={{ races, loading, refreshRaces }}>
      {children}
    </RaceContext.Provider>
  );
};
