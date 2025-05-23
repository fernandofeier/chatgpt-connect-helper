
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/chat";

export function useUserRole() {
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          setUserRole('user'); // Default to user if error
        } else {
          setUserRole(profile?.role || 'user');
          setProfile(profile);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    userRole,
    profile,
    loading,
    isAdmin: userRole === 'admin'
  };
}
