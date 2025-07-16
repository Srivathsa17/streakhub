
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Target, Users, Calendar, MessageCircle, Settings, Code2, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LogProgressDialog from '@/components/LogProgressDialog';
import CreateGoalDialog from '@/components/CreateGoalDialog';

interface UserStats {
  currentStreak: number;
  totalXP: number;
  activeGoals: number;
  rank: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    totalXP: 0,
    activeGoals: 0,
    rank: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch streaks to calculate current streak and total XP
      const { data: streaks, error: streaksError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (streaksError) {
        console.error('Error fetching streaks:', streaksError);
      }

      // Fetch active goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false);

      if (goalsError) {
        console.error('Error fetching goals:', goalsError);
      }

      // Calculate current streak
      let currentStreak = 0;
      if (streaks && streaks.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Check if user logged today or yesterday to start counting
        const latestEntry = streaks[0];
        if (latestEntry.date === today || latestEntry.date === yesterday) {
          const streakDates = new Set(streaks.map(s => s.date));
          let checkDate = new Date();
          
          // If latest entry is yesterday, start from yesterday
          if (latestEntry.date === yesterday) {
            checkDate = new Date(Date.now() - 86400000);
          }
          
          while (streakDates.has(checkDate.toISOString().split('T')[0])) {
            currentStreak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          }
        }
      }

      // Calculate total XP
      const totalXP = streaks?.reduce((sum, streak) => sum + streak.xp_earned, 0) || 0;

      setStats({
        currentStreak,
        totalXP,
        activeGoals: goals?.length || 0,
        rank: totalXP > 100 ? 'Advanced' : totalXP > 50 ? 'Intermediate' : 'Beginner'
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProgressLogged = () => {
    fetchUserStats(); // Refresh stats after logging progress
  };

  const handleGoalCreated = () => {
    fetchUserStats(); // Refresh stats after creating goal
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* JetBrains-inspired Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">StreakHub</h1>
              </div>
              <div className="h-4 w-px bg-border" />
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="text-foreground font-medium">{user?.email?.split('@')[0]}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/profile')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground border-border"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid - JetBrains-inspired cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-streak" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-streak">{stats.currentStreak} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.currentStreak === 0 ? 'Log today to start' : 'Keep it going!'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total XP</CardTitle>
              <Trophy className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.totalXP}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Earn XP daily
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{stats.activeGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeGoals === 0 ? 'Set your goals' : 'Keep pushing!'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rank</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.rank}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on XP
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - JetBrains layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today's Activity */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Activity
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Track your daily coding progress
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-6 text-sm">
                  Ready to log today's coding session?
                </p>
                <LogProgressDialog onSuccess={handleProgressLogged} />
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Your Goals
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Set and track your objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-6 text-sm">
                  {stats.activeGoals === 0 ? 'No goals set yet' : `${stats.activeGoals} active goals`}
                </p>
                <CreateGoalDialog onSuccess={handleGoalCreated} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - JetBrains style */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Navigate to key features
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="ghost" 
                className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/50 border border-border/50 hover:border-border"
                onClick={() => navigate('/leaderboard')}
              >
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-warning" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">Leaderboard</div>
                  <div className="text-xs text-muted-foreground">See rankings</div>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/50 border border-border/50 hover:border-border"
                onClick={() => navigate('/community')}
              >
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-info" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">Community</div>
                  <div className="text-xs text-muted-foreground">Join chat</div>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/50 border border-border/50 hover:border-border"
                onClick={() => navigate('/profile')}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">Profile</div>
                  <div className="text-xs text-muted-foreground">Edit settings</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
