
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

        // Buscar perfil do usuário
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          if (error) {
            console.error("Error fetching user profile:", error);
            // Em caso de erro, assumir usuário comum mas não desconectar
            setUserRole('user');
            setProfile(null);
          } else if (profile) {
            setUserRole(profile.role || 'user');
            setProfile(profile);
          } else {
            // Perfil não existe ainda, criar um padrão
            setUserRole('user');
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        if (mounted) {
          // Em caso de erro, assumir usuário comum
          setUserRole('user');
          setProfile(null);
          setLoading(false);
        }
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Aguardar um pouco para evitar conflitos
        setTimeout(() => {
          fetchUserRole();
        }, 500);
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
