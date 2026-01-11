import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sync user on refresh
  useEffect(() => {
    const syncAuthState = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name,
        });
      }
    };

    syncAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.user_metadata?.name,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // const signup = async (name: string, email: string, password: string) => {
  //   setLoading(true);
  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: { data: { name } },
  //   });

  //   if (error) {
  //     setLoading(false);
  //     toast.error(error.message);
  //     throw new Error(error.message);
  //   }

  //   if (data.user) {
  //     await supabase.from("profiles").insert({
  //       id: data.user.id,
  //       name,
  //     });
  //     toast.success(
  //       "Signup successful \nCheck your inbox to verify your email."
  //     );
  //   }

  //   setLoading(false);
  //   navigate("/auth/login");
  // };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        name,
        email, // 👈 ADD THIS
      });
      toast.success("Signup successful \nCheck your inbox for verification!");
    }

    setLoading(false);
    navigate("/auth/login");
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast.error("Incorrect email or password");
      throw new Error(error.message);
    }

    toast.success("Logged in \nWelcome back, ${data.user.name}!");
    setLoading(false);
    navigate("/dashboard");
  };

  const googleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      throw new Error(error.message);
    }
    toast.info("Logged in with Google \nWelcome, ${mockUser.name}!");
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    toast.success("Logged out \nYou have successfully logged out");
    setLoading(false);
    navigate("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        googleLogin,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
