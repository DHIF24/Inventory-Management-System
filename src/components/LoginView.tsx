import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Lock, Mail, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginView: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFirebaseError = (err: any) => {
    console.error("Auth error details:", err);
    let originalCode = err.code || '';
    let msg = "Une erreur d'authentification est survenue. Veuillez réessayer.";

    if (originalCode === 'auth/invalid-credential' || originalCode === 'auth/wrong-password' || originalCode === 'auth/user-not-found') {
      msg = "Identifiants invalides ou mot de passe incorrect.";
    } else if (originalCode === 'auth/email-already-in-use') {
      msg = "Cet e-mail est déjà utilisé par un autre compte.";
    } else if (originalCode === 'auth/weak-password') {
      msg = "Le mot de passe doit contenir au moins 6 caractères.";
    } else if (originalCode === 'auth/invalid-email') {
      msg = "Le format de l'e-mail est invalide.";
    } else if (err.message && err.message.includes('password')) {
      msg = "Erreur de format du mot de passe.";
    }
    setErrorMsg(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (isSignUp && !name) {
      setErrorMsg("Veuillez renseigner votre nom complet.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, name.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: any) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Polygons */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and App Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.3)] mb-4">
            <Package className="w-9 h-9 text-slate-900 stroke-[2.5]" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl tracking-tight text-white uppercase">
            INVEN<span className="text-sky-400">TRAK</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-1">SYSTEME DE GESTION DE STOCK</p>
        </div>

        {/* Card Frame with minimal glassmorphism */}
        <div className="bg-[#1E293B]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <h2 className="text-xl font-heading font-bold text-slate-100 mb-6 flex justify-between items-baseline">
            <span>{isSignUp ? "Créer un compte" : "Se connecter"}</span>
            <span className="text-xs text-slate-500 font-mono">v1.2.0</span>
          </h2>

          {/* Form message alert block */}
          {errorMsg && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Nom Complet</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Jean Dupont"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 focus:outline-none placeholder-slate-600 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Adresse E-mail</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 focus:outline-none placeholder-slate-600 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Mot de passe</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full pl-11 pr-12 py-3 bg-slate-950/40 border border-slate-800 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 focus:outline-none placeholder-slate-600 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl transition-all duration-200 outline-none hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? "S'enregistrer" : "S'authentifier"}</span>
              )}
            </button>
          </form>

          {/* Account state Toggle */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex justify-center text-xs">
            <span className="text-slate-500">
              {isSignUp ? "Vous possédez déjà un compte ?" : "Nouveau sur InvenTrak ?"}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-sky-400 hover:text-sky-300 font-semibold ml-1.5 focus:outline-none underline"
            >
              {isSignUp ? "Se connecter" : "Créer un espace"}
            </button>
          </div>
        </div>

        {/* Console info instructions for email/password */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850/60 text-center">
          <p className="text-[11px] text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
            💡 Astuce : Si la connexion échoue, assurez-vous que la méthode standard d'authentification <b>E-mail & mot de passe</b> est bien activée sur votre console de projet Firebase.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
