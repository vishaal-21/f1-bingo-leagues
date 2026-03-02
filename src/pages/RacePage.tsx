import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Radio, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockRaces, mockLeagues, mockBoard, mockClaims, mockMembers } from '@/data/mockData';
import BingoBoard from '@/components/BingoBoard';
import ClaimsFeed from '@/components/ClaimsFeed';
import SeasonLeaderboard from '@/components/SeasonLeaderboard';
import { toast } from 'sonner';
import { Prediction } from '@/types';

const RacePage = () => {
  const { leagueId, raceId } = useParams();
  const navigate = useNavigate();

  const league = mockLeagues.find((l) => l.id === leagueId) || mockLeagues[0];
  const race = mockRaces.find((r) => r.id === raceId) || mockRaces[2];
  const members = mockMembers.filter((m) => m.leagueId === league.id);

  const handleCellClick = (prediction: Prediction) => {
    if (prediction.confirmedAt) {
      toast.info('This prediction is already confirmed');
      return;
    }
    if (prediction.marked) {
      toast.info('Claim already pending for this prediction');
      return;
    }
    toast.success(`Claim submitted: "${prediction.text}"`);
  };

  const handleVote = (claimId: string, approve: boolean) => {
    toast.success(approve ? 'Vote: Approved ✓' : 'Vote: Rejected ✗');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/league/${leagueId}`)} className="gap-1 px-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{race.flagEmoji}</span>
                  <h1 className="text-lg font-extrabold">{race.name}</h1>
                </div>
                <p className="text-xs text-muted-foreground">{league.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {race.status === 'live' && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-racing-red bg-racing-red/10 px-3 py-1.5 rounded-full">
                  <Radio className="w-3 h-3 animate-pulse" />
                  LIVE
                </div>
              )}
              {race.status === 'upcoming' && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {new Date(race.lockTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
          {/* Left: Leaderboard */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block space-y-4"
          >
            <SeasonLeaderboard members={members} compact />
          </motion.aside>

          {/* Center: Bingo Board */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Board</h2>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-racing-green/40 border border-racing-green/60" />
                  Confirmed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-racing-amber/40 border border-racing-amber/60" />
                  Pending
                </span>
              </div>
            </div>
            <BingoBoard predictions={mockBoard.predictions} onCellClick={handleCellClick} />
          </motion.div>

          {/* Right: Claims Feed */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <ClaimsFeed claims={mockClaims} onVote={handleVote} />
          </motion.aside>
        </div>

        {/* Mobile Leaderboard */}
        <div className="lg:hidden mt-6">
          <SeasonLeaderboard members={members} />
        </div>
      </main>
    </div>
  );
};

export default RacePage;
