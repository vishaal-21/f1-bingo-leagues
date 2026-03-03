import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useLeagues } from '@/context/LeagueContext';
import { ScoringMode } from '@/types';

const CreateLeagueDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scoringMode, setScoringMode] = useState<ScoringMode>('points');
  const { createLeague } = useLeagues();

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }
    createLeague(name, scoringMode);
    setOpen(false);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create League
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New League</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>League Name</Label>
            <Input
              placeholder="e.g. Pit Lane Legends"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Scoring Mode</Label>
            <Select value={scoringMode} onValueChange={(v) => setScoringMode(v as ScoringMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Points Mode (+10 per prediction, +50 bingo)</SelectItem>
                <SelectItem value="classic">Classic Mode (first bingo wins)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} className="w-full">
            Create League
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeagueDialog;
