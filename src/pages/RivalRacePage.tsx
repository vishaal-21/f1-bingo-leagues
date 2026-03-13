import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRivalry } from '@/context/RivalryContext';
import { useRaces } from '@/context/RaceContext';
import { supabase } from '@/lib/supabase';
import { Rivalry, Board, Prediction, RivalApproval } from '@/types';
import { ArrowLeft, Check, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountryFlag } from '@/components/CountryFlag';
import { toast } from 'sonner';
import BingoBoard from '@/components/BingoBoard';
import ProfileMenu from '@/components/ProfileMenu';

const RivalRacePage = () => {
  const { rivalryId, raceId } = useParams<{ rivalryId: string; raceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rivalries } = useRivalry();
  const { races } = useRaces();

  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [myBoard, setMyBoard] = useState<Board | null>(null);
  const [rivalBoard, setRivalBoard] = useState<Board | null>(null);
  const [myApprovals, setMyApprovals] = useState<RivalApproval[]>([]);
  const [rivalApprovals, setRivalApprovals] = useState<RivalApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-board' | 'rival-board'>('my-board');

  const race = races.find((r) => r.id === raceId);
  const rivalUser = rivalry?.rivalUser;

  useEffect(() => {
    if (!user || !rivalryId || !raceId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Find rivalry
        const currentRivalry = rivalries.find((r) => r.id === rivalryId);
        if (!currentRivalry) {
          toast.error('Rivalry not found');
          navigate('/home?tab=rivals');
          return;
        }
        setRivalry(currentRivalry);

        const rivalUserId = currentRivalry.rivalUser?.id;

        // Fetch both boards
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select(`
            id,
            race_id,
            user_id,
            locked,
            predictions:predictions(*)
          `)
          .eq('race_id', raceId)
          .in('user_id', [user.id, rivalUserId]);

        if (boardsError) throw boardsError;

        const myBoardData = boardsData?.find((b) => b.user_id === user.id);
        const rivalBoardData = boardsData?.find((b) => b.user_id === rivalUserId);

        if (myBoardData) {
          setMyBoard({
            id: myBoardData.id,
            raceId: myBoardData.race_id,
            userId: myBoardData.user_id,
            locked: myBoardData.locked,
            predictions: myBoardData.predictions || [],
          });
        }

        if (rivalBoardData) {
          setRivalBoard({
            id: rivalBoardData.id,
            raceId: rivalBoardData.race_id,
            userId: rivalBoardData.user_id,
            locked: rivalBoardData.locked,
            predictions: rivalBoardData.predictions || [],
          });
        }

        // Fetch approvals
        const { data: approvalsData, error: approvalsError } = await supabase
          .from('rival_approvals')
          .select('*')
          .eq('rivalry_id', rivalryId)
          .eq('race_id', raceId);

        if (approvalsError) throw approvalsError;

        // Transform snake_case to camelCase and separate approvals by who made them
        const transformedApprovals: RivalApproval[] = (approvalsData || []).map((a) => ({
          id: a.id,
          rivalryId: a.rivalry_id,
          raceId: a.race_id,
          predictionId: a.prediction_id,
          approvedBy: a.approved_by,
          approved: a.approved,
          notes: a.notes,
          createdAt: a.created_at,
        }));

        const myApprovalsData = transformedApprovals.filter((a) => a.approvedBy === user.id);
        const rivalApprovalsData = transformedApprovals.filter((a) => a.approvedBy === rivalUserId);

        setMyApprovals(myApprovalsData);
        setRivalApprovals(rivalApprovalsData);
      } catch (error: any) {
        console.error('[RivalRacePage] Error fetching data:', error);
        toast.error(error.message || 'Failed to load rivalry data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, rivalryId, raceId, rivalries, navigate]);

  const handleApproval = async (predictionId: string, approved: boolean) => {
    if (!user || !rivalryId || !raceId) return;

    try {
      // Check if already approved
      const existingApproval = myApprovals.find((a) => a.predictionId === predictionId);
      if (existingApproval) {
        // Update existing approval
        const { error } = await supabase
          .from('rival_approvals')
          .update({ approved })
          .eq('id', existingApproval.id);

        if (error) throw error;

        // Update local state
        setMyApprovals(
          myApprovals.map((a) => (a.predictionId === predictionId ? { ...a, approved } : a))
        );
      } else {
        // Create new approval
        const { data, error } = await supabase
          .from('rival_approvals')
          .insert({
            rivalry_id: rivalryId,
            race_id: raceId,
            prediction_id: predictionId,
            approved_by: user.id,
            approved,
          })
          .select()
          .single();

        if (error) throw error;

        setMyApprovals([...myApprovals, data]);
      }

      toast.success(approved ? 'Marked as correct' : 'Marked as incorrect');
    } catch (error: any) {
      console.error('[RivalRacePage] Error saving approval:', error);
      toast.error(error.message || 'Failed to save approval');
    }
  };

  const getApprovalStatus = (predictionId: string) => {
    const approval = myApprovals.find((a) => a.predictionId === predictionId);
    return approval ? approval.approved : null;
  };

  const getRivalApprovalStatus = (predictionId: string) => {
    const approval = rivalApprovals.find((a) => a.predictionId === predictionId);
    return approval ? approval.approved : null;
  };

  const calculateScore = (board: Board | null, approvals: RivalApproval[]) => {
    if (!board) return { correct: 0, total: 0, points: 0 };

    const correctCount = approvals.filter((a) => a.approved).length;
    return {
      correct: correctCount,
      total: board.predictions.length,
      points: correctCount * 10, // Simple scoring for now
    };
  };

  const myScore = calculateScore(myBoard, rivalApprovals);
  const rivalScore = calculateScore(rivalBoard, myApprovals);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading rivalry...</p>
        </div>
      </div>
    );
  }

  if (!race || !rivalry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Rivalry or race not found</p>
      </div>
    );
  }

  const canApprove = race.status === 'finished' || race.status === 'live';

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

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CountryFlag country={race.country} className="w-8 h-6" />
                <div>
                  <h1 className="text-xl font-extrabold">{race.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    {new Date(race.scheduledStartTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ProfileMenu />
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">You</p>
                <p className="text-2xl font-extrabold">{myScore.points}</p>
                <p className="text-[10px] text-muted-foreground">
                  {myScore.correct}/{myScore.total} correct
                </p>
              </div>
              <div className="px-4">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">{rivalUser?.displayName}</p>
                <p className="text-2xl font-extrabold">{rivalScore.points}</p>
                <p className="text-[10px] text-muted-foreground">
                  {rivalScore.correct}/{rivalScore.total} correct
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="my-board" className="flex-1">
              My Board
            </TabsTrigger>
            <TabsTrigger value="rival-board" className="flex-1">
              {rivalUser?.displayName}'s Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-board" className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {rivalApprovals.length > 0
                  ? `${rivalUser?.displayName} has marked ${rivalApprovals.filter((a) => a.approved).length} predictions as correct`
                  : `Waiting for ${rivalUser?.displayName} to approve your predictions`}
              </p>
            </div>
            {myBoard ? (
              <BingoBoard
                predictions={myBoard.predictions.map((p) => ({
                  ...p,
                  marked: getRivalApprovalStatus(p.id) === true,
                }))}
                onCellClick={() => {}}
              />
            ) : (
              <p className="text-center text-muted-foreground py-12">You haven't created a board for this race</p>
            )}
          </TabsContent>

          <TabsContent value="rival-board" className="space-y-4">
            {!canApprove && (
              <div className="p-4 rounded-lg bg-racing-yellow/10 border border-racing-yellow/30 text-center">
                <p className="text-sm text-racing-yellow">
                  You can approve predictions once the race is live or finished
                </p>
              </div>
            )}

            {rivalBoard ? (
              <div className="space-y-4">
                <BingoBoard
                  predictions={rivalBoard.predictions.map((p) => ({
                    ...p,
                    marked: getApprovalStatus(p.id) === true,
                  }))}
                  onCellClick={() => {}}
                />

                {canApprove && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">Approve Predictions</h3>
                    <div className="grid gap-2">
                      {rivalBoard.predictions
                        .filter((p) => p.positionIndex !== 12) // Skip center FREE SPACE
                        .map((prediction) => {
                          const status = getApprovalStatus(prediction.id);
                          return (
                            <div
                              key={prediction.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                            >
                              <p className="text-sm flex-1">{prediction.text}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={status === true ? 'default' : 'outline'}
                                  onClick={() => handleApproval(prediction.id, true)}
                                  className="gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Correct
                                </Button>
                                <Button
                                  size="sm"
                                  variant={status === false ? 'destructive' : 'outline'}
                                  onClick={() => handleApproval(prediction.id, false)}
                                  className="gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Wrong
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                {rivalUser?.displayName} hasn't created a board for this race
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RivalRacePage;
