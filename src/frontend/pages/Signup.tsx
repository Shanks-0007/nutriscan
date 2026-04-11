import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../../backend/firebase';
import { getAuthErrorMessage } from '../lib/authErrors';
import { motion } from 'motion/react';
import { Leaf, Mail, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dietPreference, setDietPreference] = useState('');
  const [healthGoal, setHealthGoal] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateProfile = async (uid: string, userEmail: string, name: string) => {
    try {
      const userData: any = {
        uid,
        email: userEmail,
        username: name.substring(0, 49),
        createdAt: new Date().toISOString()
      };
      if (dietPreference) userData.dietPreference = dietPreference.substring(0, 49);
      if (healthGoal) userData.healthGoal = healthGoal.substring(0, 49);

      await setDoc(doc(db, 'users', uid), userData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await handleCreateProfile(user.uid, user.email || email, username);
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

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl glass-card rounded-[2rem] shadow-2xl p-8 relative overflow-hidden border border-[var(--border-color)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative z-10">
            <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">Create your account</h2>
            <p className="text-[var(--text-color)] mt-2 font-medium">Join NutriScan to start analyzing your food</p>
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
              <p className="text-cyan-600 font-black animate-pulse uppercase tracking-widest text-xs">Creating your account...</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em]">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-cyan-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                    placeholder="johndoe"
                  />
                </div>
              </div>

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
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em]">Password</label>
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

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em]">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[var(--text-muted)] group-focus-within:text-cyan-500 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-cyan-500 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-color)]">
              <h3 className="text-[10px] font-black text-[var(--text-muted)] mb-4 uppercase tracking-[0.2em]">Optional Profile Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em]">Diet Preference</label>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="block w-full px-4 py-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                  >
                    <option value="">None</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Keto">Keto</option>
                    <option value="Paleo">Paleo</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em]">Health Goal</label>
                  <select
                    value={healthGoal}
                    onChange={(e) => setHealthGoal(e.target.value)}
                    className="block w-full px-4 py-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                  >
                    <option value="">None</option>
                    <option value="Weight loss">Weight loss</option>
                    <option value="Muscle gain">Muscle gain</option>
                    <option value="Balanced diet">Balanced diet</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-black transition-all disabled:opacity-50 mt-6 overflow-hidden group/btn shadow-lg shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">
                {loading ? 'Creating account...' : 'Create Account'}
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

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[var(--btn-secondary)] border border-[var(--border-color)] rounded-xl font-black text-[var(--text-heading)] hover:bg-cyan-500/5 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--text-muted)] font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-cyan-500 hover:underline uppercase tracking-widest text-xs">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
