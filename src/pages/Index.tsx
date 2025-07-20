
import GlossyNavbar from "@/components/GlossyNavbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <GlossyNavbar />
      <div className="pt-16">
        <Hero />
        <Features />
      </div>
    </div>
  );
};

export default Index;
