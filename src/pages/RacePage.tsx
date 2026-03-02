import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Radio, Clock, Lock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockRaces, mockLeagues, mockMembers, currentUser } from '@/data/mockData';
import BingoBoard from '@/components/BingoBoard';
import ClaimsFeed from '@/components/ClaimsFeed';
import SeasonLeaderboard from '@/components/SeasonLeaderboard';
import { toast } from 'sonner';
import { Prediction, Claim } from '@/types';

const createEmptyPredictions = (): Prediction[] =>
  Array.from({ length: 25 }, (_, i) => ({
    id: `pred-${i}`,
    boardId: 'new-board',
    text: i === 12 ? 'FREE SPACE' : '',
    positionIndex: i,
    marked: i === 12,
    confirmedAt: i === 12 ? new Date().toISOString() : undefined,
  }));

const RacePage = () => {
  const { leagueId, raceId } = useParams();
  const navigate = useNavigate();

  const league = mockLeagues.find((l) => l.id === leagueId) || mockLeagues[0];
  const race = mockRaces.find((r) => r.id === raceId) || mockRaces[2];
  const members = mockMembers.filter((m) => m.leagueId === league.id);

  const [predictions, setPredictions] = useState<Prediction[]>(createEmptyPredictions());
  const [boardLocked, setBoardLocked] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);

  const filledCount = predictions.filter((p) => p.text.trim() !== '' && p.text !== 'FREE SPACE').length;
  const canLock = filledCount === 24;

  const handleCellEdit = (index: number, text: string) => {
    if (boardLocked) return;
    setPredictions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, text } : p))
    );
  };

  const handleLockBoard = () => {
    if (!canLock) {
      toast.error(`Fill all 24 predictions before locking (${filledCount}/24 filled)`);
      return;
    }
    const texts = predictions.filter(p => p.text !== 'FREE SPACE').map(p => p.text.trim().toLowerCase());
    const dupes = texts.filter((t, i) => texts.indexOf(t) !== i);
    if (dupes.length > 0) {
      toast.error(`Remove duplicate predictions: "${dupes[0]}"`);
      return;
    }
    setBoardLocked(true);
    toast.success('Board locked! Good luck 🏁');
  };

  const handleCellClick = (prediction: Prediction) => {
    if (!boardLocked) return;
    if (prediction.text === 'FREE SPACE') return;
    if (prediction.confirmedAt) {
      toast.info('This prediction is already confirmed');
      return;
    }
    if (prediction.marked) {
      toast.info('Claim already pending for this prediction');
      return;
    }
    if (!prediction.text.trim()) return;

    // Mark as pending on the board
    setPredictions((prev) =>
      prev.map((p) => (p.id === prediction.id ? { ...p, marked: true } : p))
    );

    // Add to claims feed
    const newClaim: Claim = {
      id: `claim-${Date.now()}`,
      predictionId: prediction.id,
      predictionText: prediction.text,
      claimedBy: currentUser,
      status: 'pending',
      approvalsCount: 0,
      rejectsCount: 0,
      totalVotes: 0,
      createdAt: new Date().toISOString(),
    };
    setClaims((prev) => [newClaim, ...prev]);
    toast.success(`Claim submitted: "${prediction.text}"`);
  };

  const handleVote = (claimId: string, approve: boolean) => {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim;

        const newApprovals = claim.approvalsCount + (approve ? 1 : 0);
        const newRejects = claim.rejectsCount + (approve ? 0 : 1);
        const newTotal = claim.totalVotes + 1;
        const approvalRate = newApprovals / newTotal;

        // Auto-resolve: approved at ≥60% with at least 3 votes, or rejected
        let newStatus = claim.status;
        if (newTotal >= 3 && approvalRate >= 0.6) {
          newStatus = 'approved';
        } else if (newTotal >= 3 && approvalRate < 0.4) {
          newStatus = 'rejected';
        }

        // If approved, also confirm the prediction on the board
        if (newStatus === 'approved' && claim.status !== 'approved') {
          setPredictions((preds) =>
            preds.map((p) =>
              p.id === claim.predictionId
                ? { ...p, confirmedAt: new Date().toISOString() }
                : p
            )
          );
          toast.success(`"${claim.predictionText}" confirmed! ✓`);
        } else if (newStatus === 'rejected' && claim.status !== 'rejected') {
          // Un-mark on rejection
          setPredictions((preds) =>
            preds.map((p) =>
              p.id === claim.predictionId ? { ...p, marked: false } : p
            )
          );
          toast.error(`"${claim.predictionText}" rejected`);
        }

        return {
          ...claim,
          approvalsCount: newApprovals,
          rejectsCount: newRejects,
          totalVotes: newTotal,
          status: newStatus,
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block space-y-4"
          >
            <SeasonLeaderboard members={members} compact />
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {boardLocked ? 'Your Board' : 'Build Your Board'}
              </h2>

              {!boardLocked ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Pencil className="w-3 h-3" />
                    <span>Click each cell to type your prediction ({filledCount}/24)</span>
                  </div>
                  <div className="w-full max-w-[600px] mx-auto">
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(filledCount / 24) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            <BingoBoard
              predictions={predictions}
              onCellClick={handleCellClick}
              editable={!boardLocked}
              onCellEdit={handleCellEdit}
            />

            {!boardLocked && (
              <div className="flex justify-center">
                <Button
                  onClick={handleLockBoard}
                  disabled={!canLock}
                  className="gap-2"
                  size="lg"
                >
                  <Lock className="w-4 h-4" />
                  Lock Board ({filledCount}/24)
                </Button>
              </div>
            )}
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {boardLocked && <ClaimsFeed claims={claims} onVote={handleVote} />}
            {!boardLocked && (
              <div className="rounded-lg border border-border p-4 text-center space-y-2">
                <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-semibold">Claims Locked</p>
                <p className="text-xs text-muted-foreground">
                  Fill in and lock your board to participate in claims and voting
                </p>
              </div>
            )}
          </motion.aside>
        </div>

        <div className="lg:hidden mt-6">
          <SeasonLeaderboard members={members} />
        </div>
      </main>
    </div>
  );
};

export default RacePage;
