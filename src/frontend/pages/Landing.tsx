import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ScanLine, ShieldCheck, Activity, ArrowRight, Upload } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[var(--text-heading)] mb-4 leading-tight">
              Understand Your Food <br className="hidden md:block" />
              <span className="neon-text drop-shadow-[0_0_25px_rgba(34,211,238,0.3)]">
                Instantly with AI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-color)] mb-10 max-w-2xl mx-auto font-medium">
              Scan any food label and instantly discover hidden health risks. Make smarter, healthier choices with the power of advanced neural networks.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-400 hover:to-cyan-400 text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Get Started
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-black/40 hover:bg-black/60 text-white rounded-full border border-white/10 font-bold text-lg transition-all flex items-center justify-center gap-2 backdrop-blur-md shadow-sm"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
