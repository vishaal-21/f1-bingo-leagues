import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Radio, ListChecks, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CountryFlag } from './CountryFlag';

interface GlobalRace {
  id: string;
  name: string;
  scheduledStartTime: string;
  status: 'upcoming' | 'locked' | 'live' | 'finished';
  country: string;
  flagEmoji: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState<GlobalRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('global_races')
        .select('*')
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;

      if (data) {
        setRaces(data.map(r => ({
          id: r.id,
          name: r.name,
          scheduledStartTime: r.scheduled_start_time,
          status: r.status as any,
          country: r.country,
          flagEmoji: r.flag_emoji,
        })));
      }
    } catch (error) {
      console.error('Error fetching races:', error);
      toast.error('Failed to load races');
    } finally {
      setLoading(false);
    }
  };

  const updateRaceStatus = async (raceId: string, newStatus: GlobalRace['status']) => {
    setUpdating(raceId);
    try {
      const { error } = await supabase
        .from('global_races')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', raceId);

      if (error) throw error;

      toast.success(`Race status updated to ${newStatus}`);
      fetchRaces();
    } catch (error: any) {
      console.error('Error updating race status:', error);
      toast.error(error.message || 'Failed to update race status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: GlobalRace['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
      case 'locked':
        return <Badge variant="secondary">Locked</Badge>;
      case 'live':
        return <Badge variant="default" className="bg-green-600">Live</Badge>;
      case 'finished':
        return <Badge variant="default" className="bg-gray-600">Finished</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-yellow-500" />
                <div>
                  <CardTitle className="text-white text-2xl">Admin Panel</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage race statuses and claims across all leagues
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {races.map((race) => (
            <Card key={race.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CountryFlag country={race.country} className="w-12 h-8 rounded object-cover" />
                    <div>
                      <h3 className="text-white font-semibold text-lg">{race.name}</h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(race.scheduledStartTime).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(race.status)}
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/claims/${race.id}`)}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                      >
                        <ListChecks className="w-4 h-4 mr-1" />
                        Manage Claims
                      </Button>

                      {race.status !== 'live' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRaceStatus(race.id, 'live')}
                          disabled={updating === race.id}
                          className="border-green-600 text-green-500 hover:bg-green-600/10"
                        >
                          <Radio className="w-4 h-4 mr-1" />
                          Set Live
                        </Button>
                      )}
                      
                      {race.status !== 'finished' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateRaceStatus(race.id, 'finished')}
                          disabled={updating === race.id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Finish Race
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
