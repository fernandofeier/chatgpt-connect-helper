
import { useEffect } from 'react';
import './App.css';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import { MainRoutes } from './components/layout/MainRoutes';
import { initDatabase } from './integrations/supabase/dbSetup';

function App() {
  useEffect(() => {
    // Initialize database setup
    initDatabase();
  }, []);
  
  return (
    <ThemeProvider>
      <MainRoutes />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
