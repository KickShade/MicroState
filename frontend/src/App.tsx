// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Index from "./pages/Index";
// import NotFound from "./pages/NotFound";
// import AuthPages from "./pages/auth";
// import Dashboard from "./pages/dashboard";
// import { AuthProvider } from "./context/AuthContext";
// import { GoogleOAuthProvider } from "@react-oauth/google";
// import ProtectedRoute from "./components/ProtectedRoute";

// // AUTH ROUTES
// import ForgotPassword from "./pages/auth/ForgotPassword";
// import ResetPassword from "./pages/auth/ResetPassword";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <GoogleOAuthProvider clientId="300692240172-29a3apgi0koe2brdqvk88d1s9ncq9meo.apps.googleusercontent.com">
//           <AuthProvider>
//             <Routes>
//               <Route path="/" element={<Index />} />

//               <Route
//                 path="/auth/signup"
//                 element={<AuthPages initialMode="signup" />}
//               />
//               <Route
//                 path="/auth/login"
//                 element={<AuthPages initialMode="login" />}
//               />

//               {/* 🔥 AUTH RELATED */}
//               <Route
//                 path="/auth/forgot-password"
//                 element={<ForgotPassword />}
//               />
//               <Route path="/auth/reset-password" element={<ResetPassword />} />

//               {/* 🔐 PROTECTED DASHBOARD */}
//               <Route
//                 path="/dashboard"
//                 element={
//                   <ProtectedRoute>
//                     <Dashboard />
//                   </ProtectedRoute>
//                 }
//               />

//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </AuthProvider>
//         </GoogleOAuthProvider>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPages from "./pages/auth";
import Dashboard from "./pages/dashboard";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AuthCallback from "./pages/AuthCallBack";

const queryClient = new QueryClient();

const App = () => (
  <>
    <Toaster richColors position="top-center" /> {/* 👑 Standalone at root */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <GoogleOAuthProvider clientId="300692240172-29a3apgi0koe2brdqvk88d1s9ncq9meo.apps.googleusercontent.com">
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/auth/signup"
                  element={<AuthPages initialMode="signup" />}
                />
                <Route
                  path="/auth/login"
                  element={<AuthPages initialMode="login" />}
                />
                <Route
                  path="/auth/forgot-password"
                  element={<ForgotPassword />}
                />
                <Route
                  path="/auth/reset-password"
                  element={<ResetPassword />}
                />
                <Route 
                path="/auth/callback" 
                element={<AuthCallback />} 
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </GoogleOAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </>
);

export default App;
