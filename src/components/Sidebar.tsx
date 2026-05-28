import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Tag, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onChangeTab }) => {
  const { userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'transactions', label: 'Mouvements', icon: TrendingUp },
    { id: 'categories', label: 'Catégories', icon: Tag },
    { id: 'reports', label: 'Rapports & Analyses', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    onChangeTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-900 stroke-[2]" />
          </div>
          <span className="font-heading font-bold text-lg text-slate-100 uppercase tracking-tight">INVEN<span className="text-sky-500">TRAK</span></span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Slide-out Sidebar for mobile & fixed for desktop */}
      <AnimatePresence>
        {(isOpen || true) && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-950 border-r border-slate-800 text-slate-300 z-50 flex flex-col justify-between
              ${isOpen ? 'block' : 'hidden md:flex'} md:translate-x-0`}
          >
            <div>
              {/* App Brand Header */}
              <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/40">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                    <Package className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                  </div>
                  <span className="font-heading font-extrabold text-xl tracking-tight text-slate-100 uppercase">
                    INVEN<span className="text-sky-400">TRAK</span>
                  </span>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium tracking-wide transition-all duration-200 group relative
                        ${isActive 
                          ? 'bg-gradient-to-r from-sky-500/10 to-transparent text-sky-400 border-l-4 border-sky-400 font-semibold' 
                          : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 
                        ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'}`} 
                      />
                      <span className="font-sans text-[14px]">{item.label}</span>
                      
                      {isActive && (
                        <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Session Info Header / Logout */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/20">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{userProfile?.name || 'Inventaire'}</p>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                      {userProfile?.role === 'admin' ? 'Co-Administrateur' : 'Gestionnaire'}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Screen Backdrop for Mobile layout */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        />
      )}
    </>
  );
};
