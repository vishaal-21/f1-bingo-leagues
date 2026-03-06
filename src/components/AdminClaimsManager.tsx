import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Filter, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ClaimWithContext {
  id: string;
  prediction_id: string;
  prediction_text: string;
  claimed_by: string;
  claimer_username: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvals_count: number;
  rejects_count: number;
  created_at: string;
  race_id: string;
  race_name: string;
  league_id: string;
  league_name: string;
  board_id: string;
}

interface Race {
  id: string;
  name: string;
  scheduled_start_time: string;
  status: string;
}

interface League {
  id: string;
  name: string;
}

const AdminClaimsManager = () => {
  const navigate = useNavigate();
  const { raceId } = useParams<{ raceId: string }>();
  const [claims, setClaims] = useState<ClaimWithContext[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<ClaimWithContext[]>([]);
  const [raceClaimsCount, setRaceClaimsCount] = useState(0);
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters (no race filter since we're already filtered by URL)
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [claims, selectedLeague, selectedStatus, selectedUser]);

  const fetchData = async () => {
    try {
      setLoading(true);

      console.log('[AdminClaimsManager] Fetching claims for race:', raceId);

      // Fetch all claims with related data using a simpler query structure
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          prediction_id,
          claimed_by,
          status,
          approvals_count,
          rejects_count,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (claimsError) {
        console.error('[AdminClaimsManager] Error fetching claims:', claimsError);
        throw claimsError;
      }

      console.log('[AdminClaimsManager] Raw claims data:', claimsData);
      console.log('[AdminClaimsManager] Claims count:', claimsData?.length || 0);

      // If no claims, skip fetching related data but still load filters
      if (!claimsData || claimsData.length === 0) {
        setClaims([]);
        
        // Still fetch race and leagues for filters
        const { data: raceData } = await supabase
          .from('global_races')
          .select('id, name, scheduled_start_time, status')
          .eq('id', raceId)
          .single();
        setCurrentRace(raceData);

        const { data: allLeaguesData } = await supabase
          .from('leagues')
          .select('id, name')
          .order('name');
        setLeagues(allLeaguesData || []);
        
        setLoading(false);
        return;
      }

      // Fetch predictions for these claims
      const predictionIds = claimsData?.map(c => c.prediction_id) || [];
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('predictions')
        .select('id, text, board_id')
        .in('id', predictionIds);

      if (predictionsError) throw predictionsError;
      console.log('[AdminClaimsManager] Predictions:', predictionsData?.length || 0);

      // Fetch boards for these predictions (if any)
      const boardIds = predictionsData?.map(p => p.board_id).filter(Boolean) || [];
      let boardsData = [];
      
      console.log('[AdminClaimsManager] Board IDs to fetch:', boardIds.length);
      
      if (boardIds.length > 0) {
        const { data, error: boardsError } = await supabase
          .from('boards')
          .select('id, race_identifier, league_id')
          .in('id', boardIds);

        if (boardsError) throw boardsError;
        boardsData = data || [];
        console.log('[AdminClaimsManager] Boards fetched:', boardsData.length);
        console.log('[AdminClaimsManager] Sample board:', boardsData[0]);
      }

      // Fetch global_races (using race_identifier to match)
      const raceIdentifiers = boardsData?.map(b => b.race_identifier).filter(Boolean) || [];
      let racesData = [];
      
      console.log('[AdminClaimsManager] Race identifiers to fetch:', raceIdentifiers);
      
      if (raceIdentifiers.length > 0) {
        const { data, error: racesError } = await supabase
          .from('global_races')
          .select('id, name')
          .in('id', raceIdentifiers);

        if (racesError) throw racesError;
        racesData = data || [];
        console.log('[AdminClaimsManager] Races fetched:', racesData.length);
        console.log('[AdminClaimsManager] Sample race:', racesData[0]);
      }

      // Fetch leagues
      const leagueIds = boardsData?.map(b => b.league_id).filter(Boolean) || [];
      let leaguesDataFromBoards = [];
      
      if (leagueIds.length > 0) {
        const { data, error: leaguesError } = await supabase
          .from('leagues')
          .select('id, name')
          .in('id', leagueIds);

        if (leaguesError) throw leaguesError;
        leaguesDataFromBoards = data || [];
      }

      // Fetch user profiles
      const userIds = claimsData?.map(c => c.claimed_by).filter(Boolean) || [];
      let profilesData = [];
      
      if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profilesData = data || [];
      }

      // Build lookup maps
      const predictionsMap = new Map(predictionsData?.map(p => [p.id, p]) || []);
      const boardsMap = new Map(boardsData?.map(b => [b.id, b]) || []);
      const racesMap = new Map(racesData?.map(r => [r.id, r]) || []);
      const leaguesMap = new Map(leaguesDataFromBoards?.map(l => [l.id, l]) || []);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Combine all data
      const transformedClaims: ClaimWithContext[] = claimsData?.map((claim) => {
        const prediction = predictionsMap.get(claim.prediction_id);
        const board = prediction ? boardsMap.get(prediction.board_id) : null;
        const race = board ? racesMap.get(board.race_identifier) : null;
        const league = board ? leaguesMap.get(board.league_id) : null;
        const profile = profilesMap.get(claim.claimed_by);

        return {
          id: claim.id,
          prediction_id: claim.prediction_id,
          prediction_text: prediction?.text || 'Unknown',
          claimed_by: claim.claimed_by,
          claimer_username: profile?.username || 'Unknown',
          status: claim.status,
          approvals_count: claim.approvals_count,
          rejects_count: claim.rejects_count,
          created_at: claim.created_at,
          race_id: race?.id || '',
          race_name: race?.name || 'Unknown Race',
          league_id: league?.id || '',
          league_name: league?.name || 'Unknown League',
          board_id: board?.id || '',
        };
      }) || [];
      console.log('[AdminClaimsManager] Transformed claims:', transformedClaims.length);

      setClaims(transformedClaims);

      // Extract unique users for filter dropdown
      const uniqueUsers = Array.from(
        new Map(
          transformedClaims.map(c => [c.claimed_by, { id: c.claimed_by, username: c.claimer_username }])
        ).values()
      ).sort((a, b) => a.username.localeCompare(b.username));
      setUsers(uniqueUsers);

      // Fetch current race details
      const { data: raceData } = await supabase
        .from('global_races')
        .select('id, name, scheduled_start_time, status')
        .eq('id', raceId)
        .single();
      setCurrentRace(raceData);

      // Fetch leagues for filter dropdown
      const { data: allLeaguesData } = await supabase
        .from('leagues')
        .select('id, name')
        .order('name');
      setLeagues(allLeaguesData || []);

    } catch (error: any) {
      console.error('[AdminClaimsManager] Error:', error);
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...claims];

    console.log('[AdminClaimsManager] Applying filters...');
    console.log('[AdminClaimsManager] raceId from URL:', raceId);
    console.log('[AdminClaimsManager] Total claims before filter:', filtered.length);
    console.log('[AdminClaimsManager] Sample claim race_id:', filtered[0]?.race_id);

    // Auto-filter by raceId from URL
    if (raceId) {
      filtered = filtered.filter(c => c.race_id === raceId);
      console.log('[AdminClaimsManager] Claims after race filter:', filtered.length);
    }

    // Store the race-specific count (before other filters)
    setRaceClaimsCount(filtered.length);

    // League filter
    if (selectedLeague !== 'all') {
      filtered = filtered.filter(c => c.league_id === selectedLeague);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(c => c.claimed_by === selectedUser);
    }

    setFilteredClaims(filtered);
  };

  const updateClaimStatus = async (claimId: string, newStatus: 'approved' | 'rejected') => {
    setUpdating(claimId);
    try {
      // Update claim status
      const { error: claimError } = await supabase
        .from('claims')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', claimId);

      if (claimError) throw claimError;

      // Get claim details to update prediction
      const claim = claims.find(c => c.id === claimId);
      if (!claim) return;

      // Update prediction confirmed_at based on status
      const { error: predError } = await supabase
        .from('predictions')
        .update({
          confirmed_at: newStatus === 'approved' ? new Date().toISOString() : null,
          marked: newStatus === 'approved',
        })
        .eq('id', claim.prediction_id);

      if (predError) throw predError;

      toast.success(`Claim ${newStatus}!`);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error updating claim:', error);
      toast.error(error.message || 'Failed to update claim');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string, approvalsCount: number, rejectsCount: number) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved ({approvalsCount}✓ {rejectsCount}✗)</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected ({approvalsCount}✓ {rejectsCount}✗)</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending ({approvalsCount}✓ {rejectsCount}✗)</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSelectedLeague('all');
    setSelectedStatus('all');
    setSelectedUser('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-white">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <CardTitle className="text-white text-2xl">
                  Claims Manager - {currentRace?.name || 'Loading...'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  View and manage claims for this race across all leagues
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* League Filter */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">League</label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {leagues.map(league => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider opacity-0">Clear</label>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full border-slate-600 text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>
                Showing {filteredClaims.length} of {raceClaimsCount} claims
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Claims List */}
        <div className="space-y-3">
          {filteredClaims.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Filter className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <p className="text-slate-400">No claims found matching filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredClaims.map((claim) => (
              <Card key={claim.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Claim Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-lg mb-1">
                            "{claim.prediction_text}"
                          </p>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(claim.created_at).toLocaleString()}
                            </span>
                            <span>by {claim.claimer_username}</span>
                          </div>
                        </div>
                        {getStatusBadge(claim.status, claim.approvals_count, claim.rejects_count)}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <Badge variant="outline" className="bg-purple-600/20 border-purple-500/50 text-purple-300">
                          {claim.league_name}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {claim.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateClaimStatus(claim.id, 'rejected')}
                          disabled={updating === claim.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Overturn
                        </Button>
                      )}
                      
                      {claim.status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateClaimStatus(claim.id, 'approved')}
                          disabled={updating === claim.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}

                      {claim.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateClaimStatus(claim.id, 'approved')}
                            disabled={updating === claim.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateClaimStatus(claim.id, 'rejected')}
                            disabled={updating === claim.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClaimsManager;
