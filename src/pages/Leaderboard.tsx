
import GlossyNavbar from '@/components/GlossyNavbar';
import PremiumLeaderboard from '@/components/PremiumLeaderboard';

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <GlossyNavbar />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <PremiumLeaderboard />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
