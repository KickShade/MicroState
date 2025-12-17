import { Button } from "@/components/ui/button";
import AnimatedChartBackground from "@/components/AnimatedChartBackground";
import { TrendingUp, BarChart3, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Animated chart background */}
      <AnimatedChartBackground />
      
      {/* Content - must have higher z-index than canvas */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
            <TrendingUp className="h-4 w-4" />
            <span>Smart Trading Platform</span>
          </div>
          
          {/* Hero Title */}
          <h1 className="font-display text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
            <span className="text-glow bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Microstate
            </span>
          </h1>
          
          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Empower your trading journey with real-time market insights, advanced analytics, 
            and intelligent algorithms. Trade smarter, not harder.
          </p>
          
          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              Real-time Analytics
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <Shield className="h-4 w-4 text-primary" />
              Bank-grade Security
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              AI-powered Insights
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="hero" size="xl">
              Sign Up
            </Button>
            <Button variant="hero-outline" size="xl">
              Log In
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 border-t border-border/30 pt-10">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">$2.4B+</div>
              <div className="mt-1 text-sm text-muted-foreground">Trading Volume</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">150K+</div>
              <div className="mt-1 text-sm text-muted-foreground">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">99.9%</div>
              <div className="mt-1 text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
