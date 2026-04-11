import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Bell, Lock, Shield, Trash2, Save, CheckCircle2, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../../backend/firebase';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';

export const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    publicProfile: false,
    dataSharing: true,
    healthGoal: 'Balanced diet',
    consumptionPreference: 'Low sugar'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSettings(prev => ({
            ...prev,
            ...data,
            // Ensure we don't overwrite defaults with undefined
            healthGoal: data.healthGoal || prev.healthGoal,
            consumptionPreference: data.consumptionPreference || prev.consumptionPreference,
          }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [currentUser]);

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage({ type: 'success', text: `Password reset email sent to ${currentUser.email}` });
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setMessage({ type: 'error', text: 'Failed to send password reset email.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !auth.currentUser) return;
    setDeleting(true);
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, 'users', currentUser.uid));
      // Delete from Auth
      await deleteUser(auth.currentUser);
      // Logout will be handled by AuthContext state change
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setMessage({ 
        type: 'error', 
        text: err.code === 'auth/requires-recent-login' 
          ? 'This action requires a recent login. Please sign out and sign in again to delete your account.' 
          : 'Failed to delete account. Please try again.' 
      });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-black text-[var(--text-heading)] flex items-center gap-4 tracking-tight">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <SettingsIcon className="w-8 h-8 text-purple-500" />
          </div>
          Account <span className="neon-text">Settings</span>
        </h1>
        <p className="text-lg text-[var(--text-color)] mt-3 font-medium">
          Manage your preferences, notifications, and health goals.
        </p>
      </motion.div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border backdrop-blur-md ${
            message.type === 'success' 
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
              : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p>{message.text}</p>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Health Customization Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-[var(--text-heading)]">Health Customization</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 tracking-wide uppercase">Primary Health Goal</label>
              <select
                name="healthGoal"
                value={settings.healthGoal}
                onChange={handleSelectChange}
                className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner backdrop-blur-sm appearance-none neon-border-cyan"
              >
                <option value="Weight loss">Weight loss</option>
                <option value="Muscle gain">Muscle gain</option>
                <option value="Balanced diet">Balanced diet</option>
              </select>
              <p className="text-[var(--text-muted)] text-xs mt-2 italic">This influences AI health score calculations.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 tracking-wide uppercase">Consumption Preference</label>
              <select
                name="consumptionPreference"
                value={settings.consumptionPreference}
                onChange={handleSelectChange}
                className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner backdrop-blur-sm appearance-none neon-border-cyan"
              >
                <option value="Low sugar">Low sugar</option>
                <option value="Low fat">Low fat</option>
                <option value="High protein">High protein</option>
                <option value="Low sodium">Low sodium</option>
                <option value="High fiber">High fiber</option>
              </select>
              <p className="text-[var(--text-muted)] text-xs mt-2 italic">AI will prioritize these factors in recommendations.</p>
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
            <Bell className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-[var(--text-heading)]">Notifications</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[var(--text-heading)] font-semibold">Email Notifications</h3>
                <p className="text-[var(--text-muted)] text-sm mt-1">Receive updates about your scans and health score.</p>
              </div>
              <button 
                onClick={() => handleToggle('emailNotifications')}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.emailNotifications ? 'bg-cyan-500' : 'bg-[var(--btn-secondary)]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.emailNotifications ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[var(--text-heading)] font-semibold">Push Notifications</h3>
                <p className="text-[var(--text-muted)] text-sm mt-1">Get instant alerts on your device.</p>
              </div>
              <button 
                onClick={() => handleToggle('pushNotifications')}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.pushNotifications ? 'bg-cyan-500' : 'bg-[var(--btn-secondary)]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.pushNotifications ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[var(--text-heading)] font-semibold">Weekly Report</h3>
                <p className="text-[var(--text-muted)] text-sm mt-1">Receive a weekly summary of your nutritional habits.</p>
              </div>
              <button 
                onClick={() => handleToggle('weeklyReport')}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.weeklyReport ? 'bg-cyan-500' : 'bg-[var(--btn-secondary)]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.weeklyReport ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Privacy Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
            <Shield className="w-6 h-6 text-teal-400" />
            <h2 className="text-2xl font-bold text-[var(--text-heading)]">Privacy & Data</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[var(--text-heading)] font-semibold">Public Profile</h3>
                <p className="text-[var(--text-muted)] text-sm mt-1">Allow others to see your health score and achievements.</p>
              </div>
              <button 
                onClick={() => handleToggle('publicProfile')}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.publicProfile ? 'bg-teal-500' : 'bg-[var(--btn-secondary)]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.publicProfile ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[var(--text-heading)] font-semibold">Data Sharing for AI Training</h3>
                <p className="text-[var(--text-muted)] text-sm mt-1">Anonymously share scan data to help improve our AI models.</p>
              </div>
              <button 
                onClick={() => handleToggle('dataSharing')}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.dataSharing ? 'bg-teal-500' : 'bg-[var(--btn-secondary)]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.dataSharing ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
            <Lock className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-[var(--text-heading)]">Security</h2>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleChangePassword}
              className="w-full sm:w-auto px-6 py-3 bg-[var(--btn-secondary)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-heading)] rounded-xl font-medium transition-colors border border-[var(--border-color)] flex items-center justify-center gap-2"
            >
              Change Password
            </button>
            <button className="w-full sm:w-auto px-6 py-3 bg-[var(--btn-secondary)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-heading)] rounded-xl font-medium transition-colors border border-[var(--border-color)] flex items-center justify-center gap-2">
              Manage Connected Accounts
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden border border-red-500/20"
        >
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">Irreversible actions related to your account.</p>
            
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors border border-red-500/30 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </motion.div>

        {/* Save & Sign Out Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
        >
          <button
            onClick={logout}
            className="w-full sm:w-auto px-8 py-4 text-red-500 font-black uppercase tracking-widest hover:bg-red-500/5 rounded-xl transition-colors border border-transparent hover:border-red-500/20 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto relative px-10 py-4 bg-[var(--btn-secondary)] text-[var(--text-heading)] rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden group/btn shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-[var(--border-color)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-2 group-hover/btn:text-white transition-colors">
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-md w-full p-8 rounded-[2rem] border border-red-500/30 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-center text-[var(--text-heading)] mb-4">Delete Account?</h2>
              <p className="text-[var(--text-muted)] text-center mb-8">
                This action is irreversible. All your scan history, profile data, and settings will be permanently deleted.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="w-full py-4 bg-[var(--btn-secondary)] text-[var(--text-heading)] rounded-xl font-black uppercase tracking-widest border border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
