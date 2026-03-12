import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Flag, Settings, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRaces } from '@/context/RaceContext';
import { useLeagues } from '@/context/LeagueContext';
import { supabase } from '@/lib/supabase';
import RaceCard from '@/components/RaceCard';
import SeasonLeaderboard from '@/components/SeasonLeaderboard';
import ProfileMenu from '@/components/ProfileMenu';
import { toast } from 'sonner';
import { LeagueMember } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Race } from '@/types';

const LeaguePage = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { leagues, loading: leaguesLoading } = useLeagues();
  const { races } = useRaces();
  const { user } = useAuth();
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  
  const league = leagues.find((l) => l.id === leagueId);
  const fromTab = searchParams.get('from'); // Check if we came from a specific tab

  // Fetch all races for dropdown (not just filtered ones from context)
  useEffect(() => {
    async function fetchAllRaces() {
      try {
        const { data, error } = await supabase
          .from('global_races')
          .select('*')
          .order('scheduled_start_time');

        if (error) throw error;

        const formattedRaces: Race[] = (data || []).map(r => {
          const finishTime = r.finish_time 
            ? new Date(r.finish_time)
            : new Date(new Date(r.scheduled_start_time).getTime() + 4 * 60 * 60 * 1000);

          return {
            id: r.id,
            name: r.name,
            scheduledStartTime: r.scheduled_start_time,
            lockTime: r.lock_time,
            finishTime: finishTime.toISOString(),
            status: r.status || 'upcoming',
            country: r.country,
            flagEmoji: r.flag_emoji,
            isSprintWeekend: r.is_sprint_weekend || false,
            leagueId: '',
          };
        });

        setAllRaces(formattedRaces);
      } catch (error) {
        console.error('Error fetching all races:', error);
      }
    }

    fetchAllRaces();
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      if (!leagueId) return;

      setMembersLoading(true);
      try {
        console.log('[LeaguePage] Fetching members for league:', leagueId);
        const { data, error } = await supabase
          .from('league_members')
          .select(`
            id,
            cumulative_points,
            total_correct_predictions,
            total_bingos,
            joined_at,
            user_id,
            league_id,
            profiles:user_id (
              username,
              display_name
            )
          `)
          .eq('league_id', leagueId)
          .order('cumulative_points', { ascending: false });

        if (error) throw error;

        console.log('[LeaguePage] Raw members data:', data);

        const formattedMembers: LeagueMember[] = (data || []).map(member => ({
          id: member.id,
          leagueId: member.league_id,
          userId: member.user_id,
          user: {
            id: member.user_id,
            email: '',
            displayName: member.profiles?.display_name || member.profiles?.username || 'Unknown',
          },
          cumulativePoints: member.cumulative_points || 0,
          totalCorrectPredictions: member.total_correct_predictions || 0,
          totalBingos: member.total_bingos || 0,
          joinedAt: member.joined_at,
        }));

        console.log('[LeaguePage] Formatted members:', formattedMembers);
        setMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load league members');
      } finally {
        setMembersLoading(false);
      }
    }

    fetchMembers();
  }, [leagueId]);

  if (leaguesLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading league...</p>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flag className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-lg font-bold">League not found</h2>
            <p className="text-sm text-muted-foreground">This league doesn't exist or you're not a member.</p>
          </div>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Add leagueId to races for navigation
  const racesWithLeague = races.map(r => ({ ...r, leagueId: leagueId || '' }));
  
  const liveRace = racesWithLeague.find((r) => r.status === 'live');
  const upcomingRace = racesWithLeague.find((r) => r.status === 'upcoming'); // Race week
  
  // Current race is either live or race week
  const currentRace = liveRace || upcomingRace;
  
  // Find ALL future races (upcoming or locked, not live, not finished)
  const futureRaces = racesWithLeague.filter((r) => 
    (r.status === 'upcoming' || r.status === 'locked') && r.id !== currentRace?.id
  );
  
  // Next race is the first future race after the current one
  const nextRace = futureRaces.length > 0 ? futureRaces[0] : null;

  console.log('[LeaguePage] Current race:', currentRace?.name, '(status:', currentRace?.status, ') | Next race:', nextRace?.name, '(status:', nextRace?.status, ')');

  const copyInviteCode = () => {
    navigator.clipboard.writeText(league.inviteCode);
    toast.success('Invite code copied!');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(fromTab === 'leagues' ? '/home?tab=leagues' : '/home')} className="gap-1 px-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight truncate">{league.name}</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  Season {league.seasonYear} · {league.scoringMode === 'points' ? 'Points' : 'Classic'} · {league.memberCount} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={copyInviteCode} className="gap-1.5 font-mono text-xs px-3 min-w-[80px]">
                <Copy className="w-3 h-3" />
                <span className="hidden md:inline">{league.inviteCode}</span>
                <span className="md:hidden">{league.inviteCode.slice(0, 6)}</span>
              </Button>
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="races" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="races">Races</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="races" className="space-y-6">
            {currentRace && (
              <div className="space-y-2">
                {currentRace.status === 'live' ? (
                  <h3 className="text-sm font-bold uppercase tracking-wider text-racing-red flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-racing-red animate-pulse" />
                    Live Now
                  </h3>
                ) : (
                  <h3 className="text-sm font-bold uppercase tracking-wider text-racing-green">
                    Current Race – Board Open
                  </h3>
                )}
                <RaceCard race={currentRace} />
              </div>
            )}

            {nextRace && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {nextRace.status === 'upcoming' ? 'Upcoming – Opens This Week' : 'Upcoming – Opens Race Week'}
                </h3>
                <RaceCard race={nextRace} />
              </div>
            )}

            {!currentRace && !nextRace && (
              <div className="text-center py-12 px-4">
                <Flag className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No races available at the moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <SeasonLeaderboard 
              members={members} 
              currentUserId={user?.id} 
              races={allRaces}
              leagueId={leagueId}
            />
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-2">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    member.userId === user?.id ? "bg-highlight-cyan border-2 border-highlight-cyan text-background font-semibold" : "border-border"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{member.user.displayName}</p>
                      {member.userId === league.createdBy && (
                        <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                          <Crown className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LeaguePage;
