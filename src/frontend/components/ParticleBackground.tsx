import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ParticleBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--bg-main)] transition-colors duration-500">
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[var(--bg-image-opacity)] transition-all duration-500"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop")',
          filter: isDark 
            ? 'none' 
            : 'brightness(1.1) contrast(0.9) blur(3px)'
        }}
      />
      
      {/* Soft Gradient Overlay (Top -> Bottom Fade) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-black/20 pointer-events-none" />
      
      {/* Radial Glows for Light Mode */}
      {!isDark && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        </>
      )}
      
      {/* Overlay for Readability */}
      <div className="absolute inset-0 bg-[var(--bg-overlay)] transition-colors duration-500" />
      
      {/* Noise Texture */}
      <div className="bg-noise" />
      
    </div>
  );
};
