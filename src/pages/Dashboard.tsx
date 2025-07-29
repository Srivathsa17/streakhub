import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Flame, Target, Plus, CheckCircle, Calendar, Edit, Users, User, LogOut, BookOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CreateGoalDialog from '@/components/CreateGoalDialog';
import EditGoalDialog from '@/components/EditGoalDialog';
import LogProgressDialog from '@/components/LogProgressDialog';
import FriendsLeaderboard from '@/components/FriendsLeaderboard';
import FriendRequestNotifications from '@/components/FriendRequestNotifications';
import AIGoalPlanner from '@/components/AIGoalPlanner';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  xp_reward: number;
  target_date: string | null;
}

interface DailyLogEntry {
  date: string;
  xp_earned: number;
  description: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showLogProgress, setShowLogProgress] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [completingGoal, setCompletingGoal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log'>('dashboard');

  useEffect(() => {
    if (!user) return;
    fetchUserData();
    fetchGoals();
    fetchDailyLog();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { data: streakData } = await supabase
        .rpc('get_user_current_streak', { target_user_id: user.id });
      const { data: totalXPData } = await supabase
        .rpc('get_user_total_xp', { target_user_id: user.id });

      setCurrentStreak(streakData || 0);
      setTotalXP(totalXPData || 0);

      const { data: lastStreak } = await supabase
        .from('streaks')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      setLastActivity(lastStreak?.date || null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;
    setLoadingGoals(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const fetchDailyLog = async () => {
    if (!user) return;
    setLoadingLog(true);
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('date, xp_earned, description')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(14);

      if (error) throw error;
      setDailyLog(data || []);
    } catch (error) {
      console.error('Error fetching daily log:', error);
    } finally {
      setLoadingLog(false);
    }
  };

  const completeGoal = async (goalId: string, xpReward: number) => {
    if (!user) return;
    setCompletingGoal(true);
    try {
      await supabase
        .from('goals')
        .update({ completed: true })
        .eq('id', goalId);

      const today = new Date().toISOString().split('T')[0];
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!existingStreak) {
        await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            date: today,
            xp_earned: xpReward,
            description: `Completed: "${goals.find(g => g.id === goalId)?.title}"`
          });
      }

      await fetchUserData();
      await fetchGoals();
      await fetchDailyLog();
    } catch (error) {
      console.error('Error completing goal:', error);
    } finally {
      setCompletingGoal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/70 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            StreakHub
          </h1>
          <div className="flex items-center gap-3">
            {(['leaderboard', 'community', 'profile'] as const).map((route) => (
              <Button
                key={route}
                variant="ghost"
                size="sm"
                asChild
                className="text-sm transition-colors hover:bg-accent/30"
              >
                <Link to={`/${route}`} className="flex items-center gap-1.5">
                  {route === 'leaderboard' && <Trophy className="h-4 w-4" />}
                  {route === 'community' && <Users className="h-4 w-4" />}
                  {route === 'profile' && <User className="h-4 w-4" />}
                  {route.charAt(0).toUpperCase() + route.slice(1)}
                </Link>
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-sm"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Modern Pill Navigation */}
      <div className="container mx-auto px-4 mt-6 mb-2">
        <div className="flex justify-center">
          <div className="bg-muted/60 p-1 rounded-full inline-flex border border-border/50 shadow-sm">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'log'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Activity Log
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <FriendRequestNotifications />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Streak Card */}
                <Card className="jetbrains-card border border-border/50 hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-streak text-sm font-medium">
                      <Flame className="h-4 w-4" />
                      Current Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-streak">{currentStreak} days</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lastActivity ? `Active ${new Date(lastActivity).toLocaleDateString()}` : 'No activity'}
                    </p>
                  </CardContent>
                </Card>

                {/* XP Card */}
                <Card className="jetbrains-card border border-border/50 hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-warning text-sm font-medium">
                      <Trophy className="h-4 w-4" />
                      Total XP
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">{totalXP}</div>
                    <p className="text-xs text-muted-foreground mt-1">Keep growing!</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Goal Planner */}
              <Card className="jetbrains-card border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.5 2a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 4.414 7.707 6.707a1 1 0 01-1.414-1.414l3-3A1 1 0 019.5 2z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    AI Goal Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">Smart suggestions based on your progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <AIGoalPlanner 
                    userProfile={{ totalXP, currentStreak }}
                    currentGoals={goals}
                    onGoalCreated={fetchGoals}
                  />
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="jetbrains-card border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    onClick={() => setShowLogProgress(true)} 
                    className="h-10 text-sm jetbrains-button"
                  >
                    <Flame className="h-4 w-4 mr-2" />
                    Log Progress
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowCreateGoal(true)} 
                    className="h-10 text-sm"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    New Goal
                  </Button>
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="jetbrains-card border border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4" />
                      Your Goals
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {goals.filter(g => !g.completed).length} active
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowCreateGoal(true)} 
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingGoals ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : goals.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">No goals yet. Start by creating one!</p>
                  ) : (
                    <div className="space-y-3">
                      {goals.map(goal => (
                        <div
                          key={goal.id}
                          className="p-4 bg-accent/15 rounded-lg border border-border/20 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{goal.title}</h4>
                              {goal.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>
                              )}
                            </div>
                            {goal.completed && (
                              <Badge className="bg-success/80 text-success-foreground border-0 text-xs px-2">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Done
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{goal.xp_reward} XP</span>
                            {goal.target_date && (
                              <span>Due {new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                          {!goal.completed && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingGoal(goal)}
                                className="h-8 text-xs"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => completeGoal(goal.id, goal.xp_reward)}
                                disabled={completingGoal}
                                className="h-8 text-xs jetbrains-button"
                              >
                                Complete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <FriendsLeaderboard />
            </div>
          </div>
        ) : (
          /* Activity Log Tab */
          <div className="max-w-3xl mx-auto">
            <Card className="jetbrains-card border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  {dailyLog.length} recent entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLog ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : dailyLog.length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                    <p className="text-sm text-muted-foreground mb-4">No activity recorded yet.</p>
                    <Button
                      onClick={() => setShowLogProgress(true)}
                      size="sm"
                      className="jetbrains-button text-xs"
                    >
                      <Flame className="h-3 w-3 mr-1.5" />
                      Log Your First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyLog.map(entry => (
                      <div
                        key={entry.date}
                        className="flex items-center justify-between p-4 bg-accent/15 rounded-lg border border-border/20"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.description || 'Logged progress'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs px-2.5 py-1">
                          +{entry.xp_earned} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CreateGoalDialog 
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        onSuccess={fetchGoals}
      />
      <LogProgressDialog 
        open={showLogProgress}
        onOpenChange={setShowLogProgress}
        onSuccess={() => {
          fetchUserData();
          fetchDailyLog();
        }}
      />
      {editingGoal && (
        <EditGoalDialog
          goal={editingGoal}
          open={!!editingGoal}
          onOpenChange={(open) => !open && setEditingGoal(null)}
          onGoalUpdated={fetchGoals}
        />
      )}
    </div>
  );
};

export default Dashboard;