import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Scan",
  message = "Are you sure you want to delete this scan? This action cannot be undone.",
  loading = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-card rounded-[2rem] p-8 shadow-2xl border border-[var(--border-color)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <h3 className="text-2xl font-black text-[var(--text-heading)] mb-2 tracking-tight">{title}</h3>
            <p className="text-[var(--text-color)] font-medium mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-[var(--btn-secondary)] hover:bg-[var(--border-color)] text-[var(--text-heading)] rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-xl hover:shadow-red-500/30 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
