import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRivalry } from '@/context/RivalryContext';
import { useRaces } from '@/context/RaceContext';
import { Rivalry, Race as RaceType } from '@/types';
import { ArrowLeft, Swords, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import RaceCard from '@/components/RaceCard';
import ProfileMenu from '@/components/ProfileMenu';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface RivalStats {
  myWins: number;
  rivalWins: number;
  myPoints: number;
  rivalPoints: number;
}

const RivalryPage = () => {
  const { rivalryId } = useParams<{ rivalryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rivalries } = useRivalry();
  const { races: allRaces } = useRaces();

  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [activeTab, setActiveTab] = useState('races');
  const [stats, setStats] = useState<RivalStats>({ myWins: 0, rivalWins: 0, myPoints: 0, rivalPoints: 0 });
  const [raceResults, setRaceResults] = useState<Record<string, { myPoints: number; rivalPoints: number }>>({});

  useEffect(() => {
    if (!rivalryId || !user) return;

    const currentRivalry = rivalries.find((r) => r.id === rivalryId);
    if (!currentRivalry) {
      toast.error('Rivalry not found');
      navigate('/home?tab=rivals');
      return;
    }

    setRivalry(currentRivalry);
    
    // Fetch rivalry stats
    const fetchStats = async () => {
      const { data: results, error } = await supabase
        .from('rival_results')
        .select('user_id, race_id, points')
        .eq('rivalry_id', rivalryId);
      
      if (error) {
        console.error('Error fetching rival stats:', error);
        return;
      }
      
      if (!results || results.length === 0) {
        setStats({ myWins: 0, rivalWins: 0, myPoints: 0, rivalPoints: 0 });
        return;
      }
      
      // Group by race_id to determine winners
      const raceResults: Record<string, { myPoints: number; rivalPoints: number }> = {};
      let myTotalPoints = 0;
      let rivalTotalPoints = 0;
      
      results.forEach((result) => {
        if (!raceResults[result.race_id]) {
          raceResults[result.race_id] = { myPoints: 0, rivalPoints: 0 };
        }
        
        if (result.user_id === user.id) {
          raceResults[result.race_id].myPoints = result.points;
          myTotalPoints += result.points;
        } else {
          raceResults[result.race_id].rivalPoints = result.points;
          rivalTotalPoints += result.points;
        }
      });
      
      // Calculate wins
      let myWins = 0;
      let rivalWins = 0;
      
      Object.values(raceResults).forEach((race) => {
        if (race.myPoints > race.rivalPoints) {
          myWins++;
        } else if (race.rivalPoints > race.myPoints) {
          rivalWins++;
        }
        // Ties don't count as wins
      });
      
      setStats({
        myWins,
        rivalWins,
        myPoints: myTotalPoints,
        rivalPoints: rivalTotalPoints,
      });
    };
    
    fetchStats();
  }, [rivalryId, rivalries, user, navigate]);

  // Fetch detailed race results for standings tab
  useEffect(() => {
    if (!rivalryId || !user) return;
    
    const fetchRaceResults = async () => {
      const { data, error } = await supabase
        .from('rival_results')
        .select('race_id, user_id, points')
        .eq('rivalry_id', rivalryId);
      
      if (error || !data) return;
      
      const results: Record<string, { myPoints: number; rivalPoints: number }> = {};
      data.forEach((result) => {
        if (!results[result.race_id]) {
          results[result.race_id] = { myPoints: 0, rivalPoints: 0 };
        }
        if (result.user_id === user.id) {
          results[result.race_id].myPoints = result.points;
        } else {
          results[result.race_id].rivalPoints = result.points;
        }
      });
      
      setRaceResults(results);
    };
    
    fetchRaceResults();
  }, [rivalryId, user]);

  if (!rivalry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading rivalry...</p>
        </div>
      </div>
    );
  }

  const rivalUser = rivalry.rivalUser;

  // Add rivalryId to races for navigation
  const racesWithRivalry: RaceType[] = allRaces.map((race) => ({
    ...race,
    rivalryId: rivalry.id,
  }));

  const currentRace = racesWithRivalry.find((r) => r.status === 'upcoming' || r.status === 'live');
  const nextRace = racesWithRivalry.find((r) => r.status === 'locked');
  const finishedRaces = racesWithRivalry.filter((r) => r.status === 'finished').slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home?tab=rivals')}
              className="gap-1 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-racing-red/10 border border-racing-red/20 flex items-center justify-center flex-shrink-0">
                <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-racing-red" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight truncate flex items-center gap-2">
                  Rivalry vs {rivalUser?.displayName}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  Season 2026 · Active since {new Date(rivalry.acceptedAt || rivalry.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Head-to-Head Stats */}
      <div className="container max-w-5xl mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-racing-red/5 via-racing-amber/5 to-racing-green/5 border border-border"
        >
          {/* My Stats */}
          <div className="flex-1 text-center space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You</p>
            <div className="space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-extrabold text-racing-green">{stats.myWins}</span>
                <span className="text-sm text-muted-foreground">wins</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <Trophy className="w-4 h-4 text-racing-amber" />
                <span className="text-xl font-bold">{stats.myPoints}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-20 w-px bg-border" />
          
          {/* Rival Stats */}
          <div className="flex-1 text-center space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {rivalUser?.displayName}
            </p>
            <div className="space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-extrabold text-racing-red">{stats.rivalWins}</span>
                <span className="text-sm text-muted-foreground">wins</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <Trophy className="w-4 h-4 text-racing-amber" />
                <span className="text-xl font-bold">{stats.rivalPoints}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="races" className="flex-1 gap-2">
              <Trophy className="w-4 h-4" />
              Races
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex-1 gap-2">
              <Trophy className="w-4 h-4" />
              Season Standings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="races" className="space-y-6">
            {currentRace && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-racing-green">
                  Current Race – Board Open
                </h3>
                <div
                  onClick={() => navigate(`/rival/${rivalry.id}/race/${currentRace.id}`)}
                  className="cursor-pointer"
                >
                  <RaceCard race={currentRace} />
                </div>
              </div>
            )}

            {nextRace && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Upcoming – Opens Race Week
                </h3>
                <div
                  onClick={() => navigate(`/rival/${rivalry.id}/race/${nextRace.id}`)}
                  className="cursor-pointer"
                >
                  <RaceCard race={nextRace} />
                </div>
              </div>
            )}

            {finishedRaces.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Results
                </h3>
                <div className="space-y-2">
                  {finishedRaces.map((race) => (
                    <div
                      key={race.id}
                      onClick={() => navigate(`/rival/${rivalry.id}/race/${race.id}`)}
                      className="cursor-pointer"
                    >
                      <RaceCard race={race} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!currentRace && !nextRace && finishedRaces.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">No races yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Races will appear here once the season starts
                </p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="standings" className="space-y-6">
            {finishedRaces.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">No completed races yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Season standings will appear after you complete races
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Overall Summary */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-gradient-to-r from-racing-green/10 to-racing-red/10 border border-border"
                >
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Your Wins</p>
                    <p className="text-2xl font-extrabold text-racing-green">{stats.myWins}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Ties</p>
                    <p className="text-2xl font-extrabold text-racing-amber">
                      {finishedRaces.length - stats.myWins - stats.rivalWins}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rival Wins</p>
                    <p className="text-2xl font-extrabold text-racing-red">{stats.rivalWins}</p>
                  </div>
                </motion.div>

                {/* Race by Race Results */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Race Results
                  </h3>
                  {finishedRaces.map((race) => {
                    const result = raceResults[race.id] || { myPoints: 0, rivalPoints: 0 };
                    const myWon = result.myPoints > result.rivalPoints;
                    const rivalWon = result.rivalPoints > result.myPoints;
                    const tied = result.myPoints === result.rivalPoints;
                    
                    return (
                      <motion.div
                        key={race.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{race.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(race.scheduledStartTime).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={cn(
                                "text-lg font-bold",
                                myWon && "text-racing-green"
                              )}>
                                {result.myPoints}
                              </p>
                              <p className="text-[10px] text-muted-foreground">You</p>
                            </div>
                            
                            <div className="text-center px-3">
                              {myWon && <span className="text-xs font-bold text-racing-green">W</span>}
                              {rivalWon && <span className="text-xs font-bold text-racing-red">L</span>}
                              {tied && <span className="text-xs font-bold text-racing-amber">T</span>}
                            </div>
                            
                            <div className="text-left">
                              <p className={cn(
                                "text-lg font-bold",
                                rivalWon && "text-racing-red"
                              )}>
                                {result.rivalPoints}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                                {rivalUser?.displayName}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RivalryPage;
