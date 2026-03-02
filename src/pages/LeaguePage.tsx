import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Flag, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { mockLeagues, mockRaces, mockMembers } from '@/data/mockData';
import RaceCard from '@/components/RaceCard';
import SeasonLeaderboard from '@/components/SeasonLeaderboard';
import { toast } from 'sonner';

const LeaguePage = () => {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const league = mockLeagues.find((l) => l.id === leagueId) || mockLeagues[0];
  const races = mockRaces.filter((r) => r.leagueId === league.id);
  const members = mockMembers.filter((m) => m.leagueId === league.id);

  const liveRace = races.find((r) => r.status === 'live');
  const upcomingRaces = races.filter((r) => r.status === 'upcoming' || r.status === 'locked');
  const pastRaces = races.filter((r) => r.status === 'finished');

  const copyInviteCode = () => {
    navigator.clipboard.writeText(league.inviteCode);
    toast.success('Invite code copied!');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 px-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Flag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">{league.name}</h1>
                <p className="text-xs text-muted-foreground">
                  Season {league.seasonYear} · {league.scoringMode === 'points' ? 'Points' : 'Classic'} Mode · {league.memberCount} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyInviteCode} className="gap-1 font-mono text-xs">
                <Copy className="w-3 h-3" />
                {league.inviteCode}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
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
            {liveRace && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-racing-red flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-racing-red animate-pulse" />
                  Live Now
                </h3>
                <RaceCard race={liveRace} />
              </div>
            )}

            {upcomingRaces.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
                <div className="space-y-2">
                  {upcomingRaces.map((race) => (
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
          </TabsContent>

          <TabsContent value="leaderboard">
            <SeasonLeaderboard members={members} />
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-2">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-border">
                    {member.user.displayName.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{member.user.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-bold font-mono text-primary">{member.cumulativePoints} pts</p>
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
