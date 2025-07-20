import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Target, Plus, CheckCircle, Calendar, Edit, Users, User, LogOut } from 'lucide-react';
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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showLogProgress, setShowLogProgress] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [completingGoal, setCompletingGoal] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchGoals();
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
      const { data: streakData, error: streakError } = await supabase
        .rpc('get_user_current_streak', { target_user_id: user.id });

      const { data: totalXPData, error: xpError } = await supabase
        .rpc('get_user_total_xp', { target_user_id: user.id });

      if (streakError) console.error('Error fetching streak:', streakError);
      if (xpError) console.error('Error fetching XP:', xpError);

      setCurrentStreak(streakData || 0);
      setTotalXP(totalXPData || 0);

      // Fetch last activity (example: last streak date)
      const { data: lastStreak, error: lastStreakError } = await supabase
        .from('streaks')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (lastStreakError) console.error('Error fetching last streak:', lastStreakError);

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

      if (error) {
        console.error('Error fetching goals:', error);
      } else {
        setGoals(data || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const completeGoal = async (goalId: string, xpReward: number) => {
    if (!user) return;

    setCompletingGoal(true);
    try {
      // Mark goal as completed
      const { error: updateError } = await supabase
        .from('goals')
        .update({ completed: true })
        .eq('id', goalId);

      if (updateError) throw updateError;

      // Log XP earned for completing the goal
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!existingStreak) {
        const { error: streakError } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            date: today,
            xp_earned: xpReward,
            description: 'Completed a goal!'
          });

        if (streakError) throw streakError;
      }

      // Refresh user data and goals
      await fetchUserData();
      await fetchGoals();

    } catch (error) {
      console.error('Error completing goal:', error);
    } finally {
      setCompletingGoal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/community">
                <Users className="h-4 w-4 mr-2" />
                Community
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Friend Request Notifications */}
            <FriendRequestNotifications />

            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 jetbrains-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-streak" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-streak mb-2">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </div>
                <p className="text-muted-foreground">
                  {lastActivity ? `Last activity: ${lastActivity}` : 'No activity logged yet'}
                </p>
              </CardContent>
            </Card>

            {/* XP Card */}
            <Card className="bg-gradient-to-br from-secondary/10 to-muted/10 border-secondary/20 jetbrains-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-warning" />
                  Total XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-warning mb-2">
                  {totalXP}
                </div>
                <p className="text-muted-foreground">
                  Keep coding to earn more XP and climb the leaderboard!
                </p>
              </CardContent>
            </Card>

            {/* AI Goal Planner */}
            <AIGoalPlanner 
              userProfile={{ totalXP, currentStreak }}
              currentGoals={goals}
              onGoalCreated={fetchGoals}
            />

            {/* Quick Actions */}
            <Card className="jetbrains-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Log progress or set new goals</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => setShowLogProgress(true)} className="jetbrains-button">
                  <Flame className="h-4 w-4 mr-2" />
                  Log Progress
                </Button>
                <Button variant="secondary" onClick={() => setShowCreateGoal(true)} className="jetbrains-button">
                  <Target className="h-4 w-4 mr-2" />
                  Set New Goal
                </Button>
              </CardContent>
            </Card>

            {/* Goals Section */}
            <Card className="jetbrains-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your Goals
                  </CardTitle>
                  <CardDescription>Track your coding objectives</CardDescription>
                </div>
                <Button onClick={() => setShowCreateGoal(true)} className="jetbrains-button">
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </CardHeader>
              <CardContent>
                {loadingGoals ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Set your first coding goal to stay motivated!
                    </p>
                    <Button onClick={() => setShowCreateGoal(true)} className="jetbrains-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between p-4 bg-accent/20 rounded-lg jetbrains-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{goal.title}</h4>
                            {goal.completed && (
                              <Badge className="bg-success text-success-foreground">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {goal.target_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due {new Date(goal.target_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              <span>{goal.xp_reward} XP</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingGoal(goal)}
                            className="jetbrains-button"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {!goal.completed && (
                            <Button
                              size="sm"
                              onClick={() => completeGoal(goal.id, goal.xp_reward)}
                              disabled={completingGoal}
                              className="jetbrains-button"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Friends Leaderboard */}
          <div className="space-y-6">
            <FriendsLeaderboard />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateGoalDialog 
        onGoalCreated={fetchGoals}
      />

      <LogProgressDialog 
        onProgressLogged={fetchUserData}
      />

      {editingGoal && (
        <EditGoalDialog
          goal={editingGoal}
          onGoalUpdated={fetchGoals}
        />
      )}
    </div>
  );
};

export default Dashboard;
