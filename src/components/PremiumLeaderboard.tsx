
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Flame, User, UserPlus, Crown, Star, Zap, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PublicProfileDialog from '@/components/PublicProfileDialog';

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

const PremiumLeaderboard = () => {
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
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
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
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      {/* Hero Section with Top 3 */}
      <div className="text-center mb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl -z-10"></div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4">
            Global Elite
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating the world's most dedicated developers
          </p>
        </div>
      </div>

      {/* Premium Top 3 Display */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Second Place */}
          {topThree[1] && (
            <Card className="order-2 md:order-1 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 jetbrains-card" 
                  onClick={() => handleProfileClick(topThree[1])}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 to-gray-600/10 rounded-lg"></div>
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={topThree[1].avatar_url || ''} />
                    <AvatarFallback className="bg-transparent">
                      <Medal className="h-8 w-8 text-gray-100" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Badge variant="secondary" className="mx-auto bg-gray-500/20 text-gray-100 border-gray-400">
                  <Medal className="h-3 w-3 mr-1" />
                  Silver Elite
                </Badge>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <h3 className="font-bold text-xl mb-2">{getDisplayName(topThree[1])}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-4 w-4 text-warning" />
                    <span className="font-semibold">{topThree[1].total_xp} XP</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="h-4 w-4 text-streak" />
                    <span className="text-sm">{topThree[1].current_streak} day streak</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* First Place - Champion */}
          <Card className="order-1 md:order-2 transform md:scale-110 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-2 border-yellow-500/50" 
                onClick={() => handleProfileClick(topThree[0])}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-lg"></div>
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-2xl animate-pulse">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={topThree[0].avatar_url || ''} />
                  <AvatarFallback className="bg-transparent">
                    <Crown className="h-10 w-10 text-yellow-100" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <Badge variant="secondary" className="mx-auto bg-yellow-500/30 text-yellow-100 border-yellow-400">
                <Crown className="h-3 w-3 mr-1" />
                Grand Champion
              </Badge>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <h3 className="font-bold text-2xl mb-3">{getDisplayName(topThree[0])}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  <span className="font-bold text-lg">{topThree[0].total_xp} XP</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Flame className="h-5 w-5 text-streak" />
                  <span>{topThree[0].current_streak} day streak</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third Place */}
          {topThree[2] && (
            <Card className="order-3 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 jetbrains-card" 
                  onClick={() => handleProfileClick(topThree[2])}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-orange-600/10 rounded-lg"></div>
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={topThree[2].avatar_url || ''} />
                    <AvatarFallback className="bg-transparent">
                      <Award className="h-8 w-8 text-amber-100" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Badge variant="secondary" className="mx-auto bg-amber-600/20 text-amber-100 border-amber-500">
                  <Award className="h-3 w-3 mr-1" />
                  Bronze Elite
                </Badge>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <h3 className="font-bold text-xl mb-2">{getDisplayName(topThree[2])}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-4 w-4 text-warning" />
                    <span className="font-semibold">{topThree[2].total_xp} XP</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="h-4 w-4 text-streak" />
                    <span className="text-sm">{topThree[2].current_streak} day streak</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabbed Leaderboard */}
      <Card className="jetbrains-card shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6" />
            Detailed Rankings
          </CardTitle>
          <CardDescription className="text-lg">
            Comprehensive leaderboard with multiple views and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-accent/20">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                All Rankings
              </TabsTrigger>
              <TabsTrigger value="streaks" className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Top Streaks
              </TabsTrigger>
              <TabsTrigger value="rising" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Rising Stars
              </TabsTrigger>
              <TabsTrigger value="elite" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Elite Club
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">No Rankings Yet</h3>
                  <p className="text-muted-foreground text-lg mb-8">
                    Be the first to start your coding journey and claim the throne!
                  </p>
                  <Button variant="default" size="lg" onClick={() => window.location.href = '/dashboard'}>
                    <Crown className="h-5 w-5 mr-2" />
                    Start Your Journey
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {restOfLeaderboard.map((entry) => (
                    <div 
                      key={entry.user_id} 
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-accent/20 to-accent/5 rounded-xl cursor-pointer hover:from-accent/30 hover:to-accent/10 transition-all duration-300 jetbrains-card group"
                      onClick={() => handleProfileClick(entry)}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center font-bold group-hover:bg-primary/20 transition-colors">
                          {getRankIcon(entry.rank)}
                        </div>
                        <Avatar className="w-14 h-14 border-2 border-primary/20">
                          <AvatarImage src={entry.avatar_url || ''} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                            {getDisplayName(entry)}
                          </h4>
                          <div className="flex items-center gap-6 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-warning" />
                              <span className="font-semibold">{entry.total_xp} XP</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4 text-streak" />
                              <span>{entry.current_streak} days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="streaks" className="mt-6">
              <div className="space-y-3">
                {[...leaderboard].sort((a, b) => b.current_streak - a.current_streak).slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.user_id} 
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-streak/10 to-streak/5 rounded-xl cursor-pointer hover:from-streak/20 hover:to-streak/10 transition-all duration-300"
                    onClick={() => handleProfileClick(entry)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-streak/20 rounded-full flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={entry.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-lg">{getDisplayName(entry)}</h4>
                        <div className="flex items-center gap-2 text-streak">
                          <Flame className="h-4 w-4" />
                          <span className="font-bold">{entry.current_streak} day streak</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rising" className="mt-6">
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Rising Stars</h3>
                <p className="text-muted-foreground">
                  Track developers with the highest growth rates - coming soon!
                </p>
              </div>
            </TabsContent>

            <TabsContent value="elite" className="mt-6">
              <div className="space-y-3">
                {leaderboard.filter(entry => entry.total_xp >= 1000).map((entry) => (
                  <div 
                    key={entry.user_id} 
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl cursor-pointer hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 border border-primary/20"
                    onClick={() => handleProfileClick(entry)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <Avatar className="w-14 h-14 border-2 border-primary">
                        <AvatarImage src={entry.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-lg">{getDisplayName(entry)}</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-warning">
                            <Trophy className="h-4 w-4" />
                            <span className="font-bold">{entry.total_xp} XP</span>
                          </div>
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            Elite Member
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {leaderboard.filter(entry => entry.total_xp >= 1000).length === 0 && (
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Elite Club</h3>
                    <p className="text-muted-foreground">
                      Reach 1000+ XP to join the elite club of top developers!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

export default PremiumLeaderboard;
