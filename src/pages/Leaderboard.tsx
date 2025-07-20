import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Flame, User, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PublicProfileDialog from '@/components/PublicProfileDialog';
import GlossyNavbar from '@/components/GlossyNavbar';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  current_streak: number;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  rank: number;
}

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

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
        .select('user_id, display_name, username, avatar_url');

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
          avatar_url: profile?.avatar_url,
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

  const handleProfileClick = async (entry: LeaderboardEntry) => {
    try {
      // Fetch full profile data including social links
      const { data: fullProfile, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, bio, avatar_url, github_url, linkedin_url, instagram_url')
        .eq('user_id', entry.user_id)
        .single();

      if (error) {
        console.error('Error fetching full profile:', error);
        return;
      }

      setSelectedProfile(fullProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlossyNavbar />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <GlossyNavbar />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Global Leaderboard
            </h1>
            <p className="text-muted-foreground">
              See how you stack up against other coders worldwide
            </p>
          </div>

          {/* Top 3 */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Second Place */}
              {topThree[1] && (
                <Card className="order-2 md:order-1 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProfileClick(topThree[1])}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={topThree[1].avatar_url || ''} />
                        <AvatarFallback>
                          {getRankIcon(2)}
                        </AvatarFallback>
                      </Avatar>
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
              <Card className="order-1 md:order-2 transform md:scale-110 border-warning cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProfileClick(topThree[0])}>
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto bg-warning/20 rounded-full flex items-center justify-center mb-2">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={topThree[0].avatar_url || ''} />
                      <AvatarFallback>
                        {getRankIcon(1)}
                      </AvatarFallback>
                    </Avatar>
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
                <Card className="order-3 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProfileClick(topThree[2])}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={topThree[2].avatar_url || ''} />
                        <AvatarFallback>
                          {getRankIcon(3)}
                        </AvatarFallback>
                      </Avatar>
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
                Rankings are updated in real-time based on total XP earned. Click on profiles to view details and connect!
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
                  <Button variant="default" onClick={() => window.location.href = '/dashboard'}>
                    Start Your Journey
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {restOfLeaderboard.map((entry) => (
                    <div 
                      key={entry.user_id} 
                      className="flex items-center justify-between p-4 bg-accent/20 rounded-lg cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => handleProfileClick(entry)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">#{entry.rank}</span>
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={entry.avatar_url || ''} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
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
                      <Button variant="ghost" size="sm">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Public Profile Dialog */}
      {selectedProfile && (
        <PublicProfileDialog
          profile={selectedProfile}
          open={!!selectedProfile}
          onOpenChange={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default Leaderboard;
