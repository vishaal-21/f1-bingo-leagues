import { Flag, Users, Trophy, ChevronRight, Home, Info, Target } from 'lucide-react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeagues } from '@/context/LeagueContext';
import { useRaces } from '@/context/RaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import CreateLeagueDialog from '@/components/CreateLeagueDialog';
import JoinLeagueDialog from '@/components/JoinLeagueDialog';
import HowToPlayDialog from '@/components/HowToPlayDialog';
import RaceCard from '@/components/RaceCard';
import { CountryFlag } from '@/components/CountryFlag';
import ProfileMenu from '@/components/ProfileMenu';

interface BoardResult {
  raceId: string;
  raceName: string;
  raceCountry: string;
  leagueId: string;
  leagueName: string;
  points: number;
  accuracy: number;
  totalPredictions: number;
  completedAt: string;
  isDNP?: boolean; // Did Not Participate
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { leagues, loading } = useLeagues();
  const { races } = useRaces();
  const { user, isLoading } = useAuth();
  const [boardResults, setBoardResults] = useState<BoardResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const activeTab = searchParams.get('tab') || 'home';

  // Fetch user's board results for completed races (including DNP races)
  useEffect(() => {
    const fetchBoardResults = async () => {
      if (!user) return;

      try {
        setResultsLoading(true);
        
        // Get all finished races
        const finishedRaces = races.filter(r => r.status === 'finished');
        if (finishedRaces.length === 0) {
          setBoardResults([]);
          setResultsLoading(false);
          return;
        }

        // Fetch all boards for this user and finished races
        const { data: boards, error: boardsError } = await supabase
          .from('boards')
          .select(`
            id,
            race_identifier,
            points,
            locked
          `)
          .eq('user_id', user.id)
          .in('race_identifier', finishedRaces.map(r => r.id));

        if (boardsError) throw boardsError;

        // Create a map of race_id -> board for quick lookup
        const boardsByRace = new Map(boards?.map(b => [b.race_identifier, b]) || []);

        // Process ALL finished races (including DNP)
        const resultsData: BoardResult[] = [];
        
        for (const race of finishedRaces) {
          const board = boardsByRace.get(race.id);

          if (!board) {
            // User did not participate in this race
            resultsData.push({
              raceId: race.id,
              raceName: race.name,
              raceCountry: race.country,
              leagueId: '',
              leagueName: '',
              points: 0,
              accuracy: 0,
              totalPredictions: 0,
              completedAt: race.finishTime,
              isDNP: true, // Flag for Did Not Participate
            });
            continue;
          }

          // User participated - calculate their results
          const { data: predictions, error: predError } = await supabase
            .from('predictions')
            .select('id, confirmed_at, position_index, marked')
            .eq('board_id', board.id);

          if (predError) throw predError;

          // Get prediction IDs (excluding free space)
          const predictionIds = predictions?.filter(p => p.position_index !== 12).map(p => p.id) || [];
          
          // Fetch claims to check which are approved
          const { data: claims } = await supabase
            .from('claims')
            .select('prediction_id, status')
            .in('prediction_id', predictionIds);

          // Create map of prediction_id -> approved status
          const approvedPredictions = new Set(
            claims?.filter(c => c.status === 'approved').map(c => c.prediction_id) || []
          );

          // Count confirmed: either has confirmed_at OR has approved claim
          const confirmedCount = predictions?.filter(p => 
            p.position_index !== 12 && (p.confirmed_at || approvedPredictions.has(p.id))
          ).length || 0;
          
          const totalPredictions = 24; // Excluding free space
          const accuracyPercentage = totalPredictions > 0 ? (confirmedCount / totalPredictions) * 100 : 0;

          resultsData.push({
            raceId: board.race_identifier,
            raceName: race.name,
            raceCountry: race.country,
            leagueId: '',
            leagueName: '',
            points: board.points || 0,
            accuracy: accuracyPercentage,
            totalPredictions,
            completedAt: race.finishTime,
            isDNP: false,
          });
        }

        // Sort by race date (most recent first)
        resultsData.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        setBoardResults(resultsData);
      } catch (error) {
        console.error('Error fetching board results:', error);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchBoardResults();
  }, [user, races]);

  // Auto-finalize all finished races to update cumulative points
  useEffect(() => {
    if (!user || races.length === 0) return;

    const finalizeAllFinishedRaces = async () => {
      const finishedRaces = races.filter(r => r.status === 'finished');
      if (finishedRaces.length === 0) return;

      console.log('[Index] Auto-finalizing', finishedRaces.length, 'finished races...');

      try {
        // Get all boards for finished races
        const { data: allBoards } = await supabase
          .from('boards')
          .select('id, user_id, race_identifier, points, bingos_completed')
          .in('race_identifier', finishedRaces.map(r => r.id));

        if (!allBoards) return;

        // Get unique users
        const uniqueUsers = [...new Set(allBoards.map(b => b.user_id))];
        console.log('[Index] Updating cumulative for', uniqueUsers.length, 'users');

        for (const userId of uniqueUsers) {
          // Get user's leagues
          const { data: userLeagues } = await supabase
            .from('league_members')
            .select('league_id')
            .eq('user_id', userId);

          if (!userLeagues || userLeagues.length === 0) continue;

          // Get ALL user's boards (across all races)
          const { data: userBoards } = await supabase
            .from('boards')
            .select('id, points, bingos_completed')
            .eq('user_id', userId);

          if (!userBoards) continue;

          const cumulativePoints = userBoards.reduce((sum, b) => sum + (b.points || 0), 0);
          const totalBingos = userBoards.reduce((sum, b) => sum + (b.bingos_completed || 0), 0);

          //Get all predictions
          const boardIds = userBoards.map(b => b.id);
          const { data: allPredictions } = await supabase
            .from('predictions')
            .select('id, confirmed_at, position_index')
            .in('board_id', boardIds);

          // Get claims for approved predictions
          const predictionIds = allPredictions?.map(p => p.id) || [];
          const { data: claims } = await supabase
            .from('claims')
            .select('prediction_id, status')
            .in('prediction_id', predictionIds);

          const approvedPredictions = new Set(
            claims?.filter(c => c.status === 'approved').map(c => c.prediction_id) || []
          );

          const totalCorrectPredictions = allPredictions?.filter(p =>
            p.position_index !== 12 && (p.confirmed_at || approvedPredictions.has(p.id))
          ).length || 0;

          // Update ALL leagues this user is in
          for (const userLeague of userLeagues) {
            await supabase
              .from('league_members')
              .update({
                cumulative_points: cumulativePoints,
                total_correct_predictions: totalCorrectPredictions,
                total_bingos: totalBingos,
              })
              .eq('league_id', userLeague.league_id)
              .eq('user_id', userId);
          }
        }

        console.log('[Index] ✅ Cumulative points updated for all users');
      } catch (error) {
        console.error('[Index] Error auto-finalizing:', error);
      }
    };

    finalizeAllFinishedRaces();
  }, [user, races]);

  if (!isLoading && !user) {
    return <Navigate to="/" />;
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Filter races by status for Home tab (no leagueId for standalone mode)
  const liveRace = races.find((r) => r.status === 'live');
  const raceWeekRaces = races.filter((r) => r.status === 'upcoming');
  const lockedRaces = races.filter((r) => r.status === 'locked');
  const pastRaces = races.filter((r) => r.status === 'finished');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Flag className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">F1 CHAOS BINGO</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">League Edition</p>
            </div>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(value) => navigate(`/home?tab=${value}`)} className="space-y-6">
          <TabsList className="bg-secondary w-full justify-start">
            <TabsTrigger value="home" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="leagues" className="gap-2">
              <Flag className="w-4 h-4" />
              Leagues
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Trophy className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />
              Info
            </TabsTrigger>
          </TabsList>

          {/* HOME TAB - Races */}
          <TabsContent value="home" className="space-y-6">
            {leagues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">Join a league first</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  Create or join a league to start making predictions on races.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <CreateLeagueDialog />
                  <JoinLeagueDialog />
                </div>
              </motion.div>
            ) : (
              <>
                {liveRace && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-racing-red flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-racing-red animate-pulse" />
                      Live Now
                    </h3>
                    <RaceCard race={liveRace} />
                  </div>
                )}

                {raceWeekRaces.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-racing-green">Race Week – Board Open</h3>
                    <div className="space-y-2">
                      {raceWeekRaces.map((race) => (
                        <RaceCard key={race.id} race={race} />
                      ))}
                    </div>
                  </div>
                )}

                {lockedRaces.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upcoming (opens race week)</h3>
                    <div className="space-y-2">
                      {lockedRaces.map((race) => (
                        <RaceCard key={race.id} race={race} />
                      ))}
                    </div>
                  </div>
                )}

