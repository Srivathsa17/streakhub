
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, ArrowLeft, Flame, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  current_streak: number;
  display_name?: string;
  username?: string;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Get all users' streak data and calculate totals
      const { data: streaksData, error: streaksError } = await supabase
        .from('streaks')
        .select('user_id, xp_earned, date');

      if (streaksError) {
        console.error('Error fetching streaks:', streaksError);
        setLoading(false);
        return;
      }

      // Get profiles data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Calculate stats for each user
      const userStats = new Map<string, { totalXP: number; currentStreak: number }>();
      
      // Group streaks by user
      const userStreaks = new Map<string, Array<{ date: string; xp_earned: number }>>();
      
      streaksData?.forEach(streak => {
        if (!userStreaks.has(streak.user_id)) {
          userStreaks.set(streak.user_id, []);
        }
        userStreaks.get(streak.user_id)?.push({
          date: streak.date,
          xp_earned: streak.xp_earned
        });
      });

      // Calculate total XP and current streak for each user
      userStreaks.forEach((streaks, userId) => {
        const totalXP = streaks.reduce((sum, streak) => sum + streak.xp_earned, 0);
        
        // Calculate current streak
        let currentStreak = 0;
        if (streaks.length > 0) {
          const sortedStreaks = streaks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          const latestEntry = sortedStreaks[0];
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
        
        userStats.set(userId, { totalXP, currentStreak });
      });

      // Create leaderboard entries
      const leaderboardEntries: LeaderboardEntry[] = [];
      
      userStats.forEach((stats, userId) => {
        const profile = profiles?.find(p => p.user_id === userId);
        leaderboardEntries.push({
          user_id: userId,
          total_xp: stats.totalXP,
          current_streak: stats.currentStreak,
          display_name: profile?.display_name,
          username: profile?.username,
          rank: 0 // Will be set after sorting
        });
      });

      // Sort by total XP and assign ranks
      leaderboardEntries.sort((a, b) => b.total_xp - a.total_xp);
      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(leaderboardEntries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    return entry.display_name || entry.username || 'Anonymous User';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-warning" />;
      case 2:
        return <Medal className="h-8 w-8 text-muted-foreground" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return <User className="h-6 w-6 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Top 3 */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Second Place */}
            {topThree[1] && (
              <Card className="order-2 md:order-1">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                    {getRankIcon(2)}
                  </div>
                  <Badge variant="secondary" className="mx-auto">2nd Place</Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <h3 className="font-semibold text-lg">{getDisplayName(topThree[1])}</h3>
                  <p className="text-sm text-muted-foreground">{topThree[1].total_xp} XP</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Flame className="h-3 w-3 text-streak" />
                    <p className="text-xs text-muted-foreground">{topThree[1].current_streak} day streak</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* First Place */}
            <Card className="order-1 md:order-2 transform md:scale-110 border-warning">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto bg-warning/20 rounded-full flex items-center justify-center mb-2">
                  {getRankIcon(1)}
                </div>
                <Badge variant="secondary" className="mx-auto bg-warning text-warning-foreground">Champion</Badge>
              </CardHeader>
              <CardContent className="text-center">
                <h3 className="font-semibold text-xl">{getDisplayName(topThree[0])}</h3>
                <p className="text-sm text-muted-foreground">{topThree[0].total_xp} XP</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Flame className="h-3 w-3 text-streak" />
                  <p className="text-xs text-muted-foreground">{topThree[0].current_streak} day streak</p>
                </div>
              </CardContent>
            </Card>

            {/* Third Place */}
            {topThree[2] && (
              <Card className="order-3">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                    {getRankIcon(3)}
                  </div>
                  <Badge variant="secondary" className="mx-auto">3rd Place</Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <h3 className="font-semibold text-lg">{getDisplayName(topThree[2])}</h3>
                  <p className="text-sm text-muted-foreground">{topThree[2].total_xp} XP</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Flame className="h-3 w-3 text-streak" />
                    <p className="text-xs text-muted-foreground">{topThree[2].current_streak} day streak</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
            <CardDescription>
              Rankings are updated in real-time based on total XP earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to start your coding streak and claim the top spot!
                </p>
                <Button variant="hero" onClick={() => navigate('/dashboard')}>
                  Start Your Journey
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {restOfLeaderboard.map((entry) => (
                  <div key={entry.user_id} className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">#{entry.rank}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{getDisplayName(entry)}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{entry.total_xp} XP</span>
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-streak" />
                            <span>{entry.current_streak} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
