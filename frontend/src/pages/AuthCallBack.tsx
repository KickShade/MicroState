// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../lib/supabaseClient';

// export default function AuthCallback() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleCallback = async () => {
//       try {
//         const { data, error } = await supabase.auth.getSession();

//         if (error) throw error;

//         if (data.session?.user) {
//           const user = data.session.user;
//           const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

//           // Store name in profiles table
//           await supabase.from('profiles').upsert({
//             id: user.id,
//             email: user.email,
//             name: name,
//           });

//           navigate('/dashboard');
//         } else {
//           navigate('/auth/login');
//         }
//       } catch (err) {
//         console.error('Callback error:', err);
//         navigate('/auth/login');
//       }
//     };

//     handleCallback();
//   }, [navigate]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//       <p className="text-white text-lg">Authenticating...</p>
//     </div>
//   );
// }

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session?.user) {
          const user = data.session.user;

          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User";

          // Store name in DB
          await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email,
            name: name,
          });

          // ⭐ TOASTS
          toast.success(`Logged in with Google \n Welcome, ${name}!`);

          // Send to dashboard
          navigate("/dashboard");
        } else {
          navigate("/auth/login");
        }
      } catch (err) {
        console.error("Callback error:", err);
        toast.error("Google authentication failed!");
        navigate("/auth/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <p className="text-white text-lg animate-pulse">Authenticating...</p>
    </div>
  );
}
