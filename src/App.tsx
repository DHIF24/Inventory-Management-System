import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { TransactionsView } from './components/TransactionsView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { Package } from 'lucide-react';

const AppShell: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { loadingData } = useData();

  // ROUTER HASH LISTENERS
  const getTabFromHash = (): string => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validTabs = ['dashboard', 'products', 'transactions', 'categories', 'reports', 'settings'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(getTabFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: string) => {
    window.location.hash = `#/${tab}`;
    setCurrentTab(tab);
  };

  // Cold boot theme config
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark mode industriel
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(56,189,248,0.3)]">
          <Package className="w-6 h-6 text-slate-900 stroke-[2.5]" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-sky-450 animate-pulse">AUTORISATION INVENTRAK EN COURS...</p>
      </div>
    );
  }

  // Guard path - Show login if not authenticated
  if (!currentUser) {
    return <LoginView />;
  }

  // Render core views matched to tab choice
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'categories':
        return <CategoriesView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      
      {/* Sidebar fixed panels */}
      <Sidebar currentTab={currentTab} onChangeTab={handleTabChange} />

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 md:ml-64 p-6 min-h-screen relative overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full h-full max-w-7xl mx-auto"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppShell />
      </DataProvider>
    </AuthProvider>
  );
}
