
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Flame, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FriendStats {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  rank: number;
}

const FriendsLeaderboard = () => {
  const { user } = useAuth();
  const [friendsStats, setFriendsStats] = useState<FriendStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendsStats();
    }
  }, [user]);

  const fetchFriendsStats = async () => {
    if (!user) return;

    try {
      // Get accepted friends
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('user_id, friend_user_id')
        .or(`user_id.eq.${user.id},friend_user_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        setLoading(false);
        return;
      }

      // Extract friend user IDs
      const friendUserIds = friends?.map(friend => 
        friend.user_id === user.id ? friend.friend_user_id : friend.user_id
      ) || [];

      // Add current user to the list
      friendUserIds.push(user.id);

      if (friendUserIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', friendUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get stats for each friend
      const friendsWithStats: FriendStats[] = [];
      
      for (const userId of friendUserIds) {
        try {
          const { data: totalXP } = await supabase
            .rpc('get_user_total_xp', { target_user_id: userId });
          
          const { data: currentStreak } = await supabase
            .rpc('get_user_current_streak', { target_user_id: userId });

          const profile = profiles?.find(p => p.user_id === userId);

          friendsWithStats.push({
            user_id: userId,
            display_name: profile?.display_name || null,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            total_xp: totalXP || 0,
            current_streak: currentStreak || 0,
            rank: 0 // Will be set after sorting
          });
        } catch (error) {
          console.error(`Error fetching stats for user ${userId}:`, error);
        }
      }

      // Sort by total XP and assign ranks
      friendsWithStats.sort((a, b) => b.total_xp - a.total_xp);
      friendsWithStats.forEach((friend, index) => {
        friend.rank = index + 1;
      });

      setFriendsStats(friendsWithStats);
    } catch (error) {
      console.error('Error fetching friends stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (friend: FriendStats) => {
    return friend.display_name || friend.username || 'Anonymous User';
  };

  const getRankBadge = (rank: number, isCurrentUser: boolean) => {
    if (rank === 1) {
      return <Badge className="bg-warning text-warning-foreground">👑 #1</Badge>;
    }
    if (isCurrentUser) {
      return <Badge variant="secondary">You #{rank}</Badge>;
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Leaderboard
          </CardTitle>
          <CardDescription>Compare your progress with friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (friendsStats.length <= 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Leaderboard
          </CardTitle>
          <CardDescription>Compare your progress with friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
            <p className="text-muted-foreground text-sm">
              Add friends from the leaderboard to see friendly competition here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends Leaderboard
        </CardTitle>
        <CardDescription>Compare your progress with friends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {friendsStats.map((friend) => {
            const isCurrentUser = friend.user_id === user?.id;
            return (
              <div
                key={friend.user_id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-accent/20'
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={friend.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{getDisplayName(friend)}</h4>
                    {getRankBadge(friend.rank, isCurrentUser)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      <span>{friend.total_xp} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-streak" />
                      <span>{friend.current_streak} days</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsLeaderboard;
