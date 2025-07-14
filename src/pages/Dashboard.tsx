
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Target, Users, Calendar, MessageCircle, Settings, Code2, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogProgressDialog from '@/components/LogProgressDialog';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProgressLogged = () => {
    // Refresh dashboard data if needed
    window.location.reload();
  };

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
              <div className="text-2xl font-bold text-streak">0 days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Log today to continue
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total XP</CardTitle>
              <Trophy className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">0</div>
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
              <div className="text-2xl font-bold text-info">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Set your goals
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rank</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                Start logging
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
                  No goals set yet
                </p>
                <Button variant="outline" className="border-border hover:bg-accent">
                  Create Your First Goal
                </Button>
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
