import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Swords } from 'lucide-react';
import { useRivalry } from '@/context/RivalryContext';

const ChallengeRivalDialog = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendRivalInvite } = useRivalry();

  const handleChallenge = async () => {
    if (!username.trim()) return;
    setLoading(true);
    await sendRivalInvite(username);
    setLoading(false);
    setOpen(false);
    setUsername('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Swords className="w-4 h-4" />
          Challenge a Rival
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Challenge a Rival</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              placeholder="Enter their username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Send a 1v1 challenge to compete head-to-head across the season
            </p>
          </div>
          <Button onClick={handleChallenge} className="w-full" disabled={loading || !username.trim()}>
            {loading ? 'Sending...' : 'Send Challenge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeRivalDialog;
