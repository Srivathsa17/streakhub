import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // TODO: Implement actual message sending
    console.log('Sending message:', message);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Community Chat</h1>
          <Badge variant="secondary" className="ml-auto">
            <Users className="h-3 w-3 mr-1" />
            0 online
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              General Chat
            </CardTitle>
            <CardDescription>
              Connect with fellow developers and share your coding journey
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 border rounded-lg p-4 mb-4 bg-muted/30 overflow-y-auto">
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Start the Conversation</h3>
                <p className="text-muted-foreground">
                  Be the first to share your coding progress and motivate others!
                </p>
              </div>
            </div>
            
            {/* Message Input */}
            {user ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="hero" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-2">
                  Sign in to join the conversation
                </p>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Be respectful and supportive of fellow developers</li>
              <li>• Share your coding progress and celebrate others' achievements</li>
              <li>• Ask questions and help others when you can</li>
              <li>• Keep discussions relevant to coding and programming</li>
              <li>• No spam, self-promotion, or inappropriate content</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Community;