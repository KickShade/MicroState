import { useState } from "react";
import AnimatedChartBackground from "@/components/AnimatedChartBackground";
import { TrendingUp, BarChart3, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [hoveredButton, setHoveredButton] = useState<null | "signup" | "login">(null);
  const navigate = useNavigate()

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
            <span>Order Book Analytics Platform</span>
          </div>
          
          {/* Hero Title */}
          <h1 className="font-display text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
            <span className="text-glow bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Microstate
            </span>
          </h1>
          
          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Analyze real-time order book dynamics to understand liquidity, imbalance, and short-horizon market behavior.
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
            <button
              onMouseEnter={() => setHoveredButton("signup")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                backgroundColor: hoveredButton === "login" ? "hsl(160 84% 39%)" : hoveredButton === "signup" ? "transparent" : "hsl(160 84% 39%)",
                color: hoveredButton === "login" ? "hsl(222 84% 5%)" : hoveredButton === "signup" ? "hsl(160 84% 39%)" : "hsl(222 84% 5%)",
                borderColor: "hsl(160 84% 39%)",
                transition: "all 300ms ease",
              }}
              onClick={() => navigate('/auth/signup')}
              className="px-8 py-3 rounded-lg border-2 font-semibold text-lg"
            >
              Sign Up
            </button>
            <button
              onMouseEnter={() => setHoveredButton("login")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                backgroundColor: hoveredButton === "signup" ? "hsl(160 84% 39%)" : hoveredButton === "login" ? "transparent" : "transparent",
                color: hoveredButton === "signup" ? "hsl(222 84% 5%)" : hoveredButton === "login" ? "hsl(160 84% 39%)" : "hsl(160 84% 39%)",
                borderColor: "hsl(160 84% 39%)",
                transition: "all 300ms ease",
              }}
              onClick={() => navigate('/auth/login')}
              className="px-8 py-3 rounded-lg border-2 font-semibold text-lg"
            >
              Log In
            </button>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 border-t border-border/30 pt-10">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">70%</div>
              <div className="mt-1 text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">150+</div>
              <div className="mt-1 text-sm text-muted-foreground">Active Users</div>
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