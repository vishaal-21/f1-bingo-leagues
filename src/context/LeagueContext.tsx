import { createContext, useContext, useState, ReactNode } from 'react';
import { League } from '@/types';
import { mockLeagues as initialLeagues } from '@/data/mockData';
import { toast } from 'sonner';

interface LeagueContextType {
  leagues: League[];
  createLeague: (name: string, scoringMode: 'classic' | 'points') => void;
  joinLeague: (inviteCode: string) => boolean;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeagues = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error('useLeagues must be used within LeagueProvider');
  return ctx;
};

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [leagues, setLeagues] = useState<League[]>(initialLeagues);

  const createLeague = (name: string, scoringMode: 'classic' | 'points') => {
    const code = `${name.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const newLeague: League = {
      id: `league-${Date.now()}`,
      name,
      seasonYear: 2026,
      inviteCode: code,
      scoringMode,
      createdBy: 'user-1',
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    setLeagues((prev) => [...prev, newLeague]);
    toast.success(`League "${name}" created! Invite code: ${code}`);
  };

  const joinLeague = (inviteCode: string): boolean => {
    const league = leagues.find((l) => l.inviteCode === inviteCode.trim());
    if (!league) {
      toast.error('Invalid invite code. Please check and try again.');
      return false;
    }
    toast.success(`Joined "${league.name}"!`);
    return true;
  };

  return (
    <LeagueContext.Provider value={{ leagues, createLeague, joinLeague }}>
      {children}
    </LeagueContext.Provider>
  );
};
