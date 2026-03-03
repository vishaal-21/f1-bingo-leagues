import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useLeagues } from '@/context/LeagueContext';

const JoinLeagueDialog = () => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const { joinLeague } = useLeagues();

  const handleJoin = () => {
    if (!code.trim()) return;
    const success = joinLeague(code);
    if (success) {
      setOpen(false);
      setCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Join League
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a League</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Invite Code</Label>
            <Input
              placeholder="e.g. PIT-2026-XKCD"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
            />
            <p className="text-xs text-muted-foreground">
              Ask your league admin for the invite code
            </p>
          </div>
          <Button onClick={handleJoin} className="w-full">
            Join League
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinLeagueDialog;
