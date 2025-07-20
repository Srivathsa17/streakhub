
import { useState, useEffect } from 'react';
import { Bell, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FriendRequest {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: string;
  created_at: string;
  requester: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const FriendRequestNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_user_id,
          status,
          created_at,
          requester:profiles!friends_user_id_fkey(
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('friend_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friend requests:', error);
        return;
      }

      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setLoading(true);
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Friend request accepted!",
          description: "You're now friends!",
        });
      } else {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Friend request declined",
          description: "The request has been removed.",
        });
      }

      // Refresh the list
      await fetchFriendRequests();
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast({
        title: "Error",
        description: "Failed to process friend request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (requester: FriendRequest['requester']) => {
    return requester.display_name || requester.username || 'Anonymous User';
  };

  if (friendRequests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Friend Requests
          <Badge variant="secondary">{friendRequests.length}</Badge>
        </CardTitle>
        <CardDescription>
          You have pending friend requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {friendRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-4 p-3 bg-accent/20 rounded-lg"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={request.requester.avatar_url || ''} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h4 className="font-medium">{getDisplayName(request.requester)}</h4>
                <p className="text-sm text-muted-foreground">wants to be your friend</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleFriendRequest(request.id, 'accept')}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFriendRequest(request.id, 'decline')}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendRequestNotifications;
