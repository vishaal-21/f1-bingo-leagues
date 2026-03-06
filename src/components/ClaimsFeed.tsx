import { Claim, User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClaimsFeedProps {
  claims: Claim[];
  currentUser: User;
  onVote?: (claimId: string, approve: boolean) => void;
}

const ClaimsFeed = ({ claims, currentUser, onVote }: ClaimsFeedProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4 text-racing-green" />;
      case 'rejected': return <X className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-racing-amber" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Live Claims
      </h3>
      <AnimatePresence>
        {claims.map((claim) => (
          <motion.div
            key={claim.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              'rounded-lg border p-3 space-y-2',
              claim.status === 'approved' && 'border-racing-green/30 bg-racing-green/5',
              claim.status === 'pending' && 'border-racing-amber/30 bg-racing-amber/5',
              claim.status === 'rejected' && 'border-destructive/30 bg-destructive/5',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {claim.claimedBy.displayName}
                </p>
                <p className="text-sm font-medium truncate">
                  "{claim.predictionText}"
                </p>
              </div>
              {getStatusIcon(claim.status)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-racing-green">{claim.approvalsCount} ✓</span>
                <span className="text-destructive">{claim.rejectsCount} ✗</span>
                <span>({claim.totalVotes} votes)</span>
              </div>

              {claim.status === 'pending' && (
                claim.claimedBy.id === currentUser.id ? (
                  <p className="text-xs text-muted-foreground italic">Your claim</p>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-racing-green/20 hover:text-racing-green"
                      onClick={() => onVote?.(claim.id, true)}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => onVote?.(claim.id, false)}
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      No
                    </Button>
                  </div>
                )
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ClaimsFeed;
