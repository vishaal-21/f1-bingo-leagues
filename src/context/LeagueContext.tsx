import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { League } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface LeagueContextType {
  leagues: League[];
  loading: boolean;
  createLeague: (name: string, scoringMode: 'classic' | 'points') => Promise<void>;
  joinLeague: (inviteCode: string) => Promise<boolean>;
  refreshLeagues: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeagues = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error('useLeagues must be used within LeagueProvider');
  return ctx;
};

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshLeagues = useCallback(async () => {
    console.log('[LeagueContext] refreshLeagues called, user:', user?.id || 'none');
    
    if (!user) {
      setLeagues([]);
      setLoading(false);
      return;
    }

    // Safety timeout
    const timeoutId = setTimeout(() => {
      console.warn('[LeagueContext] Loading timeout after 10 seconds - stopping loading state');
      setLoading(false);
      toast.error('Loading leagues timed out. Please refresh the page.');
    }, 10000);

    try {
      console.log('[LeagueContext] Fetching league memberships...');
      // Get leagues where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('[LeagueContext] Error fetching memberships:', memberError);
        throw memberError;
      }

      console.log('[LeagueContext] Found memberships:', memberData?.length || 0);

      if (!memberData || memberData.length === 0) {
        setLeagues([]);
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      const leagueIds = memberData.map(m => m.league_id);
      console.log('[LeagueContext] Fetching league details for:', leagueIds.length, 'leagues');

      // Get league details
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .in('id', leagueIds);

      if (leagueError) {
        console.error('[LeagueContext] Error fetching leagues:', leagueError);
        throw leagueError;
      }

      console.log('[LeagueContext] Fetching member counts...');
      // Get member counts for each league
      const { data: memberCounts, error: countError } = await supabase
        .from('league_members')
        .select('league_id')
        .in('league_id', leagueIds);

      if (countError) {
        console.error('[LeagueContext] Error fetching member counts:', countError);
        throw countError;
      }

      const countMap = memberCounts.reduce((acc, m) => {
        acc[m.league_id] = (acc[m.league_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const formattedLeagues: League[] = (leagueData || []).map(league => ({
        id: league.id,
        name: league.name,
        seasonYear: league.season_year,
        inviteCode: league.invite_code,
        scoringMode: league.scoring_mode as 'classic' | 'points',
        createdBy: league.created_by,
        memberCount: countMap[league.id] || 0,
        createdAt: league.created_at,
      }));

      console.log('[LeagueContext] Leagues loaded successfully:', formattedLeagues.length);
      setLeagues(formattedLeagues);
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[LeagueContext] Error fetching leagues:', error);
      toast.error('Failed to load leagues');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshLeagues();
  }, [refreshLeagues]);

  const createLeague = async (name: string, scoringMode: 'classic' | 'points') => {
    if (!user) {
      toast.error('You must be logged in to create a league');
      return;
    }

    try {
      const code = `${name.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      
      // Create league
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .insert({
          name,
          season_year: 2026,
          invite_code: code,
          scoring_mode: scoringMode,
          created_by: user.id,
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast.success(`League "${name}" created! Invite code: ${code}`);
      await refreshLeagues();
    } catch (error: any) {
      console.error('Error creating league:', error);
      toast.error(error.message || 'Failed to create league');
    }
  };

  const joinLeague = async (inviteCode: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to join a league');
      return false;
    }

    try {
      // Find league by invite code
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (leagueError || !leagueData) {
        toast.error('Invalid invite code. Please check and try again.');
        return false;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('league_members')
        .select('id')
        .eq('league_id', leagueData.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.info('You are already a member of this league');
        return true;
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast.success(`Joined "${leagueData.name}"!`);
      await refreshLeagues();
      return true;
    } catch (error: any) {
      console.error('Error joining league:', error);
      toast.error(error.message || 'Failed to join league');
      return false;
    }
  };

  return (
    <LeagueContext.Provider value={{ leagues, loading, createLeague, joinLeague, refreshLeagues }}>
      {children}
    </LeagueContext.Provider>
  );
};
