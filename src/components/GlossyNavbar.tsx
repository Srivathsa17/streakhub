
import { Button } from "@/components/ui/button";
import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const GlossyNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleSignUp = () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5"></div>
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => navigate(user ? '/dashboard' : '/')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              StreakHub
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Button 
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  onClick={() => navigate('/dashboard')}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  Dashboard
                </Button>
                <Button 
                  variant={isActive('/leaderboard') ? 'default' : 'ghost'}
                  onClick={() => navigate('/leaderboard')}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  Leaderboard
                </Button>
                <Button 
                  variant={isActive('/community') ? 'default' : 'ghost'}
                  onClick={() => navigate('/community')}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  Community
                </Button>
                <Button 
                  variant={isActive('/profile') ? 'default' : 'ghost'}
                  onClick={() => navigate('/profile')}
                  className="transition-all duration-200 hover:bg-primary/10"
                >
                  Profile
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-primary/20 hover:bg-primary/10 transition-all duration-200"
              >
                Logout
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleLogin}
                  className="hover:bg-primary/10 transition-all duration-200"
                >
                  Log In
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleSignUp}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-primary/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 backdrop-blur-xl">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <Button 
                    variant={isActive('/dashboard') ? 'default' : 'ghost'}
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant={isActive('/leaderboard') ? 'default' : 'ghost'}
                    onClick={() => {
                      navigate('/leaderboard');
                      setIsMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    Leaderboard
                  </Button>
                  <Button 
                    variant={isActive('/community') ? 'default' : 'ghost'}
                    onClick={() => {
                      navigate('/community');
                      setIsMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    Community
                  </Button>
                  <Button 
                    variant={isActive('/profile') ? 'default' : 'ghost'}
                    onClick={() => {
                      navigate('/profile');
                      setIsMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="justify-start border-primary/20"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <a href="#features" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth">
                    Features
                  </a>
                  <button 
                    onClick={() => {
                      navigate('/leaderboard');
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-left text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    Leaderboard
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/community');
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-left text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    Community
                  </button>
                  <a href="#about" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth">
                    About
                  </a>
                  <div className="flex flex-col space-y-2 px-4 pt-2">
                    <Button 
                      variant="ghost" 
                      className="justify-start" 
                      onClick={() => {
                        handleLogin();
                        setIsMenuOpen(false);
                      }}
                    >
                      Log In
                    </Button>
                    <Button 
                      variant="default" 
                      className="justify-start bg-gradient-to-r from-primary to-secondary" 
                      onClick={() => {
                        handleSignUp();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default GlossyNavbar;
