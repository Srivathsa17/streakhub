import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Target, Trophy, MessageCircle, Zap, BarChart3 } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Daily Streak Tracking",
      description: "Log your coding activity every day and watch your streak grow. Visual calendar shows your consistency journey."
    },
    {
      icon: <Target className="h-8 w-8 text-streak" />,
      title: "Goal Setting & Progress",
      description: "Set personal coding goals and track your progress. Earn bonus XP for achieving milestones."
    },
    {
      icon: <Trophy className="h-8 w-8 text-warning" />,
      title: "Leaderboards & Levels",
      description: "Compete with other developers and climb the rankings. Unlock levels and badges as you progress."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-info" />,
      title: "Community Chat",
      description: "Connect with fellow developers, share tips, and stay motivated together in our community chatroom."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "XP & Gamification",
      description: "Earn experience points for daily activity and goal completion. Level up your coding journey!"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-streak" />,
      title: "Progress Analytics",
      description: "Detailed insights into your coding habits and progress over time with beautiful charts and statistics."
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to 
            <span className="gradient-primary bg-clip-text text-transparent"> Stay Consistent</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            StreakHub combines powerful tracking tools with social motivation to help you build lasting coding habits.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="gradient-card border-border/50 hover:border-primary/50 transition-smooth group hover:-translate-y-1"
            >
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-bounce">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;