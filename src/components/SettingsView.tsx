import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, 
  User, 
  Lock, 
  Sun, 
  Moon, 
  LogOut, 
  CheckCircle,
  AlertCircle,
  Hash,
  Mail,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SettingsView: React.FC = () => {
  const { userProfile, updateProfileName, changePassword, logout } = useAuth();

  // FORM STATES
  const [profileName, setProfileName] = useState(userProfile?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI SUCCESS/ERROR MESSAGES
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // THEME STATE: Default to dark theme as requested
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Submit profile name change
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!profileName.trim()) {
      setProfileError("Le nom complet ne peut pas être vide.");
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfileName(profileName.trim());
      setProfileSuccess("Votre nom de profil d'inventaire a été mis à jour.");
    } catch (err: any) {
      setProfileError(err.message || "Impossible de sauvegarder le nom.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit password change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError("Veuillez saisir votre nouveau mot de passe.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(newPassword);
      setPasswordSuccess("Votre mot de passe a bien été réinitialisé.");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError("Action hautement sécurisée : Veuillez vous reconnecter puis réessayer.");
      } else {
        setPasswordError("Impossible de modifier le mot de passe.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-16 md:pt-0 font-sans pb-10 max-w-4xl">
      
      {/* Detail header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-100 uppercase tracking-tight">Paramètres Généraux</h1>
        <p className="text-slate-400 text-xs font-mono uppercase tracking-wide">Compte utilisateur, préférences visuelles et clés de sécurité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Preferences theme, user profile ID */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Card: Theme Picker Preferences */}
          <div className="bg-[#1E293B]/20 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
              <Sliders className="w-4 h-4 text-sky-450" />
              <span>Préférences Apparence</span>
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Basculez entre le mode sombre industriel et le mode clair épuré selon votre environnement de travail.
            </p>

            <button
              onClick={toggleTheme}
              className="w-full py-3 px-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-semibold hover:bg-slate-900 transition-colors"
            >
              <span className="text-slate-300">Thème Visuel</span>
              <div className="flex items-center space-x-2 text-sky-400">
                {theme === 'dark' ? (
                  <>
                    <Moon className="w-4 h-4" />
                    <span className="font-mono text-[10px] uppercase">Sombre Actif</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-[10px] uppercase text-amber-400">Clair Actif</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Card: Read-Only User Card Profile */}
          <div className="bg-[#1E293B]/20 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4 text-xs text-slate-400">
            <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px]">
              <Hash className="w-4 h-4 text-sky-450" />
              <span>Fiche Technique</span>
            </h3>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-550">Compte e-mail :</span>
                <span className="text-slate-200 font-semibold flex items-center max-w-[150px] truncate">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-500" /> {userProfile?.email}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-550">Rôle RBAC :</span>
                <span className="text-sky-400 font-mono uppercase bg-sky-500/10 border border-sky-500/10 px-2 py-0.5 rounded-md font-bold text-[9px]">
                  {userProfile?.role === 'admin' ? 'Administrateur' : 'Gestionnaire'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-550">Enregistré le :</span>
                <span className="text-slate-300 font-mono">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR') : 'Inconnu'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-600 border-t border-slate-900/40 pt-2 font-mono">
                <span>UID DE BASE :</span>
                <span className="truncate max-w-[100px]">{userProfile?.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Forms blocks */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Form 1: Edit Profile details */}
          <div className="bg-[#1E293B]/20 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px] mb-4">
              <User className="w-4 h-4 text-sky-400" />
              <span>Dossier Utilisateur</span>
            </h3>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Nom Complet</Label>
                <Input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="ex. Jean Dupont"
                  className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={profileLoading}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1"
                >
                  {profileLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sauvegarder les détails</span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Form 2: Change Password details */}
          <div className="bg-[#1E293B]/20 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="font-heading font-bold text-slate-100 flex items-center space-x-2 text-[15px] mb-4">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Sécurité de raccordement</span>
            </h3>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Nouveau mot de passe</Label>
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                  />
                </div>
                <div>
                  <Label className="block text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Confirmer le mot de passe</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="******"
                    className="w-full bg-slate-950/40 border-slate-850 text-slate-100 text-xs rounded-xl focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1"
                >
                  {passwordLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Mettre à jour la clé</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
