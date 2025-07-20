
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Github, Linkedin, Instagram, UserPlus, UserCheck, Flame, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

interface PublicProfileDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PublicProfileDialog = ({ profile, open, onOpenChange }: PublicProfileDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked'>('none');
  const [userStats, setUserStats] = useState({ totalXP: 0, currentStreak: 0 });

  useEffect(() => {
    if (open && profile.user_id && user) {
      fetchFriendStatus();
      fetchUserStats();
    }
  }, [open, profile.user_id, user]);

  const fetchFriendStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('status')
        .or(`and(user_id.eq.${user.id},friend_user_id.eq.${profile.user_id}),and(user_id.eq.${profile.user_id},friend_user_id.eq.${user.id})`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching friend status:', error);
        return;
      }

      setFriendStatus(data?.status || 'none');
    } catch (error) {
      console.error('Error fetching friend status:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data: totalXPData, error: xpError } = await supabase
        .rpc('get_user_total_xp', { target_user_id: profile.user_id });

      const { data: streakData, error: streakError } = await supabase
        .rpc('get_user_current_streak', { target_user_id: profile.user_id });

      if (xpError) console.error('Error fetching XP:', xpError);
      if (streakError) console.error('Error fetching streak:', streakError);

      setUserStats({
        totalXP: totalXPData || 0,
        currentStreak: streakData || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleFriendRequest = async () => {
    if (!user || profile.user_id === user.id) return;

    setLoading(true);
    try {
      if (friendStatus === 'none') {
        const { error } = await supabase
          .from('friends')
          .insert({
            user_id: user.id,
            friend_user_id: profile.user_id,
            status: 'pending'
          });

        if (error) throw error;
        setFriendStatus('pending');
        toast({
          title: "Friend request sent!",
          description: `You've sent a friend request to ${getDisplayName()}.`,
        });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    return profile.display_name || profile.username || 'Anonymous User';
  };

  const getFriendButtonContent = () => {
    switch (friendStatus) {
      case 'accepted':
        return (
          <>
            <UserCheck className="h-4 w-4 mr-2" />
            Friends
          </>
        );
      case 'pending':
        return (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Request Sent
          </>
        );
      default:
        return (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{getDisplayName()}</h3>
              {profile.username && profile.display_name && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>
            {user && profile.user_id !== user.id && (
              <Button
                onClick={handleFriendRequest}
                disabled={loading || friendStatus === 'accepted' || friendStatus === 'pending'}
                variant={friendStatus === 'accepted' ? 'secondary' : 'default'}
              >
                {getFriendButtonContent()}
              </Button>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="font-medium mb-2">About</h4>
              <p className="text-muted-foreground text-sm">{profile.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  <span className="font-semibold">Total XP</span>
                </div>
                <p className="text-2xl font-bold">{userStats.totalXP}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-streak" />
                  <span className="font-semibold">Streak</span>
                </div>
                <p className="text-2xl font-bold">{userStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h4 className="font-medium">Social Links</h4>
            <div className="flex flex-wrap gap-2">
              {profile.github_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
              {profile.linkedin_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {profile.instagram_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </a>
                </Button>
              )}
              {!profile.github_url && !profile.linkedin_url && !profile.instagram_url && (
                <p className="text-muted-foreground text-sm">No social links added</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublicProfileDialog;
