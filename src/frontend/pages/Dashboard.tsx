import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../backend/firebase';
import { useAuth } from '../context/AuthContext';
import { getHealthCategory } from '../../backend/services/geminiService';
import { motion, useAnimation, useInView } from 'motion/react';
import { ScanLine, Activity, ArrowRight, Clock, ChevronRight, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

// CountUp Component for animated numbers
const CountUp = ({ end, duration = 2 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [filteredScans, setFilteredScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    avgScore: 0, 
    totalScans: 0,
    healthyCount: 0,
    moderateCount: 0,
    riskyCount: 0,
    unhealthyCount: 0
  });

  const [filters, setFilters] = useState({
    risk: 'All',
    date: 'All'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'users', currentUser.uid, 'history'),
          orderBy('scannedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const scans: any[] = [];
        let totalScore = 0;
        let healthy = 0;
        let moderate = 0;
        let risky = 0;
        let unhealthy = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const scan = { id: doc.id, ...data };
          scans.push(scan);
          totalScore += data.healthScore || 0;
          
          // Use stored category or calculate from score for legacy data
          const category = data.category || getHealthCategory(data.healthScore || 0).category;
          
          if (category === 'Healthy') healthy++;
          else if (category === 'Moderate') moderate++;
          else if (category === 'Risky') risky++;
          else if (category === 'Unhealthy') unhealthy++;
        });
        
        setRecentScans(scans);
        setFilteredScans(scans.slice(0, 6));
        setStats({
          totalScans: scans.length,
          avgScore: scans.length > 0 ? Math.round(totalScore / scans.length) : 0,
          healthyCount: healthy,
          moderateCount: moderate,
          riskyCount: risky,
          unhealthyCount: unhealthy
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/history`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  useEffect(() => {
    let result = [...recentScans];

    // Filter by Risk
    if (filters.risk !== 'All') {
      result = result.filter(scan => scan.category === filters.risk);
    }

    // Filter by Date
    if (filters.date !== 'All') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const thisWeek = new Date(now.setDate(now.getDate() - 7));
      const thisMonth = new Date(now.setMonth(now.getMonth() - 1));

      result = result.filter(scan => {
        const scanDate = new Date(scan.scannedAt);
        if (filters.date === 'Today') return scanDate >= today;
        if (filters.date === 'This Week') return scanDate >= thisWeek;
        if (filters.date === 'This Month') return scanDate >= thisMonth;
        return true;
      });
    }

    setFilteredScans(result.slice(0, 6));
  }, [filters, recentScans]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-12 text-center md:text-left"
      >
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-[var(--text-heading)]">
          Welcome back, <br className="md:hidden" />
          <span className="neon-text">
            {currentUser?.displayName || 'User'}!
          </span>
        </h1>
        <p className="text-lg text-[var(--text-color)] max-w-2xl font-medium">
          Your personal nutrition command center. Track, analyze, and optimize your dietary intake with precision.
        </p>
      </motion.div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {[
          { label: 'Total Scans', value: stats.totalScans, color: 'cyan', icon: Activity },
          { label: 'Healthy', value: stats.healthyCount, color: 'emerald', icon: CheckCircle2 },
          { label: 'Moderate', value: stats.moderateCount, color: 'amber', icon: AlertCircle },
          { label: 'Risky', value: stats.riskyCount, color: 'orange', icon: ShieldAlert },
          { label: 'Unhealthy', value: stats.unhealthyCount, color: 'red', icon: ShieldAlert },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-6 rounded-2xl relative overflow-hidden group border border-[var(--border-color)] hover:border-${stat.color}-500/30 transition-all duration-300 stat-glow-${stat.color}`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-${stat.color}-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-${stat.color}-500/10 transition-colors`} />
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <div className={`text-3xl font-black text-[var(--text-heading)] neon-text-${stat.color} relative`}>
              <div className={`absolute inset-0 blur-xl bg-${stat.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
              <CountUp end={stat.value} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Scan Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          whileHover={{ y: -5 }}
          className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group md:col-span-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(45,212,191,0.4)] group-hover:shadow-[0_0_40px_rgba(45,212,191,0.6)] transition-shadow duration-300"
          >
            <ScanLine className="w-10 h-10 text-white" />
          </motion.div>
          
          <h3 className="text-xl font-black text-[var(--text-heading)] mb-2">Scan Label</h3>
          <p className="text-[var(--text-color)] mb-6 text-sm font-medium">Upload or scan a food label to analyze its nutritional value and health impact using AI.</p>
          
          <Link
            to="/scan"
            className="relative px-8 py-3.5 w-full btn-primary-orange rounded-2xl font-black overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Scan New Label <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>

        {/* Score Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ y: -5 }}
          className="glass-card rounded-3xl p-8 relative overflow-hidden group md:col-span-2"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-heading)]">Health Performance</h3>
              <p className="text-[var(--text-color)] text-sm mt-1 font-medium">Average score of your recent scans</p>
            </div>
            <div className="p-3 bg-[var(--btn-secondary)] rounded-2xl border border-[var(--border-color)]">
              <Activity className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
          
          <div className="flex items-center gap-8 relative z-10">
            <div className="flex items-end gap-2">
              <span className="text-8xl font-black tracking-tighter neon-text">
                <CountUp end={stats.avgScore} />
              </span>
              <span className="text-2xl text-[var(--text-muted)] font-black mb-4">/ 100</span>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-[var(--text-muted)]">Overall Rating</span>
                <span className={stats.avgScore >= 70 ? 'text-emerald-500' : stats.avgScore >= 40 ? 'text-amber-500' : 'text-red-500'}>
                  {stats.avgScore >= 70 ? 'Excellent' : stats.avgScore >= 40 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <div className="w-full h-4 bg-[var(--btn-secondary)] rounded-full overflow-hidden p-1 border border-[var(--border-color)]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.avgScore}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-500 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Scans Section */}
      <div>
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-black text-[var(--text-heading)] tracking-tight">Recent Scans</h2>
          
          {/* Risk Filtering System */}
          <div className="flex items-center gap-3 bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--border-color)] backdrop-blur-md">
            <select 
              value={filters.risk}
              onChange={(e) => setFilters(prev => ({ ...prev, risk: e.target.value }))}
              className="bg-transparent text-[var(--text-color)] text-sm font-bold px-4 py-2 focus:outline-none cursor-pointer hover:text-[var(--text-heading)] transition-colors"
            >
              <option value="All">All Risks</option>
              <option value="Healthy">Healthy</option>
              <option value="Moderate">Moderate</option>
              <option value="Risky">Risky</option>
              <option value="Unhealthy">Unhealthy</option>
            </select>
            <div className="w-px h-6 bg-[var(--border-color)]" />
            <select 
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="bg-transparent text-[var(--text-color)] text-sm font-bold px-4 py-2 focus:outline-none cursor-pointer hover:text-[var(--text-heading)] transition-colors"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-[var(--card-bg)] animate-pulse rounded-2xl border border-[var(--border-color)]" />
            ))}
          </div>
        ) : filteredScans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScans.map((scan, idx) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 group relative overflow-hidden"
              >
                {/* Neon Border Glow on Hover */}
                <div className={`absolute inset-0 border-2 border-transparent group-hover:border-${
                  scan.category === 'Healthy' ? 'emerald' : 
                  scan.category === 'Moderate' ? 'amber' : 
                  scan.category === 'Risky' ? 'orange' : 
                  'red'
                }-500/50 rounded-2xl transition-colors duration-300 pointer-events-none`} />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="truncate pr-4">
                    <h3 className="font-black text-xl text-[var(--text-heading)] truncate">{scan.productName}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">{scan.brandName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-lg ${
                      scan.category === 'Healthy' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' :
                      scan.category === 'Moderate' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' :
                      scan.category === 'Risky' ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                      'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                    }`}>
                      {scan.healthScore}
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                      scan.category === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                      scan.category === 'Moderate' ? 'bg-amber-500/10 border-amber-500 text-amber-500' :
                      scan.category === 'Risky' ? 'bg-orange-500/10 border-orange-500 text-orange-500' :
                      'bg-red-500/10 border-red-500 text-red-500'
                    }`}>
                      {scan.uiLabel || scan.category}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-[var(--btn-secondary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Calories</div>
                    <div className="font-black text-[var(--text-heading)]">{scan.calories}</div>
                  </div>
                  <div className="bg-[var(--btn-secondary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Protein</div>
                    <div className="font-black text-[var(--text-heading)]">{scan.protein}g</div>
                  </div>
                  <div className="bg-[var(--btn-secondary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Sugar</div>
                    <div className="font-black text-[var(--text-heading)]">{scan.sugar}g</div>
                  </div>
                  <div className="bg-[var(--btn-secondary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider mb-1">Fat</div>
                    <div className="font-black text-[var(--text-heading)]">{scan.fat}g</div>
                  </div>
                </div>
                
                <Link
                  to={`/results/${scan.id}?productId=${scan.productId}`}
                  className="relative block w-full text-center py-3 bg-[var(--btn-secondary)] hover:bg-cyan-500/10 text-[var(--text-heading)] rounded-xl font-bold transition-all overflow-hidden group/link z-10 border border-[var(--border-color)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">View Details</span>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 glass-card rounded-3xl relative overflow-hidden border border-[var(--border-color)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-teal-500/5" />
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-[var(--btn-secondary)] rounded-full flex items-center justify-center mb-6 shadow-inner border border-[var(--border-color)]">
                <ScanLine className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-heading)] mb-3 tracking-tight">No data available</h3>
              <p className="text-[var(--text-color)] mb-8 max-w-md mx-auto font-medium">Initialize your database by scanning your first nutrition label to unlock insights.</p>
              <Link
                to="/scan"
                className="px-8 py-3 btn-primary-cyan rounded-xl font-black uppercase tracking-widest text-xs transition-all inline-block"
              >
                Initialize Scan
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
