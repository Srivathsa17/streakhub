import { Button } from "@/components/ui/button";
import { Code2, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleSignUp = () => {
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">StreakHub</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
              Features
            </a>
            <button 
              onClick={() => navigate('/leaderboard')} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              Leaderboard
            </button>
            <button 
              onClick={() => navigate('/community')} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              Community
            </button>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-smooth">
              About
            </a>
          </div>
          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" onClick={handleLogin}>
              Log In
            </Button>
            <Button variant="hero" onClick={handleSignUp}>
              Sign Up
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              <a href="#features" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth">
                Features
              </a>
              <button 
                onClick={() => navigate('/leaderboard')} 
                className="px-4 py-2 text-left text-muted-foreground hover:text-foreground transition-smooth"
              >
                Leaderboard
              </button>
              <button 
                onClick={() => navigate('/community')} 
                className="px-4 py-2 text-left text-muted-foreground hover:text-foreground transition-smooth"
              >
                Community
              </button>
              <a href="#about" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth">
                About
              </a>
              <div className="flex flex-col space-y-2 px-4 pt-2">
                <Button variant="ghost" className="justify-start" onClick={handleLogin}>
                  Log In
                </Button>
                <Button variant="hero" className="justify-start" onClick={handleSignUp}>
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;