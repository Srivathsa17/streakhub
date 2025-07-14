
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, ArrowLeft, Hash, Code2 } from 'lucide-react';
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
        loadMessages();
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
      // Get messages
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

      // Get profiles for each unique user_id
      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
      
      if (userIds.length === 0) {
        setMessages(messagesData.map(msg => ({ ...msg, profiles: null })));
        return;
      }

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
    if (!msg.profiles) {
      // Fallback to email if no profile found
      return user?.email?.split('@')[0] || 'Anonymous';
    }
    
    if (msg.profiles.display_name) return msg.profiles.display_name;
    if (msg.profiles.username) return msg.profiles.username;
    return 'Anonymous';
  };

  const getUserInitials = (msg: Message) => {
    const displayName = getUserDisplayName(msg);
    return displayName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JetBrains-inspired Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Community</h1>
                  <p className="text-xs text-muted-foreground">Developer discussions</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1 border-border">
              <Users className="h-3 w-3 mr-2" />
              <span className="text-foreground">{onlineUsers} online</span>
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 max-w-5xl">
        <Card className="h-[calc(100vh-180px)] flex flex-col bg-card border-border">
          {/* Messages Area */}
          <CardContent className="flex-1 p-0">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 bg-card">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-accent/20 rounded-lg p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-foreground">Start the conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Share your coding journey and connect with fellow developers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex gap-3 group hover:bg-accent/30 -mx-3 px-3 py-2 rounded-lg transition-colors">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getUserInitials(msg)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {getUserDisplayName(msg)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 break-words leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="border-t border-border p-4 bg-card">
                {user ? (
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 bg-background border-border focus:border-primary"
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim() || loading}
                      size="sm"
                      className="px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <div className="text-center p-4 bg-accent/20 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Sign in to join the conversation
                    </p>
                    <Button size="sm" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Code2 className="h-4 w-4 text-primary" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Be respectful and supportive",
                "Share your coding progress", 
                "Ask questions and help others",
                "Keep discussions coding-related"
              ].map((guideline, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg border border-border/50">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-foreground/80">{guideline}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Community;
