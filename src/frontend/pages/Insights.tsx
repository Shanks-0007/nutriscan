import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../backend/firebase';
import { getHealthCategory } from '../../backend/services/geminiService';
import { motion } from 'motion/react';
import { BarChart3, PieChart, TrendingUp, Activity, Droplets, Flame } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';

export const Insights: React.FC = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'users', auth.currentUser.uid, 'history'),
          orderBy('scannedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedScans: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedScans.push(doc.data());
        });
        setScans(fetchedScans);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'scans');
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  const handleDownloadReport = () => {
    // This was accidentally added here, removing it.
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-teal-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-[2rem] border border-[var(--border-color)] shadow-xl max-w-md w-full"
          >
            <div className="w-24 h-24 bg-[var(--btn-secondary)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <BarChart3 className="w-12 h-12 text-[var(--text-muted)]" />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-heading)] mb-3 tracking-tight">No Insights Yet</h2>
            <p className="text-lg text-[var(--text-color)] font-medium">Scan some nutrition labels to see your health insights and analytics.</p>
          </motion.div>
      </div>
    );
  }

  // Calculate Insights
  const totalScans = scans.length;
  const avgScore = Math.round(scans.reduce((acc, curr) => acc + (curr.healthScore || 0), 0) / totalScans);
  const avgSugar = Math.round(scans.reduce((acc, curr) => acc + (curr.sugar || 0), 0) / totalScans);
  const avgFat = Math.round(scans.reduce((acc, curr) => acc + (curr.fat || 0), 0) / totalScans);
  const avgProtein = Math.round(scans.reduce((acc, curr) => acc + (curr.protein || 0), 0) / totalScans);
  const avgCalories = Math.round(scans.reduce((acc, curr) => acc + (curr.calories || 0), 0) / totalScans);

  const riskCounts = scans.reduce((acc, curr) => {
    const cat = curr.category || getHealthCategory(curr.healthScore || 0).category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Healthy', value: riskCounts['Healthy'] || 0, color: '#14b8a6' }, // teal-500
    { name: 'Moderate', value: riskCounts['Moderate'] || 0, color: '#f59e0b' }, // amber-500
    { name: 'High Risk', value: riskCounts['Risky'] || 0, color: '#f97316' }, // orange-500
    { name: 'Avoid', value: riskCounts['Unhealthy'] || 0, color: '#ef4444' }, // red-500
  ].filter(d => d.value > 0);

  // Top 5 highest sugar products
  const topSugarData = [...scans]
    .sort((a, b) => (b.sugar || 0) - (a.sugar || 0))
    .slice(0, 5)
    .map(s => ({ name: s.productName.substring(0, 15) + (s.productName.length > 15 ? '...' : ''), sugar: s.sugar || 0 }));

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-black text-[var(--text-heading)] flex items-center gap-4 tracking-tight">
          <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            <BarChart3 className="w-8 h-8 text-teal-500" />
          </div>
          Health <span className="neon-text">Insights</span>
        </h1>
        <p className="text-lg text-[var(--text-color)] mt-3 font-medium">
          Analytics based on your {totalScans} scanned products.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { 
            icon: Activity, 
            label: 'Average Health Score', 
            value: `${avgScore} / 100`,
            bgGradient: 'from-teal-500/0 to-teal-500/5 group-hover:from-teal-500/5 group-hover:to-teal-500/10',
            iconBg: 'bg-teal-500/10 border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
            iconColor: 'text-teal-500'
          },
          { 
            icon: Flame, 
            label: 'Average Calories', 
            value: `${avgCalories} kcal`,
            bgGradient: 'from-orange-500/0 to-orange-500/5 group-hover:from-orange-500/5 group-hover:to-orange-500/10',
            iconBg: 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
            iconColor: 'text-orange-500'
          },
          { 
            icon: Droplets, 
            label: 'Average Sugar', 
            value: `${avgSugar}g`,
            bgGradient: 'from-blue-500/0 to-blue-500/5 group-hover:from-blue-500/5 group-hover:to-blue-500/10',
            iconBg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
            iconColor: 'text-blue-500'
          },
          { 
            icon: TrendingUp, 
            label: 'Average Protein', 
            value: `${avgProtein}g`,
            bgGradient: 'from-emerald-500/0 to-emerald-500/5 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10',
            iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
            iconColor: 'text-emerald-500'
          }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card rounded-[2rem] p-6 shadow-xl flex items-center gap-5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} transition-colors duration-500`} />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner group-hover:shadow-lg transition-shadow ${stat.iconBg}`}>
              <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-[var(--text-heading)] tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Category Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
          <h3 className="text-xl font-bold text-[var(--text-heading)] mb-8 flex items-center gap-3 relative z-10">
            <PieChart className="w-6 h-6 text-teal-500" />
            Risk Category Distribution
          </h3>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}80)` }} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', backdropFilter: 'blur(8px)', color: 'var(--text-heading)' }}
                  itemStyle={{ color: 'var(--text-heading)', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', color: 'var(--text-color)' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Highest Sugar Products */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
          <h3 className="text-xl font-bold text-[var(--text-heading)] mb-8 flex items-center gap-3 relative z-10">
            <TrendingUp className="w-6 h-6 text-cyan-500" />
            Highest Sugar Content (Top 5)
          </h3>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSugarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--border-color)', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', backdropFilter: 'blur(8px)', color: 'var(--text-heading)' }}
                  itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                />
                <Bar dataKey="sugar" fill="url(#colorCyan)" radius={[6, 6, 0, 0]} name="Sugar (g)">
                  {topSugarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#colorCyan)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
