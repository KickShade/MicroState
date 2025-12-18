import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPages from "./pages/auth";
import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GoogleOAuthProvider clientId="300692240172-29a3apgi0koe2brdqvk88d1s9ncq9meo.apps.googleusercontent.com">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/signup" element={<AuthPages initialMode="signup" />} />
            <Route path="/auth/login" element={<AuthPages initialMode="login" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GoogleOAuthProvider>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
