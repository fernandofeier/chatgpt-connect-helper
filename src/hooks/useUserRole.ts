
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/chat";

export function useUserRole() {
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (mounted) {
            setUserRole(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          if (error) {
            console.error("Error fetching user profile:", error);
            setUserRole('user'); // Default to user if error
            setProfile(null);
          } else if (profile) {
            setUserRole(profile.role || 'user');
            setProfile(profile);
          } else {
            // Profile doesn't exist yet, default to user
            setUserRole('user');
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        if (mounted) {
          setUserRole('user');
          setProfile(null);
          setLoading(false);
        }
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Defer profile fetching to avoid deadlocks
        setTimeout(() => {
          fetchUserRole();
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUserRole(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    userRole,
    profile,
    loading,
    isAdmin: userRole === 'admin'
  };
}
