
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, ArrowLeft, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load messages on component mount
  useEffect(() => {
    loadMessages();
    
    // Set up realtime subscription for messages
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('New message received:', payload);
        loadMessages(); // Reload all messages to get profile info
      })
      .subscribe();

    // Set up presence tracking for online users
    const presenceChannel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Presence sync:', state);
        setOnlineUsers(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presenceChannel.track({
            user_id: user.id,
            email: user.email,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  const loadMessages = async () => {
    try {
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return;
      }
      
      if (!messagesData) {
        setMessages([]);
        return;
      }

      // Then get profiles for each unique user_id
      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Combine messages with profiles
      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profiles: profilesData?.find(profile => profile.user_id === msg.user_id) || null
      }));
      
      console.log('Loaded messages with profiles:', messagesWithProfiles);
      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error in loadMessages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message: message.trim(),
          user_id: user.id
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (msg: Message) => {
    if (msg.profiles?.display_name) return msg.profiles.display_name;
    if (msg.profiles?.username) return msg.profiles.username;
    return msg.user_id.slice(0, 8);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                className="hover:bg-accent/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Community Chat</h1>
                  <p className="text-sm text-muted-foreground">Connect with fellow developers</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Users className="h-4 w-4 mr-2" />
              {onlineUsers} online
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="h-[calc(100vh-240px)] flex flex-col shadow-lg border-border/50">
          {/* Messages Area */}
          <CardContent className="flex-1 p-0">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Start the Conversation</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Be the first to share your coding progress and motivate others in the community!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex gap-4 group hover:bg-accent/20 -mx-3 px-3 py-3 rounded-xl transition-all duration-200">
                        <Avatar className="w-10 h-10 border-2 border-border/30">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                            {getUserDisplayName(msg).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-foreground">
                              {getUserDisplayName(msg)}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed break-words">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="border-t border-border/50 p-6">
                {user ? (
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      placeholder="Share your thoughts with the community..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 h-12 text-base"
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      variant="default" 
                      disabled={!message.trim() | loading}
                      className="px-6 h-12"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                ) : (
                  <div className="text-center p-6 bg-muted/30 rounded-xl">
                    <p className="text-muted-foreground mb-4 text-lg">
                      Join the conversation
                    </p>
                    <Button variant="default" onClick={() => navigate('/auth')} className="px-8">
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card className="mt-8 shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground/80">Be respectful and supportive of fellow developers</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground/80">Share your coding progress and celebrate achievements</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground/80">Ask questions and help others when you can</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-foreground/80">Keep discussions relevant to coding and programming</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Community;
