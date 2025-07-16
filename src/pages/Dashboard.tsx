
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Target, Users, Calendar, MessageCircle, Settings, Code2, GitBranch, Clock } from 'lucide-react';
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

interface RecentStreak {
  id: string;
  date: string;
  description: string;
  xp_earned: number;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  xp_reward: number;
  completed: boolean;
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
  const [recentStreaks, setRecentStreaks] = useState<RecentStreak[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch streaks
      const { data: streaks, error: streaksError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (streaksError) {
        console.error('Error fetching streaks:', streaksError);
      }

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) {
        console.error('Error fetching goals:', goalsError);
      }

      // Calculate current streak
      let currentStreak = 0;
      if (streaks && streaks.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        const latestEntry = streaks[0];
        if (latestEntry.date === today || latestEntry.date === yesterday) {
          const streakDates = new Set(streaks.map(s => s.date));
          let checkDate = new Date();
          
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
      const activeGoals = goalsData?.filter(goal => !goal.completed).length || 0;

      setStats({
        currentStreak,
        totalXP,
        activeGoals,
        rank: totalXP > 100 ? 'Advanced' : totalXP > 50 ? 'Intermediate' : 'Beginner'
      });

      // Set recent streaks (last 5)
      setRecentStreaks(streaks?.slice(0, 5) || []);
      
      // Set goals
      setGoals(goalsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProgressLogged = () => {
    fetchDashboardData(); // Refresh all data
  };

  const handleGoalCreated = () => {
    fetchDashboardData(); // Refresh all data
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
        {/* Stats Grid */}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today's Activity & Recent Streaks */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your latest coding sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <LogProgressDialog onSuccess={handleProgressLogged} />
              </div>
              
              {recentStreaks.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Sessions</h4>
                  {recentStreaks.map((streak) => (
                    <div key={streak.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{streak.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(streak.date)}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        +{streak.xp_earned} XP
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sessions logged yet</p>
                </div>
              )}
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
                Track your objectives and milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <CreateGoalDialog onSuccess={handleGoalCreated} />
              </div>
              
              {goals.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Goals</h4>
                  {goals.filter(goal => !goal.completed).map((goal) => (
                    <div key={goal.id} className="p-4 bg-accent/20 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-foreground">{goal.title}</h5>
                        <Badge variant="outline" className="ml-2">
                          {goal.xp_reward} XP
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                      )}
                      {goal.target_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Due: {formatDate(goal.target_date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No goals set yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
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
