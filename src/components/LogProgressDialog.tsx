
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus } from 'lucide-react';

interface LogProgressDialogProps {
  onSuccess?: () => void;
}

const LogProgressDialog = ({ onSuccess }: LogProgressDialogProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('streaks')
        .insert({
          user_id: user.id,
          description: description.trim(),
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Progress logged!",
        description: "Your coding streak has been updated.",
      });

      setDescription('');
      setOpen(false);
      onSuccess?.();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Log Today's Progress
        </Button>
      </DialogTrigger>
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
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !description.trim()}
              className="flex-1"
            >
              {loading ? 'Logging...' : 'Log Progress'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogProgressDialog;
