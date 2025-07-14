import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="order-2 md:order-1">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                <Medal className="h-8 w-8 text-muted-foreground" />
              </div>
              <Badge variant="secondary" className="mx-auto">2nd Place</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <h3 className="font-semibold text-lg">Coming Soon</h3>
              <p className="text-sm text-muted-foreground">0 XP</p>
              <p className="text-xs text-muted-foreground mt-1">0 day streak</p>
            </CardContent>
          </Card>

          <Card className="order-1 md:order-2 transform md:scale-110 border-warning">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto bg-warning/20 rounded-full flex items-center justify-center mb-2">
                <Trophy className="h-10 w-10 text-warning" />
              </div>
              <Badge variant="secondary" className="mx-auto bg-warning text-warning-foreground">Champion</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <h3 className="font-semibold text-xl">Be the First!</h3>
              <p className="text-sm text-muted-foreground">0 XP</p>
              <p className="text-xs text-muted-foreground mt-1">0 day streak</p>
            </CardContent>
          </Card>

          <Card className="order-3">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <Badge variant="secondary" className="mx-auto">3rd Place</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <h3 className="font-semibold text-lg">Coming Soon</h3>
              <p className="text-sm text-muted-foreground">0 XP</p>
              <p className="text-xs text-muted-foreground mt-1">0 day streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
            <CardDescription>
              Rankings are updated in real-time based on total XP earned
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;