import { Button } from "@/components/ui/button";
import { Code, Zap, Trophy, Users } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-background/80" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build Your
            <span className="gradient-primary bg-clip-text text-transparent block">
              Coding Streak
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Track your daily coding progress, set meaningful goals, and stay motivated 
            with a community of passionate developers.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="flex flex-col items-center p-4 rounded-lg gradient-card border border-border/50">
              <Code className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Daily Tracking</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg gradient-card border border-border/50">
              <Zap className="h-8 w-8 text-streak mb-2" />
              <span className="text-sm font-medium">Streak Rewards</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg gradient-card border border-border/50">
              <Trophy className="h-8 w-8 text-warning mb-2" />
              <span className="text-sm font-medium">Leaderboards</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg gradient-card border border-border/50">
              <Users className="h-8 w-8 text-info mb-2" />
              <span className="text-sm font-medium">Community</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Start Your Journey
            </Button>
            <Button variant="outline" size="xl">
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">1,247</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-streak">89,230</div>
              <div className="text-sm text-muted-foreground">Total Streaks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-warning">456</div>
              <div className="text-sm text-muted-foreground">Days Record</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-streak/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-info/20 rounded-full blur-xl animate-pulse delay-500" />
    </section>
  );
};

export default Hero;