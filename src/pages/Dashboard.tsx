
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Calendar, Trophy, Flame, User, Edit, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateGoalDialog from '@/components/CreateGoalDialog';
import LogProgressDialog from '@/components/LogProgressDialog';
import EditGoalDialog from '@/components/EditGoalDialog';
import FriendsLeaderboard from '@/components/FriendsLeaderboard';
import { format, isToday } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean;
  xp_reward: number;
  created_at: string;
}

interface StreakEntry {
  id: string;
  date: string;
  description: string | null;
  xp_earned: number;
  created_at: string;
}

interface UserStats {
  totalXP: number;
  currentStreak: number;
  rank: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentLogs, setRecentLogs] = useState<StreakEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalXP: 0, currentStreak: 0, rank: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showLogProgress, setShowLogProgress] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      await Promise.all([
        fetchGoals(),
        fetchRecentLogs(),
        fetchUserStats(),
        checkTodayLog()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
    } else {
      setGoals(data || []);
    }
  };

  const fetchRecentLogs = async () => {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent logs:', error);
    } else {
      setRecentLogs(data || []);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data: totalXPData } = await supabase
        .rpc('get_user_total_xp', { target_user_id: user?.id });

      const { data: streakData } = await supabase
        .rpc('get_user_current_streak', { target_user_id: user?.id });

      // Get user rank from leaderboard
      const { data: leaderboardData } = await supabase
        .from('streaks')
        .select('user_id, xp_earned');

      const userTotals = new Map<string, number>();
      leaderboardData?.forEach(entry => {
        const current = userTotals.get(entry.user_id) || 0;
        userTotals.set(entry.user_id, current + entry.xp_earned);
      });

      const sortedUsers = Array.from(userTotals.entries())
        .sort(([,a], [,b]) => b - a);
      
      const userRank = sortedUsers.findIndex(([userId]) => userId === user?.id) + 1;

      setUserStats({
        totalXP: totalXPData || 0,
        currentStreak: streakData || 0,
        rank: userRank || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkTodayLog = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('streaks')
      .select('id')
      .eq('user_id', user?.id)
      .eq('date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking today log:', error);
    } else {
      setTodayLogged(!!data);
    }
  };

  const handleGoalComplete = async (goalId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const { error } = await supabase
        .from('goals')
        .update({ completed: true, updated_at: new Date().toISOString() })
        .eq('id', goalId);

      if (error) throw error;

      // Award XP for completing goal
      const today = new Date().toISOString().split('T')[0];
      const { error: streakError } = await supabase
        .from('streaks')
        .insert({
          user_id: user?.id,
          date: today,
          description: `Completed goal: ${goal.title}`,
          xp_earned: goal.xp_reward
        });

      if (streakError && streakError.code !== '23505') {
        console.error('Error logging goal completion XP:', streakError);
      }

      toast({
        title: "Goal Completed! 🎉",
        description: `You earned ${goal.xp_reward} XP for completing "${goal.title}"`,
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error completing goal:', error);
      toast({
        title: "Error",
        description: "Failed to complete goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Track your coding journey</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLogProgress(true)}
                variant="hero"
                disabled={todayLogged}
              >
                <Plus className="h-4 w-4 mr-2" />
                {todayLogged ? 'Logged Today' : 'Log Progress'}
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold">{userStats.totalXP}</p>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Flame className="h-8 w-8 text-streak mx-auto mb-2" />
                  <p className="text-2xl font-bold">{userStats.currentStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">#{userStats.rank || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Global Rank</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Goals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Active Goals ({activeGoals.length})
                    </CardTitle>
                    <CardDescription>Your current coding objectives</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateGoal(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                    <p className="text-muted-foreground mb-4">Set your first coding goal to get started!</p>
                    <Button onClick={() => setShowCreateGoal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeGoals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-accent/20 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{goal.title}</h4>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedGoal(goal)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleGoalComplete(goal.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {goal.target_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due {format(new Date(goal.target_date), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            <span>{goal.xp_reward} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest progress entries</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                    <p className="text-muted-foreground mb-4">Start logging your daily progress!</p>
                    <Button onClick={() => setShowLogProgress(true)} disabled={todayLogged}>
                      <Plus className="h-4 w-4 mr-2" />
                      {todayLogged ? 'Already Logged Today' : 'Log Today\'s Progress'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-4 p-3 bg-accent/20 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {format(new Date(log.date), 'MMM dd, yyyy')}
                            </span>
                            {isToday(new Date(log.date)) && (
                              <Badge variant="secondary" className="text-xs">Today</Badge>
                            )}
                          </div>
                          {log.description && (
                            <p className="text-sm text-muted-foreground">{log.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Trophy className="h-3 w-3 text-warning" />
                          <span>+{log.xp_earned} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Completed Goals ({completedGoals.length})
                  </CardTitle>
                  <CardDescription>Goals you've successfully achieved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedGoals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{goal.title}</h4>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-success">
                            <Trophy className="h-3 w-3" />
                            <span>{goal.xp_reward} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Friends Leaderboard */}
          <div className="space-y-6">
            <FriendsLeaderboard />
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View Global Leaderboard
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/community')}>
                  <User className="h-4 w-4 mr-2" />
                  Join Community Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateGoalDialog
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        onGoalCreated={() => {
          fetchGoals();
          setShowCreateGoal(false);
        }}
      />

      <LogProgressDialog
        open={showLogProgress}
        onOpenChange={setShowLogProgress}
        onProgressLogged={() => {
          fetchDashboardData();
          setShowLogProgress(false);
        }}
      />

      {selectedGoal && (
        <EditGoalDialog
          goal={selectedGoal}
          open={!!selectedGoal}
          onOpenChange={() => setSelectedGoal(null)}
          onGoalUpdated={() => {
            fetchGoals();
            setSelectedGoal(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
