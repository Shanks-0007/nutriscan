import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../backend/firebase';
import { motion } from 'motion/react';
import { History as HistoryIcon, Search, Trash2, ArrowRight, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { DeleteModal } from '../components/DeleteModal';

export const History: React.FC = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'history'),
        orderBy('scannedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedScans: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedScans.push({ id: doc.id, ...doc.data() });
      });
      setScans(fetchedScans);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${auth.currentUser.uid}/history`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async () => {
    if (!deleteId || !auth.currentUser) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'history', deleteId));
      setScans(scans.filter(scan => scan.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/history/${deleteId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredScans = scans.filter(scan => 
    scan.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scan.brandName && scan.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-black text-[var(--text-heading)] flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
              <HistoryIcon className="w-8 h-8 text-cyan-500" />
            </div>
            Scan <span className="neon-text">History</span>
          </h1>
          <p className="text-lg text-[var(--text-color)] mt-3 font-medium">
            Review all your past nutrition label scans.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative w-full md:w-80"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-teal-500/70" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium"
          />
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-teal-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : filteredScans.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--btn-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="px-8 py-5">Product</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Score</th>
                  <th className="px-8 py-5">Category</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredScans.map((scan, idx) => (
                  <motion.tr 
                    key={scan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-cyan-500/5 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="font-black text-lg text-[var(--text-heading)] group-hover:text-cyan-500 transition-colors leading-tight">{scan.productName}</div>
                      <div className="text-xs font-black text-cyan-500/70 uppercase tracking-widest mb-1">{scan.brandName || 'Unknown Brand'}</div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-[var(--text-color)]">
                      {format(new Date(scan.scannedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-black text-lg shadow-inner ${
                        scan.healthScore >= 80 ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/20' :
                        scan.healthScore >= 60 ? 'bg-amber-500/5 text-amber-500 border border-amber-500/20' :
                        scan.healthScore >= 40 ? 'bg-orange-500/5 text-orange-500 border border-orange-500/20' :
                        'bg-red-500/5 text-red-500 border border-red-500/20'
                      }`}>
                        {scan.healthScore}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        scan.category === 'Healthy' ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/20' :
                        scan.category === 'Moderate' ? 'bg-amber-500/5 text-amber-500 border border-amber-500/20' :
                        scan.category === 'Risky' ? 'bg-orange-500/5 text-orange-500 border border-orange-500/20' :
                        'bg-red-500/5 text-red-500 border border-red-500/20'
                      }`}>
                        {scan.category === 'Healthy' ? <ShieldCheck className="w-4 h-4" /> : 
                         scan.category === 'Moderate' ? <Shield className="w-4 h-4" /> : 
                         scan.category === 'Risky' ? <ShieldAlert className="w-4 h-4 text-orange-500" /> :
                         <ShieldAlert className="w-4 h-4 text-red-500" />}
                        {scan.uiLabel || scan.category}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/results/${scan.id}?productId=${scan.productId}`}
                          className="p-2.5 text-[var(--text-muted)] hover:text-cyan-500 hover:bg-cyan-500/10 rounded-xl transition-all"
                          title="View Details"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(scan.id)}
                          className="p-2.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 glass-card border border-[var(--border-color)] rounded-[2rem] shadow-xl"
        >
          <div className="w-24 h-24 bg-[var(--btn-secondary)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <HistoryIcon className="w-12 h-12 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-2xl font-black text-[var(--text-heading)] mb-3 tracking-tight">No scans found</h3>
          <p className="text-lg text-[var(--text-color)] mb-8 font-medium max-w-md mx-auto">
            {searchTerm ? "We couldn't find any scans matching your search." : "You haven't scanned any labels yet. Start tracking your nutrition today!"}
          </p>
          {!searchTerm && (
            <Link
              to="/scan"
              className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-2xl font-black text-lg overflow-hidden group/btn shadow-lg shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Scan Your First Label
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </Link>
          )}
        </motion.div>
      )}

      <DeleteModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
};
