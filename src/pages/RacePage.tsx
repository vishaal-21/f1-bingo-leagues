import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Radio, Clock, Lock, Pencil, Flag, Trophy, Zap, Eye, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRaces } from '@/context/RaceContext';
import { useLeagues } from '@/context/LeagueContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import BingoBoard from '@/components/BingoBoard';
import ClaimsFeed from '@/components/ClaimsFeed';
import SeasonLeaderboard from '@/components/SeasonLeaderboard';
import ProfileMenu from '@/components/ProfileMenu';
import { CountryFlag } from '@/components/CountryFlag';
import { toast } from 'sonner';
import { Prediction, Claim, LeagueMember, User } from '@/types';
import { analyzeBingoBoard, getHighlightedCells } from '@/lib/bingoUtils';

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
  const { leagueId: urlLeagueId, raceId } = useParams();
  const navigate = useNavigate();

  const { leagues, loading: leaguesLoading } = useLeagues();
  const { races } = useRaces();
  const { user } = useAuth();
  
  // If no leagueId in URL, use first available league (standalone mode)
  const isStandaloneMode = !urlLeagueId;
  const leagueId = urlLeagueId || (leagues.length > 0 ? leagues[0].id : null);
  
  const league = leagues.find((l) => l.id === leagueId);
  const race = races.find((r) => r.id === raceId);
  
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>(createEmptyPredictions());
  const [boardLocked, setBoardLocked] = useState(false);
  const [boardSaved, setBoardSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimsFilter, setClaimsFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [highlightedCells, setHighlightedCells] = useState<Set<number>>(new Set());
  
  // Track previous bingos to only highlight NEW completions
  const previousBingosRef = useRef<string>('[]');
  
  // For viewing other members' boards
  const [viewingMember, setViewingMember] = useState<LeagueMember | null>(null);
  const [viewingPredictions, setViewingPredictions] = useState<Prediction[]>([]);
  const [viewingBoardLocked, setViewingBoardLocked] = useState(false);
  const [viewingBoardId, setViewingBoardId] = useState<string | null>(null);

  // Fetch members function that can be reused
  const fetchMembers = useCallback(async () => {
    if (!leagueId || !raceId) return;

    try {
      console.log('[RacePage] Fetching members for league:', leagueId);
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

      console.log('[RacePage] Raw members data:', data);

      // Fetch boards for this race for all members
      const memberUserIds = (data || []).map(m => m.user_id);
      const { data: boardsData } = await supabase
        .from('boards')
        .select('user_id, points')
        .eq('race_identifier', raceId)
        .in('user_id', memberUserIds);

      // Create a map of userId -> race points
      const racePointsMap = new Map<string, number>();
      (boardsData || []).forEach(board => {
        racePointsMap.set(board.user_id, board.points || 0);
      });

      const formattedMembers: LeagueMember[] = (data || []).map(member => ({
        id: member.id,
        leagueId: member.league_id,
        userId: member.user_id,
        user: {
          id: member.user_id,
          email: '',
          displayName: member.profiles?.display_name || member.profiles?.username || 'Unknown',
        },
        cumulativePoints: racePointsMap.get(member.user_id) || 0, // Use race-specific points
        totalCorrectPredictions: member.total_correct_predictions || 0,
        totalBingos: member.total_bingos || 0,
        joinedAt: member.joined_at,
      }));

      console.log('[RacePage] Formatted members with race points:', formattedMembers);
      console.log('[RacePage] Current user ID:', user?.id);
      
      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [leagueId, raceId, user?.id]);

  // Load existing board if it exists
  useEffect(() => {
    async function loadBoard() {
      if (!user?.id || !raceId) {
        setBoardLoading(false);
        return;
      }
      
      if (!leagueId) {
        // No league available yet, wait
        return;
      }

      try {
        console.log('[RacePage] Loading board for race:', raceId, 'in league:', leagueId);
        
        // Check if board exists for this user and race (boards are shared across all leagues)
        const { data: boardData, error: boardError } = await supabase
          .from('boards')
          .select('*')
          .eq('race_identifier', raceId)
          .eq('user_id', user.id)
          .single();

        if (boardError) {
          if (boardError.code === 'PGRST116') {
            // No board exists yet
            console.log('[RacePage] No existing board found');
            
            // If race already started, show empty locked board and prevent editing
            if (race && (race.status === 'live' || race.status === 'finished')) {
              console.log('[RacePage] Race already started - locking board');
              setBoardLocked(true);
              setBoardSaved(true); // Prevent save button from showing
              // Keep empty predictions from createEmptyPredictions()
              if (race.status === 'live') {
                toast.info('Qualifying has started. You can still vote on claims!');
              } else if (race.status === 'finished') {
                toast.info('This race has finished. You did not participate in this race.');
              }
            }
            
            setBoardLoading(false);
            return;
          }
          throw boardError;
        }

        if (boardData) {
          console.log('[RacePage] Board found:', boardData.id);
          setBoardId(boardData.id);
          setBoardLocked(boardData.locked);
          setBoardSaved(true); // Board exists, so it's been saved

          // Load predictions
          const { data: predictionsData, error: predictionsError } = await supabase
            .from('predictions')
            .select('*')
            .eq('board_id', boardData.id)
            .order('position_index', { ascending: true });

          if (predictionsError) throw predictionsError;

          if (predictionsData && predictionsData.length > 0) {
            console.log('[RacePage] Loaded', predictionsData.length, 'predictions');
            const loadedPredictions: Prediction[] = predictionsData.map(p => ({
              id: p.id,
              boardId: p.board_id,
              text: p.text,
              positionIndex: p.position_index,
              marked: p.marked,
              confirmedAt: p.confirmed_at,
            }));
            setPredictions(loadedPredictions);
            
            // If board is locked, update board points (league stats updated only when race finalized)
            if (boardData.locked) {
              const updateBoardPoints = async () => {
                try {
                  const analysis = analyzeBingoBoard(loadedPredictions);
                  console.log('[RacePage] Updating board points on load:', analysis.points);
                  
                  // Set local points state immediately
                  setPoints(analysis.points);
                  
                  // Update board points in DB
                  await supabase
                    .from('boards')
                    .update({
                      points: analysis.points,
                      bingos_completed: analysis.totalBingos,
                      full_board_completed: analysis.fullBoardCompleted,
                    })
                    .eq('id', boardData.id);
                } catch (error) {
                  console.error('[RacePage] Error updating board points on load:', error);
                }
              };
              
              updateBoardPoints();
            } else {
              // Board exists but not locked yet - ensure points start at 0
              setPoints(0);
            }
          }
        }
      } catch (error) {
        console.error('[RacePage] Error loading board:', error);
        toast.error('Failed to load board');
      } finally {
        setBoardLoading(false);
      }
    }

    loadBoard();
  }, [user?.id, raceId, leagueId, race]);

  // Function to view another member's board
  const handleViewMemberBoard = async (member: LeagueMember) => {
    if (!leagueId || !raceId) return;
    if (member.user.id === user?.id) {
      toast.info("That's your board!");
      return;
    }

    try {
      console.log('[RacePage] Loading board for member:', member.user.displayName);
      
      // Fetch member's board (boards are shared across all leagues)
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id, locked')
        .eq('race_identifier', raceId)
        .eq('user_id', member.user.id)
        .single();

      if (boardError || !boardData) {
        // If no board exists and race already started, show empty locked board
        if (race && (race.status === 'live' || race.status === 'finished')) {
          console.log('[RacePage] Member has no board, race started - showing empty locked board');
          
          // Create empty predictions
          const emptyPredictions = Array.from({ length: 25 }, (_, i) => ({
            id: `pred-empty-${i}`,
            boardId: '',
            text: i === 12 ? 'FREE SPACE' : '',
            positionIndex: i,
            marked: i === 12,
            confirmedAt: i === 12 ? new Date().toISOString() : null,
          }));

          setViewingPredictions(emptyPredictions);
          setViewingBoardLocked(true);
          setViewingBoardId(null);
          setViewingMember(member);
          return;
        }
        
        // If race hasn't started yet, show toast
        toast.info(`${member.user.displayName} hasn't created a board yet`);
        return;
      }

      // Fetch predictions
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('predictions')
        .select('*')
        .eq('board_id', boardData.id)
        .order('position_index');

      if (predictionsError) throw predictionsError;

      // Fetch claims to determine which predictions are actually approved
      const predictionIds = predictionsData.map(p => p.id);
      const { data: claimsData } = await supabase
        .from('claims')
        .select('prediction_id, status')
        .eq('league_id', leagueId)
        .in('prediction_id', predictionIds);

      console.log('[RacePage] 📊 Loaded predictions for viewed board:', predictionsData.length);
      console.log('[RacePage] 📋 Claims status:', claimsData);

      // Create a map of prediction_id -> claim status
      const claimStatusMap = new Map(
        claimsData?.map(c => [c.prediction_id, c.status]) || []
      );

      const loadedPredictions = predictionsData.map((p) => {
        const claimStatus = claimStatusMap.get(p.id);
        // If there's an approved claim, mark as confirmed regardless of DB confirmed_at
        const isConfirmed = claimStatus === 'approved';
        
        return {
          id: p.id,
          boardId: p.board_id,
          text: p.text,
          positionIndex: p.position_index,
          marked: p.marked,
          confirmedAt: isConfirmed ? (p.confirmed_at || new Date().toISOString()) : p.confirmed_at,
        };
      });

      // Fill empty spots
      const fullPredictions = Array.from({ length: 25 }, (_, i) => {
        const existing = loadedPredictions.find((p) => p.positionIndex === i);
        return existing || {
          id: `pred-${i}`,
          boardId: boardData.id,
          text: i === 12 ? 'FREE SPACE' : '',
          positionIndex: i,
          marked: i === 12,
          confirmedAt: null,
        };
      });

      setViewingPredictions(fullPredictions);
      setViewingBoardLocked(boardData.locked);
      setViewingBoardId(boardData.id);
      setViewingMember(member);
    } catch (error) {
      console.error('[RacePage] Error loading member board:', error);
      toast.error('Failed to load board');
    }
  };

  // Auto-lock board when race status becomes 'live' (qualifying starts)
  useEffect(() => {
    if (!race || !boardId) return;
    if (race.status !== 'live') return;
    if (boardLocked) return; // Already locked

    const autoLockBoard = async () => {
      try {
        console.log('[RacePage] ⏰ Qualifying started! Auto-locking board...');
        
        const { error } = await supabase
          .from('boards')
          .update({ locked: true })
          .eq('id', boardId);

        if (error) throw error;

        setBoardLocked(true);
        toast.info('Board automatically locked - Qualifying has started!', {
          description: 'You can now make claims on your predictions.',
        });
      } catch (error) {
        console.error('[RacePage] Error auto-locking board:', error);
      }
    };

    autoLockBoard();
  }, [race?.status, boardId, boardLocked]);

  // Finalize points when race status is 'finished'
  useEffect(() => {
    if (!leagueId || !raceId || !race) return;
    if (race.status !== 'finished') return;

    const finalizeRacePoints = async () => {
      try {
        console.log('[RacePage] 🏁 Race finished! Finalizing points for all users...');
        
        // Get all locked boards for this race (boards are shared across all leagues)
        const { data: boards, error: boardsError } = await supabase
          .from('boards')
          .select('id, user_id, locked, points')
          .eq('race_identifier', raceId)
          .eq('locked', true);
        
        if (boardsError) {
          console.error('[RacePage] Error fetching boards:', boardsError);
          return;
        }
        
        if (!boards || boards.length === 0) {
          console.log('[RacePage] No locked boards to finalize');
          return;
        }
        
        console.log('[RacePage] Finalizing', boards.length, 'boards...');
        
        // Process each board
        for (const board of boards) {
          // Get predictions for this board
          const { data: predictions } = await supabase
            .from('predictions')
            .select('*')
            .eq('board_id', board.id)
            .order('position_index', { ascending: true });
          
          if (!predictions) continue;
          
          const typedPredictions: Prediction[] = predictions.map(p => ({
            id: p.id,
            boardId: p.board_id,
            text: p.text,
            positionIndex: p.position_index,
            marked: p.marked,
            confirmedAt: p.confirmed_at,
          }));
          
          const analysis = analyzeBingoBoard(typedPredictions);
          
          console.log(`[RaceContext] User ${board.user_id}: board ${board.id} calculated ${analysis.points} points`);
          
          // Update board points
          const { error: boardUpdateError } = await supabase
            .from('boards')
            .update({
              points: analysis.points,
              bingos_completed: analysis.totalBingos,
              full_board_completed: analysis.fullBoardCompleted,
            })
            .eq('id', board.id);
          
          if (boardUpdateError) {
            console.error(`[RaceContext] Error updating board ${board.id}:`, boardUpdateError);
            continue;
          }
          
          // Get all leagues this user is in
          const { data: userLeagues, error: leaguesError } = await supabase
            .from('league_members')
            .select('league_id')
            .eq('user_id', board.user_id);
          
          if (leaguesError) {
            console.error(`[RaceContext] Error fetching user leagues:`, leaguesError);
            continue;
          }
          
          if (!userLeagues || userLeagues.length === 0) continue;
          
          // Get all boards for this user (across all races, since boards are shared)
          const { data: userBoards, error: userBoardsError } = await supabase
            .from('boards')
            .select('id, points, bingos_completed')
            .eq('user_id', board.user_id);
          
          if (userBoardsError) {
            console.error(`[RaceContext] Error fetching user boards:`, userBoardsError);
            continue;
          }
          
          if (!userBoards) continue;
          
          console.log(`[RaceContext] User ${board.user_id} has ${userBoards.length} boards across all races`);
          
          const cumulativePoints = userBoards.reduce((sum, b) => sum + (b.points || 0), 0);
          const totalBingos = userBoards.reduce((sum, b) => sum + (b.bingos_completed || 0), 0);
          
          // Get all predictions for this user
          const boardIds = userBoards.map(b => b.id);
          const { data: allPredictions } = await supabase
            .from('predictions')
            .select('id, confirmed_at, position_index')
            .in('board_id', boardIds);
          
          // Get claims to check which predictions are approved (workaround for RLS)
          const predictionIds = allPredictions?.map(p => p.id) || [];
          const { data: claims } = await supabase
            .from('claims')
            .select('prediction_id, status')
            .eq('league_id', leagueId)
            .in('prediction_id', predictionIds);
          
          const approvedPredictions = new Set(
            claims?.filter(c => c.status === 'approved').map(c => c.prediction_id) || []
          );
          
          // Count predictions that are either confirmed or have approved claims (excluding free space)
          const totalCorrectPredictions = allPredictions?.filter(p => 
            p.position_index !== 12 && (p.confirmed_at || approvedPredictions.has(p.id))
          ).length || 0;
          
          // Update league_members for ALL leagues this user is in
          for (const userLeague of userLeagues) {
            await supabase
              .from('league_members')
              .update({
                cumulative_points: cumulativePoints,
                total_correct_predictions: totalCorrectPredictions,
                total_bingos: totalBingos,
              })
              .eq('league_id', userLeague.league_id)
              .eq('user_id', board.user_id);
          }
          
          console.log('[RacePage] ✅ Finalized user:', board.user_id, { cumulativePoints });
        }
        
        console.log('[RacePage] 🏆 All points finalized! Refreshing leaderboard...');
        toast.success('Race finalized! Points updated.');
        fetchMembers();
      } catch (error) {
        console.error('[RacePage] Error finalizing race points:', error);
        toast.error('Failed to finalize race points');
      }
    };

    // Run finalization once when race status is finished
    finalizeRacePoints();
  }, [race?.status, leagueId, raceId, fetchMembers]);

  // Load claims for all boards in this race
  useEffect(() => {
    async function loadClaims() {
      if (!leagueId || !raceId) return;

      try {
        console.log('[RacePage] Loading claims for race:', raceId);
        
        // Get all members of this league
        const { data: leagueMembers, error: membersError } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', leagueId);

        if (membersError) throw membersError;

        if (!leagueMembers || leagueMembers.length === 0) {
          console.log('[RacePage] No members in this league');
          return;
        }

        const memberUserIds = leagueMembers.map(m => m.user_id);

        // Get all boards for this race by league members (boards are shared across leagues)
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('id')
          .eq('race_identifier', raceId)
          .in('user_id', memberUserIds);

        if (boardsError) throw boardsError;

        if (!boardsData || boardsData.length === 0) {
          console.log('[RacePage] No boards found for this race');
          return;
        }

        const boardIds = boardsData.map(b => b.id);

        // Get all predictions for these boards
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select('id')
          .in('board_id', boardIds);

        if (predictionsError) throw predictionsError;

        if (!predictionsData || predictionsData.length === 0) {
          console.log('[RacePage] No predictions found');
          return;
        }

        const predictionIds = predictionsData.map(p => p.id);

        // Get all claims for these predictions in this league
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims')
          .select(`
            id,
            prediction_id,
            league_id,
            status,
            approvals_count,
            rejects_count,
            created_at,
            profiles:claimed_by (
              id,
              username,
              display_name
            ),
            predictions:prediction_id (
              text
            )
          `)
          .eq('league_id', leagueId)
          .in('prediction_id', predictionIds)
          .order('created_at', { ascending: false });

        if (claimsError) throw claimsError;

        if (claimsData) {
          console.log('[RacePage] Loaded', claimsData.length, 'claims');
          
          // First, handle ALL claims including rejected ones to update predictions
          const allFormattedClaims: Claim[] = claimsData.map(c => ({
            id: c.id,
            predictionId: c.prediction_id,
            predictionText: c.predictions?.text || '',
            claimedBy: {
              id: c.profiles?.id || '',
              email: '',
              displayName: c.profiles?.display_name || c.profiles?.username || 'Unknown',
            },
            leagueId: c.league_id || leagueId,
            status: c.status as 'pending' | 'approved' | 'rejected' | 'expired',
            approvalsCount: c.approvals_count || 0,
            rejectsCount: c.rejects_count || 0,
            totalVotes: (c.approvals_count || 0) + (c.rejects_count || 0),
            createdAt: c.created_at,
          }));
          
          // Update predictions state based on ALL claims (including rejected)
          // This ensures rejected claims unmark their predictions
          setPredictions((prevPredictions) => {
            return prevPredictions.map((pred) => {
              // Find if there's a claim for this specific prediction (by ID)
              const claim = allFormattedClaims.find(c => c.predictionId === pred.id);
              
              if (!claim) {
                // No claim for this prediction
                return pred;
              }
              
              // Update prediction based on claim status
              if (claim.status === 'approved') {
                return { ...pred, marked: true, confirmedAt: claim.createdAt };
              } else if (claim.status === 'pending') {
                return { ...pred, marked: true, confirmedAt: undefined };
              } else if (claim.status === 'rejected') {
                // Unmark rejected predictions
                return { ...pred, marked: false, confirmedAt: undefined };
              }
              
              return pred;
            });
          });
          
          // Now filter out rejected claims for display
          const displayClaims = allFormattedClaims.filter(c => c.status !== 'rejected');
          setClaims(displayClaims);
          
          // Delete rejected claims from database (after updating predictions)
          const rejectedClaims = claimsData.filter(c => c.status === 'rejected');
          if (rejectedClaims.length > 0) {
            const rejectedIds = rejectedClaims.map(c => c.id);
            const rejectedPredictionIds = rejectedClaims.map(c => c.prediction_id);
            console.log('[RacePage] Deleting', rejectedIds.length, 'rejected claims');
            
            // Update predictions in database to unmark them
            supabase
              .from('predictions')
              .update({ marked: false, confirmed_at: null })
              .in('id', rejectedPredictionIds)
              .then(({ error }) => {
                if (error) {
                  console.error('[RacePage] Error updating rejected predictions:', error);
                } else {
                  console.log('[RacePage] ✅ Unmarked rejected predictions');
                }
              });
            
            // Delete rejected claims
            supabase
              .from('claims')
              .delete()
              .in('id', rejectedIds)
              .then(({ error }) => {
                if (error) {
                  console.error('[RacePage] Error deleting rejected claims:', error);
                } else {
                  console.log('[RacePage] ✅ Deleted rejected claims');
                }
              });
          }
          
          console.log('[RacePage] Predictions updated based on claims');
        }
      } catch (error) {
        console.error('[RacePage] Error loading claims:', error);
      }
    }

    loadClaims();
    
    // Set up real-time subscription for claims and votes
    let reloadTimeout: NodeJS.Timeout | null = null;
    
    const debouncedReload = () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        console.log('[RacePage] Claims/votes updated, reloading...');
        loadClaims();
      }, 200); // Reduced debounce for faster updates
    };

    const claimsChannel = supabase
      .channel(`race-claims-${leagueId}-${raceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        (payload) => {
          console.log('[RacePage] Claims change detected:', payload);
          debouncedReload();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claim_votes',
        },
        (payload) => {
          console.log('[RacePage] Vote change detected:', payload);
          debouncedReload();
        }
      );

    claimsChannel.subscribe((status) => {
      console.log('[RacePage] Realtime subscription status:', status);
    });

    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      supabase.removeChannel(claimsChannel);
    };
  }, [leagueId, raceId]);

  // Separate subscription for predictions and board updates (requires boardId)
  useEffect(() => {
    if (!boardId) return;

    const boardChannel = supabase
      .channel(`board-updates-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'predictions',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[RacePage] Prediction updated:', payload);
          // Update the specific prediction in local state
          if (payload.new) {
            setPredictions((prev) =>
              prev.map((p) =>
                p.id === payload.new.id
                  ? {
                      ...p,
                      marked: payload.new.marked,
                      confirmedAt: payload.new.confirmed_at,
                    }
                  : p
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boards',
          filter: `id=eq.${boardId}`,
        },
        (payload) => {
          console.log('[RacePage] Board updated from external source:', payload);
          // Update points when board is updated by another viewer or system
          if (payload.new && payload.new.points !== undefined) {
            setPoints(payload.new.points);
            console.log('[RacePage] 🔄 Points synced from DB:', payload.new.points);
          }
        }
      );

    boardChannel.subscribe((status) => {
      console.log('[RacePage] Board subscription status:', status);
    });

    return () => {
      supabase.removeChannel(boardChannel);
    };
  }, [boardId]);

  // Calculate points whenever predictions change
  useEffect(() => {
    if (!boardLocked) return; // Only calculate points for locked boards
    
    const analysis = analyzeBingoBoard(predictions);
    setPoints(analysis.points);
    
    // Only highlight NEW bingos (not all bingos every time)
    const currentBingosKey = JSON.stringify(analysis.completedBingos.sort());
    const previousBingosKey = previousBingosRef.current;
    
    if (currentBingosKey !== previousBingosKey) {
      // New bingo completed! Highlight it
      const newCells = getHighlightedCells(analysis.completedBingos);
      setHighlightedCells(newCells);
      
      // Clear highlighting after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedCells(new Set());
      }, 3000);
      
      // Update the ref for next comparison
      previousBingosRef.current = currentBingosKey;
      
      return () => clearTimeout(timer);
    }

    // Update board points in database (league stats updated only when race finalized)
    if (boardId) {
      const updateBoardPoints = async () => {
        try {
          const { data, error } = await supabase
            .from('boards')
            .update({
              points: analysis.points,
              bingos_completed: analysis.totalBingos,
              full_board_completed: analysis.fullBoardCompleted,
            })
            .eq('id', boardId)
            .select('user_id, points')
            .single();

          if (error) {
            console.error('[RacePage] Error updating board points:', error);
          } else {
            console.log('[RacePage] ✅ Board points updated in DB:', data);
            // Update leaderboard immediately without refresh
            if (data && data.user_id && data.points !== undefined) {
              setMembers(prev => prev.map(m => 
                m.userId === data.user_id 
                  ? { ...m, cumulativePoints: data.points }
                  : m
              ));
            }
          }
        } catch (error) {
          console.error('[RacePage] Error updating board points:', error);
        }
      };

      updateBoardPoints();
    }
  }, [predictions, boardId, boardLocked]);

  // Fetch members on mount and when leagueId changes
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Set up real-time subscription for league members updates
  useEffect(() => {
    if (!leagueId) return;

    const membersChannel = supabase
      .channel(`league-members-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'league_members',
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          console.log('[RacePage] 🔄 Member stats changed');
          // Refresh members when any member's stats change
          fetchMembers();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RacePage] ✅ Subscribed to league members updates');
        }
      });

    return () => {
      supabase.removeChannel(membersChannel);
    };
  }, [leagueId, fetchMembers]);

  // Set up real-time subscription for race-specific board points updates
  useEffect(() => {
    if (!leagueId || !raceId) return;

    console.log('[RacePage] 🔧 Setting up boards subscription for race:', raceId);

    const raceBoardsChannel = supabase
      .channel(`race-boards-leaderboard-${raceId}`, {
        config: {
          broadcast: { self: true }
        }
      });
      
    raceBoardsChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boards',
          filter: `race_identifier=eq.${raceId}`,
        },
        (payload) => {
          console.log('[RacePage] 🔥 BOARDS UPDATE RECEIVED:', {
            user_id: payload.new?.user_id,
            points: payload.new?.points,
            full_payload: payload
          });
          
          // Update member points directly in state
          if (payload.new && payload.new.user_id && payload.new.points !== undefined) {
            console.log('[RacePage] ⚡ Updating member points for user:', payload.new.user_id, 'to', payload.new.points);
            setMembers(prevMembers => {
              const updated = prevMembers.map(member => 
                member.userId === payload.new.user_id
                  ? { ...member, cumulativePoints: payload.new.points }
                  : member
              );
              console.log('[RacePage] ✅ Members state updated');
              return updated;
            });
          } else {
            console.log('[RacePage] ⚠️ Missing data in payload:', {
              has_new: !!payload.new,
              has_user_id: !!payload.new?.user_id,
              has_points: payload.new?.points !== undefined
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[RacePage] 📡 Boards subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[RacePage] ✅ Successfully subscribed to race boards updates');
        } else if (status === 'CLOSED') {
          console.log('[RacePage] ❌ Subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('[RacePage] ❌ Subscription error');
        }
      });

    return () => {
      console.log('[RacePage] 🧹 Cleaning up boards subscription');
      supabase.removeChannel(raceBoardsChannel);
    };
  }, [leagueId, raceId]);

  // Subscription for viewed board predictions
  useEffect(() => {
    if (!viewingBoardId) return;

    console.log('[RacePage] 🔧 Setting up viewed board subscription for:', viewingBoardId);

    const viewedBoardChannel = supabase
      .channel(`viewed-board-${viewingBoardId}`, {
        config: {
          broadcast: { self: true }
        }
      });
      
    viewedBoardChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'predictions',
          filter: `board_id=eq.${viewingBoardId}`,
        },
        (payload) => {
          console.log('[RacePage] 🔥 VIEWED BOARD PREDICTION UPDATE:', {
            id: payload.new?.id,
            marked: payload.new?.marked,
            confirmed_at: payload.new?.confirmed_at,
            old_marked: payload.old?.marked,
            old_confirmed: payload.old?.confirmed_at
          });
          
          if (payload.new) {
            setViewingPredictions((prev) => {
              const oldPrediction = prev.find(p => p.id === payload.new.id);
              console.log('[RacePage] 📝 Before update - prediction:', oldPrediction);
              
              const updated = prev.map((p) =>
                p.id === payload.new.id
                  ? {
                      ...p,
                      marked: payload.new.marked,
                      confirmedAt: payload.new.confirmed_at,
                    }
                  : p
              );
              
              const updatedPrediction = updated.find(p => p.id === payload.new.id);
              console.log('[RacePage] ✅ After update - prediction:', updatedPrediction);
              
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[RacePage] 📡 Viewed board subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[RacePage] ✅ Subscribed to viewed board predictions');
        }
      });

    return () => {
      console.log('[RacePage] 🧹 Cleaning up viewed board subscription');
      supabase.removeChannel(viewedBoardChannel);
    };
  }, [viewingBoardId]);

  const currentUser: User = {
    id: user?.id || '',
    email: user?.email || '',
    displayName: user?.user_metadata?.username || user?.email?.split('@')[0] || 'User',
  };

  const filledCount = predictions.filter((p) => p.text.trim() !== '' && p.text !== 'FREE SPACE').length;
  const canSave = filledCount === 24;

  const handleCellEdit = (index: number, text: string) => {
    if (boardLocked) return;
    if (!editMode && boardSaved) return; // Can't edit if saved and not in edit mode
    setPredictions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, text } : p))
    );
  };

  const handleEditBoard = () => {
    if (boardLocked) {
      toast.error('Board is locked - qualifying has started!');
      return;
    }
    setEditMode(true);
    toast.info('Edit mode enabled');
  };

  const handleSaveBoard = async () => {
    if (!canSave) {
      toast.error(`Fill all 24 predictions before saving (${filledCount}/24 filled)`);
      return;
    }
    const texts = predictions.filter(p => p.text !== 'FREE SPACE').map(p => p.text.trim().toLowerCase());
    const dupes = texts.filter((t, i) => texts.indexOf(t) !== i);
    if (dupes.length > 0) {
      toast.error(`Remove duplicate predictions: "${dupes[0]}"`);
      return;
    }

    if (!user?.id || !raceId || !leagueId) {
      toast.error('Unable to save board');
      return;
    }

    // Prevent board creation after lock time
    if (!boardId && race && (race.status === 'live' || race.status === 'finished')) {
      toast.error('Cannot create board after qualifying has started');
      return;
    }

    try {
      console.log('[RacePage] Saving board...');
      
      let currentBoardId = boardId;

      // Create or update board (without locking)
      if (!currentBoardId) {
        const { data: newBoard, error: boardError } = await supabase
          .from('boards')
          .insert({
            league_id: leagueId,
            race_identifier: raceId,
            user_id: user.id,
            locked: false, // Don't lock on save
          })
          .select()
          .single();

        if (boardError) throw boardError;
        currentBoardId = newBoard.id;
        setBoardId(currentBoardId);
        console.log('[RacePage] Board created:', currentBoardId);
      } else {
        // Just update predictions, don't change lock status
        console.log('[RacePage] Board updated');
      }

      // Save predictions
      const predictionsToInsert = predictions.map(p => ({
        board_id: currentBoardId,
        text: p.text,
        position_index: p.positionIndex,
        marked: p.marked,
        confirmed_at: p.confirmedAt,
      }));

      // Delete old predictions if they exist
      const { error: deleteError } = await supabase
        .from('predictions')
        .delete()
        .eq('board_id', currentBoardId);

      if (deleteError) throw deleteError;

      // Insert new predictions
      const { error: insertError } = await supabase
        .from('predictions')
        .insert(predictionsToInsert);

      if (insertError) throw insertError;

      console.log('[RacePage] Predictions saved');
      setBoardSaved(true);
      setEditMode(false);
      toast.success('Predictions saved! You can edit until qualifying starts.');
    } catch (error) {
      console.error('[RacePage] Error saving board:', error);
      toast.error('Failed to save board. Please try again.');
    }
  };

  const handleCellClick = async (prediction: Prediction) => {
    if (!boardLocked) {
      // Can't make claims before qualifying starts
      return;
    }
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
    if (!user?.id || !leagueId) return;

    // Prevent claims if race is finished
    if (race?.status === 'finished') {
      toast.error('Cannot make claims - Chequered Flag has been waved');
      return;
    }

    try {
      console.log('[RacePage] Creating claim for prediction:', prediction.id, 'in league:', leagueId);

      // Check if claim already exists for this league
      const { data: existingClaim } = await supabase
        .from('claims')
        .select('id')
        .eq('prediction_id', prediction.id)
        .eq('league_id', leagueId)
        .single();

      if (existingClaim) {
        toast.error('Claim already exists for this prediction in this league');
        return;
      }

      // Don't mark prediction yet - only mark when approved
      // Claim will show in feed, but cell stays grey until approved

      // Save claim to database with league_id
      const { data: claimData, error: claimError } = await supabase
        .from('claims')
        .insert({
          prediction_id: prediction.id,
          claimed_by: user.id,
          league_id: leagueId,
          status: 'pending',
          approvals_count: 0,
          rejects_count: 0,
        })
        .select(`
          id,
          prediction_id,
          league_id,
          status,
          approvals_count,
          rejects_count,
          created_at,
          profiles:claimed_by (
            id,
            username,
            display_name
          )
        `)
        .single();

      if (claimError) throw claimError;

      console.log('[RacePage] Claim created:', claimData.id);

      // Add to local claims feed (real-time subscription will also update it)
      const newClaim: Claim = {
        id: claimData.id,
        predictionId: prediction.id,
        predictionText: prediction.text,
        claimedBy: currentUser,
        leagueId: leagueId,
        status: 'pending',
        approvalsCount: 0,
        rejectsCount: 0,
        totalVotes: 0,
        createdAt: claimData.created_at,
      };
      setClaims((prev) => [newClaim, ...prev]);
      toast.success(`Claim submitted: "${prediction.text}"`);
    } catch (error) {
      console.error('[RacePage] Error creating claim:', error);
      toast.error('Failed to create claim');
      
      // Revert the marked status on error
      setPredictions((prev) =>
        prev.map((p) => (p.id === prediction.id ? { ...p, marked: false } : p))
      );
    }
  };

  const handleVote = async (claimId: string, approve: boolean) => {
    if (!user?.id) return;

    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    // Prevent voting on own claims
    if (claim.claimedBy.id === currentUser.id) {
      toast.error("You can't vote on your own claim");
      return;
    }

    // Prevent voting if race is finished
    if (race?.status === 'finished') {
      toast.error('Cannot vote on claims - Chequered Flag has been waved');
      return;
    }

    // Calculate new values for optimistic update
    const newApprovals = claim.approvalsCount + (approve ? 1 : 0);
    const newRejects = claim.rejectsCount + (approve ? 0 : 1);
    const newTotal = claim.totalVotes + 1;
    const approvalRate = newApprovals / newTotal;
    
    // Total possible voters = all league members except the claimant
    const totalPossibleVoters = members.length - 1;
    const remainingVotes = totalPossibleVoters - newTotal;
    
    // Check if claim should be auto-resolved
    let newStatus = claim.status;
    
    const worstCaseApprovals = newApprovals;
    const worstCaseTotal = newTotal + remainingVotes;
    const worstCaseRate = worstCaseTotal > 0 ? worstCaseApprovals / worstCaseTotal : 0;
    
    const bestCaseApprovals = newApprovals + remainingVotes;
    const bestCaseTotal = worstCaseTotal;
    const bestCaseRate = bestCaseTotal > 0 ? bestCaseApprovals / bestCaseTotal : 0;
    
    if ((newTotal >= 3 && approvalRate >= 0.6) || worstCaseRate >= 0.6) {
      newStatus = 'approved';
    } else if (bestCaseRate < 0.6) {
      newStatus = 'rejected';
    }

    // OPTIMISTIC UPDATE - Update UI immediately
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id !== claimId) return c;
        return {
          ...c,
          approvalsCount: newApprovals,
          rejectsCount: newRejects,
          totalVotes: newTotal,
          status: newStatus,
        };
      })
    );

    // Update predictions optimistically if status changed
    if (newStatus === 'approved' && claim.status !== 'approved') {
      setPredictions((preds) =>
        preds.map((p) =>
          p.id === claim.predictionId
            ? { ...p, confirmedAt: new Date().toISOString(), marked: true }
            : p
        )
      );
    } else if (newStatus === 'rejected' && claim.status !== 'rejected') {
      setPredictions((preds) =>
        preds.map((p) =>
          p.id === claim.predictionId ? { ...p, marked: false, confirmedAt: null } : p
        )
      );
    }

    // Show immediate feedback
    toast.success('Vote recorded!');

    try {
      console.log('[RacePage] Voting on claim:', claimId, approve ? 'approve' : 'reject');

      // Check if user already voted (do this in background)
      const { data: existingVote } = await supabase
        .from('claim_votes')
        .select('id')
        .eq('claim_id', claimId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Revert optimistic update
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? claim : c))
        );
        toast.error('You have already voted on this claim');
        return;
      }

      // Save vote to database
      const { error: voteError } = await supabase
        .from('claim_votes')
        .insert({
          claim_id: claimId,
          user_id: user.id,
          vote: approve ? 'approve' : 'reject',
        });

      if (voteError) throw voteError;

      // Update claim in database
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          approvals_count: newApprovals,
          rejects_count: newRejects,
          status: newStatus,
        })
        .eq('id', claimId);

      if (updateError) throw updateError;

      console.log('[RacePage] Vote recorded, status:', newStatus);

      // If approved, mark the prediction as confirmed in DB
      if (newStatus === 'approved' && claim.status !== 'approved') {
        console.log('[RacePage] 🎯 APPROVING claim - updating prediction:', claim.predictionId);
        const timestamp = new Date().toISOString();
        console.log('[RacePage] 📝 Writing to DB: marked=true, confirmed_at=', timestamp);
        
        const { data, error: predictionError } = await supabase
          .from('predictions')
          .update({ 
            confirmed_at: timestamp,
            marked: true
          })
          .eq('id', claim.predictionId)
          .select('id, board_id, marked, confirmed_at');

        if (predictionError) {
          console.error('[RacePage] ❌ Error confirming prediction:', predictionError);
        } else if (!data || data.length === 0) {
          console.error('[RacePage] ⚠️ No rows updated! Prediction might not exist or RLS blocking update');
        } else {
          console.log('[RacePage] ✅ Prediction confirmed in DB:', data);
          console.log('[RacePage] 🔍 Confirmed data - marked:', data[0].marked, 'confirmed_at:', data[0].confirmed_at);
          // Update viewed board immediately if viewing this board
          if (data && data[0] && viewingBoardId === data[0].board_id) {
            console.log('[RacePage] 👁️ Updating viewed board with confirmed prediction');
            setViewingPredictions(prev => prev.map(p =>
              p.id === data[0].id
                ? { ...p, marked: true, confirmedAt: data[0].confirmed_at }
                : p
            ));
          }
        }
        toast.success(`"${claim.predictionText}" confirmed! ✓`);
      } else if (newStatus === 'rejected' && claim.status !== 'rejected') {
        console.log('[RacePage] ❌ REJECTING claim - updating prediction:', claim.predictionId);
        // Un-mark on rejection and clear confirmation
        const { data, error: predictionError } = await supabase
          .from('predictions')
          .update({ 
            marked: false,
            confirmed_at: null 
          })
          .eq('id', claim.predictionId)
          .select();

        if (predictionError) {
          console.error('[RacePage] Error unmarking prediction:', predictionError);
        } else {
          console.log('[RacePage] ✅ Prediction rejected in DB:', data);
          // Update viewed board immediately if viewing this board
          if (data && data[0] && viewingBoardId === data[0].board_id) {
            setViewingPredictions(prev => prev.map(p =>
              p.id === data[0].id
                ? { ...p, marked: false, confirmedAt: null }
                : p
            ));
          }
        }
        toast.error(`"${claim.predictionText}" rejected`);
      }
    } catch (error) {
      console.error('[RacePage] Error voting:', error);
      
      // Revert optimistic update on error
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? claim : c))
      );
      setPredictions((preds) =>
        preds.map((p) =>
          p.id === claim.predictionId
            ? { ...p, marked: claim.status === 'pending', confirmedAt: claim.status === 'approved' ? claim.createdAt : undefined }
            : p
        )
      );
      
      toast.error('Failed to record vote');
    }
  };

  if (boardLoading || leaguesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{leaguesLoading ? 'Loading leagues...' : 'Loading board...'}</p>
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flag className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-lg font-bold">Race not found</h2>
            <p className="text-sm text-muted-foreground">This race doesn't exist.</p>
          </div>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  if (!isStandaloneMode && !league) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flag className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-lg font-bold">League not found</h2>
            <p className="text-sm text-muted-foreground">This league doesn't exist or you don't have access.</p>
          </div>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Top row: Back button and profile */}
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(isStandaloneMode ? '/home' : `/league/${leagueId}`)} 
                className="gap-1 px-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <ProfileMenu />
            </div>
            
            {/* Race info row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <CountryFlag country={race.country} className="w-8 h-5 rounded object-cover flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-extrabold">{race.name}</h1>
                    {race.isSprintWeekend && (
                      <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-racing-yellow/20 text-racing-yellow border border-racing-yellow/30">
                        <Zap className="w-3 h-3" />
                        <span className="hidden sm:inline">SPRINT WEEKEND</span>
                        <span className="sm:hidden">SPRINT</span>
                      </div>
                    )}
                  </div>
                  {!isStandaloneMode && league && <p className="text-xs text-muted-foreground truncate">{league.name}</p>}
                </div>
              </div>
              
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {race.status === 'live' && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-racing-red bg-racing-red/10 px-3 py-1.5 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                  </div>
                )}
                {race.status === 'upcoming' && (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span className="hidden sm:inline">{new Date(race.lockTime).toLocaleString()}</span>
                      <span className="sm:hidden">{new Date(race.lockTime).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      Board locks at {race.isSprintWeekend ? 'sprint ' : ''}qualifying
                    </span>
                  </div>
                )}
                {race.status === 'finished' && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-racing-green bg-racing-green/10 px-3 py-1.5 rounded-full">
                    <Flag className="w-3 h-3" />
                    FINISHED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className={isStandaloneMode ? "max-w-3xl mx-auto" : "grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6"}>
          {!isStandaloneMode && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden lg:block space-y-4"
            >
              <SeasonLeaderboard 
                members={members} 
                compact 
                onViewBoard={handleViewMemberBoard}
                showViewButton={true}
                currentUserId={user?.id}
                races={races}
                leagueId={leagueId || undefined}
              />
            </motion.aside>
          )}

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
              editable={!boardLocked && (!boardSaved || editMode)}
              onCellEdit={handleCellEdit}
              highlightedCells={highlightedCells}
            />

            {!boardLocked && (
              <div className="flex flex-col items-center gap-2">
                {(!boardSaved || editMode) ? (
                  <Button
                    onClick={handleSaveBoard}
                    disabled={!canSave}
                    className="gap-2"
                    size="lg"
                  >
                    <Lock className="w-4 h-4" />
                    Save Predictions ({filledCount}/24)
                  </Button>
                ) : (
                  <Button
                    onClick={handleEditBoard}
                    variant="outline"
                    className="gap-2"
                    size="lg"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Board
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  {race.isSprintWeekend ? (
                    <>
                      <Zap className="w-3 h-3 inline text-racing-yellow" /> 
                      <strong>Sprint Weekend:</strong> Board auto-locks at sprint qualifying ({new Date(race.lockTime).toLocaleString()})
                    </>
                  ) : (
                    <>
                      Board auto-locks at qualifying start ({new Date(race.lockTime).toLocaleString()})
                    </>
                  )}
                </p>
              </div>
            )}
          </motion.div>

          {!isStandaloneMode && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
            {boardLocked && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 via-yellow-500/10 to-green-500/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">{points}</div>
                      <div className="text-xs text-muted-foreground">Points</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{predictions.filter(p => p.confirmedAt != null && p.positionIndex !== 12).length}/24</div>
                    <div className="text-xs text-muted-foreground">Confirmed</div>
                  </div>
                </motion.div>
              </>
            )}
            
            {/* Show claims feed if user has locked board (can always vote on claims) */}
            {boardLocked && (
              <>
                {/* Claims Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={claimsFilter} onValueChange={(value: 'all' | 'pending' | 'approved') => setClaimsFilter(value)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Filter claims" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Claims</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="approved">Approved Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Calculate votes required for each claim */}
                {(() => {
                  const votesRequired = new Map<string, number>();
                  const totalPossibleVoters = members.length - 1; // Exclude claimant
                  const votesNeededToPass = Math.ceil(totalPossibleVoters * 0.6);
                  
                  claims.forEach(claim => {
                    if (claim.status === 'pending') {
                      const stillNeeded = Math.max(0, votesNeededToPass - claim.approvalsCount);
                      votesRequired.set(claim.id, stillNeeded);
                    }
                  });
                  
                  return (
                    <ClaimsFeed 
                      claims={
                        claims.filter(claim => {
                          if (claimsFilter === 'pending') return claim.status === 'pending';
                          if (claimsFilter === 'approved') return claim.status === 'approved';
                          return true; // 'all'
                        })
                      } 
                      currentUser={currentUser} 
                      onVote={handleVote} 
                      votesRequired={votesRequired}
                    />
                  );
                })()}
              </>
            )}
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
          )}
        </div>

        {!isStandaloneMode && (
          <div className="lg:hidden mt-6">
          <SeasonLeaderboard 
            members={members}
            onViewBoard={handleViewMemberBoard}
            showViewButton={true}
            currentUserId={user?.id}
            races={races}
            leagueId={leagueId || undefined}
          />
          </div>
        )}
      </main>

      {/* Dialog for viewing another member's board */}
      <Dialog open={!!viewingMember} onOpenChange={(open) => {
        if (!open) {
          setViewingMember(null);
          setViewingBoardId(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingMember?.user.displayName}'s Board</span>
              {viewingBoardLocked ? (
                <span className="text-xs font-normal text-racing-green flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              ) : (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> In Progress
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <BingoBoard
              predictions={viewingPredictions}
              onCellClick={() => {}} // No interaction when viewing
              editable={false}
              onCellEdit={() => {}}
              highlightedCells={new Set()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RacePage;
