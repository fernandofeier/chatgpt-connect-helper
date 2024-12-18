import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          navigate("/");
        }
        if (event === 'SIGNED_OUT') {
          navigate("/login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-inter font-semibold text-[#3B3B3B] mb-8 text-center">
          Bem-vindo ao ChatGPT
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
                button_label: "Entrar",
                loading_button_label: "Entrando...",
                social_provider_text: "Entrar com {{provider}}",
                link_text: "Já tem uma conta? Entre",
              },
              sign_up: {
                email_label: "Email",
                password_label: "Senha",
                button_label: "Cadastrar",
                loading_button_label: "Cadastrando...",
                social_provider_text: "Cadastrar com {{provider}}",
                link_text: "Não tem uma conta? Cadastre-se",
              },
              magic_link: {
                email_input_label: "Email",
                button_label: "Enviar link mágico",
                loading_button_label: "Enviando link mágico...",
                link_text: "Enviar link mágico para email",
              },
              forgotten_password: {
                email_label: "Email",
                button_label: "Enviar instruções",
                loading_button_label: "Enviando instruções...",
                link_text: "Esqueceu sua senha?",
              },
            },
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;