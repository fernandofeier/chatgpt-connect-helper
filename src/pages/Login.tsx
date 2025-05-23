
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session) {
            navigate("/", { replace: true });
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_IN' && session) {
            navigate("/", { replace: true });
          } else if (event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-inter font-semibold text-[#3B3B3B] dark:text-white mb-8 text-center">
          Bem-vindo ao ByChat
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#146EF5",
                  brandAccent: "#0E5AD5",
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Senha",
                email_input_placeholder: "Seu e-mail",
                password_input_placeholder: "Sua senha",
                button_label: "Entrar",
                loading_button_label: "Entrando...",
                social_provider_text: "Entrar com {{provider}}",
              },
            },
          }}
          view="sign_in"
          showLinks={false}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;
