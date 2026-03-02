import { Flag, Users, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockLeagues } from '@/data/mockData';
import CreateLeagueDialog from '@/components/CreateLeagueDialog';
import JoinLeagueDialog from '@/components/JoinLeagueDialog';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Flag className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">F1 CHAOS BINGO</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">League Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-border">
              MV
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Your <span className="text-gradient-race">Leagues</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Predict the chaos, claim the glory. Compete with friends across the F1 season.
          </p>
          <div className="flex items-center justify-center gap-3">
            <CreateLeagueDialog />
            <JoinLeagueDialog />
          </div>
        </motion.section>

        {/* Leagues Grid */}
        <section className="grid gap-4 sm:grid-cols-2">
          {mockLeagues.map((league, index) => (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/league/${league.id}`)}
              className="group rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{league.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Season {league.seasonYear} · {league.scoringMode === 'points' ? 'Points' : 'Classic'} Mode
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {league.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  {league.scoringMode === 'points' ? 'Points' : 'Classic'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground font-mono">
                  INVITE: {league.inviteCode}
                </p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Leagues', value: '2', icon: Flag },
            { label: 'Total Points', value: '385', icon: Trophy },
            { label: 'Predictions Made', value: '50', icon: Users },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="rounded-lg border border-border bg-card p-4 text-center"
            >
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-extrabold font-mono">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Index;
