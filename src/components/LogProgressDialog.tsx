
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';

interface LogProgressDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const LogProgressDialog = ({ open = false, onOpenChange, onSuccess }: LogProgressDialogProps) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim()) return;

    setLoading(true);
    console.log('Logging progress for user:', user.id, 'description:', description.trim());

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Use upsert to handle duplicate entries gracefully
      const { data, error } = await supabase
        .from('streaks')
        .upsert({
          user_id: user.id,
          date: today,
          description: description.trim(),
          xp_earned: 10
        }, {
          onConflict: 'user_id,date'
        })
        .select();

      if (error) {
        console.error('Error logging progress:', error);
        throw error;
      }

      console.log('Progress logged successfully:', data);

      toast({
        title: "Progress logged!",
        description: "Your coding streak has been updated. +10 XP earned!",
      });

      setDescription('');
      onOpenChange?.(false);
      
      // Call the success callback to refresh dashboard data
      if (onSuccess) {
        console.log('Calling onSuccess callback to refresh data');
        onSuccess();
      }
    } catch (error) {
      console.error('Error logging progress:', error);
      toast({
        title: "Error",
        description: "Failed to log progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Log Your Progress
          </DialogTitle>
          <DialogDescription>
            What did you work on today? Keep your streak alive!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Describe what you coded today..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 bg-background border-border focus:border-primary"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !description.trim()}
              className="flex-1"
            >
              {loading ? 'Logging...' : 'Log Progress (+10 XP)'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogProgressDialog;
