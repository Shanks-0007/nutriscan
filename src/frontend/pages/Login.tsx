import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../backend/firebase';
import { getAuthErrorMessage } from '../lib/authErrors';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, Github, Apple, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Navbar';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists first
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || `${user.uid}@example.com`,
          username: (user.displayName || 'User').substring(0, 49),
          createdAt: new Date().toISOString()
        });
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password');
      return;
    }
    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-[2rem] shadow-2xl p-8 relative overflow-hidden border border-[var(--border-color)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative z-10">
            <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">Welcome back</h2>
            <p className="text-[var(--text-color)] mt-2 font-medium">Sign in to continue to NutriScan</p>
          </div>

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-color)]/80 backdrop-blur-md rounded-[2rem]"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-cyan-600 font-black animate-pulse uppercase tracking-widest text-xs">Signing you in...</p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-600 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {resetSent && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm font-medium"
            >
              Password reset email sent! Check your inbox.
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em]">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-cyan-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-cyan-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-cyan-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-black transition-all disabled:opacity-50 overflow-hidden group/btn shadow-lg shadow-cyan-500/20 mt-2"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-color)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--card-bg)] text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--btn-secondary)] border border-[var(--border-color)] rounded-xl font-black text-[var(--text-heading)] hover:bg-cyan-500/5 transition-all disabled:opacity-50 text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              
              <button
                type="button"
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--btn-secondary)] border border-[var(--border-color)] rounded-xl font-black text-[var(--text-heading)] hover:bg-slate-500/5 transition-all disabled:opacity-50 text-xs"
              >
                <Github className="w-4 h-4" />
                GitHub
              </button>

              <button
                type="button"
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--btn-secondary)] border border-[var(--border-color)] rounded-xl font-black text-[var(--text-heading)] hover:bg-slate-500/5 transition-all disabled:opacity-50 text-xs"
              >
                <Apple className="w-4 h-4" />
                Apple
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)] font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="font-black text-cyan-500 hover:underline uppercase tracking-widest text-xs">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
