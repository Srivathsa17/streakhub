
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Target, Plus, Loader2, Clock, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIGoal {
  title: string;
  description: string;
  xp_reward: number;
  estimated_days: number;
  category: string;
  difficulty: string;
}

interface AIResponse {
  goals: AIGoal[];
  analysis: string;
}

interface AIGoalPlannerProps {
  userProfile: {
    totalXP: number;
    currentStreak: number;
  };
  currentGoals: any[];
  onGoalCreated: () => void;
}

const AIGoalPlanner = ({ userProfile, currentGoals, onGoalCreated }: AIGoalPlannerProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIResponse | null>(null);
  const [creatingGoals, setCreatingGoals] = useState<Set<number>>(new Set());

  const analyzeAndSuggestGoals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('analyze-goals', {
        body: {
          userProfile,
          currentGoals,
          preferences: {
            languages: 'JavaScript, TypeScript, React, Python',
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setAiSuggestions(response.data);
      toast.success('AI analysis complete! Check out your personalized goals below.');
    } catch (error) {
      console.error('Error analyzing goals:', error);
      toast.error('Failed to analyze goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createGoalFromSuggestion = async (goal: AIGoal, index: number) => {
    if (!user) return;

    setCreatingGoals(prev => new Set(prev).add(index));
    
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + goal.estimated_days);

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goal.title,
          description: goal.description,
          xp_reward: goal.xp_reward,
          target_date: targetDate.toISOString().split('T')[0],
          completed: false
        });

      if (error) throw error;

      toast.success('Goal created successfully!');
      onGoalCreated();
      
      // Remove this goal from suggestions
      setAiSuggestions(prev => {
        if (!prev) return null;
        return {
          ...prev,
          goals: prev.goals.filter((_, i) => i !== index)
        };
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal. Please try again.');
    } finally {
      setCreatingGoals(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'frontend':
        return '🎨';
      case 'backend':
        return '⚙️';
      case 'devops':
        return '🚀';
      case 'data structures':
        return '📊';
      case 'algorithms':
        return '🧮';
      default:
        return '💻';
    }
  };

  return (
    <Card className="jetbrains-card shadow-2xl border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Goal Planner
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Powered by Gemini AI</span>
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-base">
          Get personalized coding goals based on your progress and skill level
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!aiSuggestions ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready for AI-Powered Goals?</h3>
            <p className="text-muted-foreground mb-6">
              Let our AI analyze your coding journey and suggest personalized goals to accelerate your growth.
            </p>
            <Button 
              onClick={analyzeAndSuggestGoals}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Your Profile...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Goals
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Analysis
              </h4>
              <p className="text-sm text-muted-foreground">{aiSuggestions.analysis}</p>
            </div>

            {/* Suggested Goals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Suggested Goals ({aiSuggestions.goals.length})
                </h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={analyzeAndSuggestGoals}
                  disabled={loading}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>

              {aiSuggestions.goals.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">All suggested goals have been added!</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={analyzeAndSuggestGoals}
                  >
                    Generate New Suggestions
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {aiSuggestions.goals.map((goal, index) => (
                    <Card key={index} className="jetbrains-card border-accent hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(goal.category)}</span>
                            <h5 className="font-semibold">{goal.title}</h5>
                          </div>
                          <Badge variant="outline" className={getDifficultyColor(goal.difficulty)}>
                            {goal.difficulty}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {goal.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3 text-warning" />
                              <span>{goal.xp_reward} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{goal.estimated_days} days</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {goal.category}
                            </Badge>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => createGoalFromSuggestion(goal, index)}
                            disabled={creatingGoals.has(index)}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                          >
                            {creatingGoals.has(index) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Goal
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIGoalPlanner;
