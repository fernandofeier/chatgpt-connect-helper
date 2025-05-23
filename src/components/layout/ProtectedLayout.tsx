
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MainRoutes } from "./MainRoutes";

export function ProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setIsAuthenticated(!!session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <ThemeToggle />
          </div>
          <MainRoutes />
        </main>
      </div>
    </SidebarProvider>
  );
}
