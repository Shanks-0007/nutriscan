import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../backend/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, Settings, Save, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    username: '',
    dietPreference: '',
    healthGoal: 'Balanced diet',
    consumptionPreference: 'Low sugar',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    allergies: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setFormData({
            username: data.username || '',
            dietPreference: data.dietPreference || '',
            healthGoal: data.healthGoal || 'Balanced diet',
            consumptionPreference: data.consumptionPreference || 'Low sugar',
            age: data.age || '',
            gender: data.gender || '',
            height: data.height || '',
            weight: data.weight || '',
            activityLevel: data.activityLevel || '',
            allergies: data.allergies || ''
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        username: formData.username.substring(0, 49),
        dietPreference: formData.dietPreference ? formData.dietPreference.substring(0, 49) : deleteField(),
        healthGoal: formData.healthGoal || deleteField(),
        consumptionPreference: formData.consumptionPreference || deleteField(),
        age: formData.age || deleteField(),
        gender: formData.gender || deleteField(),
        height: formData.height || deleteField(),
        weight: formData.weight || deleteField(),
        activityLevel: formData.activityLevel || deleteField(),
        allergies: formData.allergies || deleteField()
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(34, 211, 238);
    doc.text('NutriScan AI Health Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`User: ${formData.username || currentUser?.email}`, 20, 40);
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Age', formData.age || 'N/A'],
        ['Gender', formData.gender || 'N/A'],
        ['Height', `${formData.height} cm` || 'N/A'],
        ['Weight', `${formData.weight} kg` || 'N/A'],
        ['Activity Level', formData.activityLevel || 'N/A'],
        ['Diet Preference', formData.dietPreference || 'N/A'],
        ['Health Goal', formData.healthGoal || 'N/A'],
        ['Consumption Preference', formData.consumptionPreference || 'N/A'],
        ['Allergies', formData.allergies || 'None'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [34, 211, 238] }
    });
    
    doc.save(`NutriScan_Health_Report_${formData.username}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
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
          <div className="p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
            <UserIcon className="w-8 h-8 text-cyan-500" />
          </div>
          Health <span className="neon-text">Profile</span>
        </h1>
        <p className="text-lg text-[var(--text-color)] mt-3 font-medium">
          Personalize your nutrition analysis with your health data.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-6 md:p-10 shadow-xl relative overflow-hidden border border-[var(--border-color)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative z-10">
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border backdrop-blur-md ${
                message.type === 'success' 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                  : 'bg-red-500/5 border-red-500/20 text-red-600'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p>{message.text}</p>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-10 pb-10 border-b border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full p-1 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[var(--card-bg)] rounded-full flex items-center justify-center text-[var(--text-heading)] text-3xl font-black uppercase">
                  {profile?.username?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="text-center sm:text-left pt-2">
                <h2 className="text-2xl font-black text-[var(--text-heading)] tracking-tight">{profile?.username || 'User'}</h2>
                <p className="text-[var(--text-muted)] flex items-center justify-center sm:justify-start gap-2 mt-2 font-medium">
                  <Mail className="w-4 h-4 text-cyan-500" />
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadReport}
              className="px-6 py-3 bg-[var(--btn-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/10 transition-all"
            >
              <Download className="w-4 h-4 text-cyan-500" />
              Download Report
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="175"
                    className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70"
                    className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Activity Level</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                >
                  <option value="">Select Level</option>
                  <option value="Sedentary">Sedentary (Office job, little exercise)</option>
                  <option value="Moderate">Moderate (Active job, 3-5 days exercise)</option>
                  <option value="Active">Active (Physical job, daily exercise)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Diet Type</label>
                <select
                  name="dietPreference"
                  value={formData.dietPreference}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                >
                  <option value="">Select Diet</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Keto">Keto</option>
                  <option value="Paleo">Paleo</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Health Goal</label>
                <select
                  name="healthGoal"
                  value={formData.healthGoal}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                >
                  <option value="Weight loss">Weight loss</option>
                  <option value="Muscle gain">Muscle gain</option>
                  <option value="Balanced diet">Balanced diet</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Consumption Preference</label>
                <select
                  name="consumptionPreference"
                  value={formData.consumptionPreference}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium appearance-none"
                >
                  <option value="Low sugar">Low sugar</option>
                  <option value="Low fat">Low fat</option>
                  <option value="High protein">High protein</option>
                  <option value="Low sodium">Low sodium</option>
                  <option value="High fiber">High fiber</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] mb-2 tracking-[0.2em] uppercase">Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Peanuts, Lactose, Gluten"
                rows={3}
                className="block w-full px-5 py-4 border border-[var(--border-color)] rounded-xl bg-[var(--btn-secondary)] text-[var(--text-heading)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium resize-none"
              />
            </div>

            <div className="pt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto px-8 py-4 text-red-500 font-black uppercase tracking-widest hover:bg-red-500/5 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden group/btn shadow-lg shadow-cyan-500/20"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Health Profile
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
