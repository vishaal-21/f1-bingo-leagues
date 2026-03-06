import { motion } from 'framer-motion';
import { Trophy, Award, Target, Users, Vote, CheckCircle2, XCircle, AlertCircle, Clock, Zap, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HowToPlayDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <AlertCircle className="w-4 h-4" />
          How to Play
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            How to Play F1 Bingo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game Overview */}
          <section>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Game Overview
            </h3>
            <p className="text-sm text-muted-foreground">
              F1 Bingo is a multiplayer prediction game where you create a 5x5 bingo board with predictions
              for each race. When your predictions come true, claim them to get points. Complete rows, columns,
              or diagonals to earn bonus points!
            </p>
          </section>

          <Separator />

          {/* Step by Step */}
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Step-by-Step Guide
            </h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-6">1.</span>
                <div>
                  <strong>Create or Join a League</strong>
                  <p className="text-muted-foreground">Start by creating your own league or join an existing one with friends.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-6">2.</span>
                <div>
                  <strong>Fill Your Bingo Board</strong>
                  <p className="text-muted-foreground">
                    Starting from <strong>Monday of race week</strong>, create 24 predictions (center is FREE SPACE). 
                    Examples: "Hamilton DNF", "Safety Car Lap 1-5", "Red Flag".
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-6">3.</span>
                <div>
                  <strong>Board Lock Times ⏰</strong>
                  <p className="text-muted-foreground mb-2">
                    You can edit your board from Monday until qualifying starts:
                  </p>
                  <div className="space-y-1 text-xs bg-secondary/50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-racing-green" />
                      <span><strong>Normal Weekends:</strong> Board locks at main qualifying start</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-racing-yellow" />
                      <span><strong>Sprint Weekends:</strong> Board locks at sprint qualifying start</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span>After qualifying: No more edits, only claims</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-6">4.</span>
                <div>
                  <strong>Watch the Race</strong>
                  <p className="text-muted-foreground">During the race, watch for your predictions to come true.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-6">5.</span>
                <div>
                  <strong>Claim Your Predictions</strong>
                  <p className="text-muted-foreground">
                    After qualifying starts and during the race, click on predictions that came true to claim them. 
                    Your claim appears in the feed for others to vote on. 
                    <strong className="text-racing-red"> Once the race finishes, no more claims can be made!</strong>
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-6">6.</span>
                <div>
                  <strong>Vote on Others' Claims</strong>
                  <p className="text-muted-foreground">Review other players' claims and vote Yes or No. Claims need 60% approval to be confirmed.</p>
                </div>
              </li>
            </ol>
          </section>

          <Separator />

          {/* Voting System */}
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Vote className="w-5 h-5 text-primary" />
              Voting System
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <strong className="text-green-500">Approved (60%+)</strong>
                  <p className="text-muted-foreground">Claim is confirmed and player earns points.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <strong className="text-red-500">Rejected (&lt;60%)</strong>
                  <p className="text-muted-foreground">Claim is denied and removed from the board.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <strong className="text-yellow-500">Pending</strong>
                  <p className="text-muted-foreground">Waiting for enough votes. Claims auto-resolve when outcome is mathematically certain.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Points System */}
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Points System
            </h3>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Confirmed Prediction</span>
                  <span className="text-lg font-bold text-primary">+5 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Complete a Bingo (row/column/diagonal)</span>
                  <span className="text-lg font-bold text-yellow-500">+25 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Full Board (all 25 cells)</span>
                  <span className="text-lg font-bold text-green-500">+100 pts</span>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ <strong>Note:</strong> The FREE SPACE (center) doesn't count toward points, but helps complete bingos.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              💡 <strong>Strategy tip:</strong> Focus on completing bingos for maximum points! Multiple bingos = multiple bonuses.
            </p>
          </section>

          <Separator />

          {/* Race Weekend Timeline */}
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Race Weekend Timeline
            </h3>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                    <div className="text-sm">
                      <strong className="text-green-500">Monday - Qualifying Start</strong>
                      <p className="text-muted-foreground">Board is <strong>unlocked</strong>. Edit predictions freely.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="w-4 h-4 text-racing-yellow mt-1 shrink-0" />
                    <div className="text-sm">
                      <strong className="text-racing-yellow">Qualifying Starts</strong>
                      <p className="text-muted-foreground">
                        Board <strong>locked automatically</strong>. No more edits. 
                        <span className="flex items-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs">Sprint weekends lock at sprint qualifying</span>
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Trophy className="w-4 h-4 text-racing-red mt-1 shrink-0" />
                    <div className="text-sm">
                      <strong className="text-racing-red">During Race</strong>
                      <p className="text-muted-foreground">Watch race and <strong>make claims</strong> on predictions that happen.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                    <div className="text-sm">
                      <strong>Race Finished</strong>
                      <p className="text-muted-foreground">
                        🏁 <strong>Chequered flag!</strong> No more claims or edits allowed. 
                        Voting continues until admin finalizes results.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Tips */}
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span>•</span>
                <span>Mix common and rare predictions to balance risk and reward</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Be specific! "Verstappen wins" is clearer than "P1 surprise"</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Vote fairly - the integrity of the game depends on honest voting</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Plan your board layout strategically for multiple potential bingos</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Watch practice sessions to make better predictions about car issues</span>
              </li>
              <li className="flex gap-2 items-center">
                <Zap className="w-3 h-3 text-racing-yellow shrink-0" />
                <span>
                  <strong>Sprint weekends</strong> have earlier lock times! Submit your board before sprint qualifying
                </span>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