                {pastRaces.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Completed</h3>
                    <div className="space-y-2">
                      {pastRaces.map((race) => (
                        <RaceCard key={race.id} race={race} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* LEAGUES TAB - Placeholder */}
          <TabsContent value="leagues" className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                My <span className="text-gradient-race">Leagues</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Predict the chaos, claim the glory. Compete with friends across the F1 season.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <CreateLeagueDialog />
                <JoinLeagueDialog />
              </div>
            </motion.section>

            {leagues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">No leagues yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Create your first league or join an existing one with an invite code to get started.
                </p>
              </motion.div>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2">
                {leagues.map((league, index) => (
                  <motion.div
                    key={league.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/league/${league.id}?from=leagues`)}
                    className="group rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{league.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Season {league.seasonYear} · {league.scoringMode === 'points' ? 'Points' : 'Classic'} Mode
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {league.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {league.scoringMode === 'points' ? 'Points' : 'Classic'}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[10px] text-muted-foreground font-mono">
                        INVITE: {league.inviteCode}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </section>
            )}
          </TabsContent>

          {/* RESULTS TAB - Placeholder */}
          <TabsContent value="results" className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                My <span className="text-gradient-race">Results</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                View your performance across all completed races.
              </p>
            </motion.section>

            {resultsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading results...</p>
              </div>
            ) : boardResults.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">No results yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Complete your first race to see your results here.
                </p>
              </motion.div>
            ) : (
              <section className="space-y-3">
                {boardResults.map((result, index) => (
                  <motion.div
                    key={`${result.raceId}-${result.leagueId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !result.isDNP && navigate(`/race/${result.raceId}`)}
                    className={cn(
                      "group rounded-lg border border-border bg-card p-4 transition-all",
                      result.isDNP 
                        ? "opacity-60" 
                        : "cursor-pointer hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <CountryFlag country={result.raceCountry} className="w-12 h-8 rounded object-cover flex-shrink-0 mt-1" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-bold text-base truncate">{result.raceName}</h3>
                            <p className="text-xs text-muted-foreground">
                              {result.isDNP ? 'Did Not Participate' : 'All Leagues'}
                            </p>
                          </div>
                          {!result.isDNP && (
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-4 h-4 text-racing-amber" />
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">Points</span>
                            </div>
                            <p className="text-2xl font-bold font-mono">
                              {result.points} {result.isDNP && <span className="text-sm text-muted-foreground">(DNP)</span>}
                            </p>
                          </div>
                          
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-racing-green" />
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">Accuracy</span>
                            </div>
                            <p className="text-2xl font-bold font-mono">
                              {result.isDNP ? '—' : `${result.accuracy.toFixed(2)}%`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </section>
            )}
          </TabsContent>

          {/* INFO TAB - Placeholder */}
          <TabsContent value="info">
            <div className="text-center space-y-4">
              <HowToPlayDialog />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
