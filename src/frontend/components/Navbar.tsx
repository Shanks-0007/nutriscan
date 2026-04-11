import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Leaf, Menu, X, ScanLine, LayoutDashboard, History, BarChart3, User as UserIcon, LogOut, Compass, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <div className={`relative ${className} group`}>
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-green-400 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity animate-logo-glow" />
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full drop-shadow-lg animate-logo-pulse">
      <path d="M12 2L4.5 9C4.5 9 3 13 5 17C7 21 12 22 12 22C12 22 17 21 19 17C21 13 19.5 9 19.5 9L12 2Z" fill="url(#logo-gradient)" />
      <path d="M12 22V12M12 12L16 8M12 12L8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="8" r="1.5" fill="white" />
      <circle cx="8" cy="8" r="1.5" fill="white" />
      <defs>
        <linearGradient id="logo-gradient" x1="4.5" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scan Label', path: '/scan', icon: ScanLine },
    { name: 'History', path: '/history', icon: History },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Insights', path: '/insights', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] transition-all duration-500 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <Logo className="w-10 h-10" />
              <span className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme === 'light' ? 'from-cyan-600 via-teal-600 to-green-600' : 'from-cyan-400 via-teal-400 to-green-400'}`}>
                NutriScan
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            {currentUser && navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all group overflow-hidden ${
                    isActive 
                      ? 'text-cyan-500' 
                      : 'text-[var(--text-color)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  <Icon className="w-4 h-4 z-10" />
                  <span className="z-10">{link.name}</span>
                  
                  {/* Hover/Active Background */}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 dark:from-cyan-500/20 dark:to-purple-500/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 dark:bg-white/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors rounded-xl" />
                  
                  {/* Animated Underline */}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)] ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'}`} />
                </Link>
              );
            })}
            
            <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>

            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--text-muted)] hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {!currentUser ? (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="px-5 py-2 text-sm font-bold text-[var(--text-color)] hover:text-cyan-500 transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="px-5 py-2 text-sm font-black text-white btn-primary-cyan rounded-full transition-all">
                  Sign Up
                </Link>
              </div>
            ) : (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>

          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--text-muted)] hover:text-cyan-500 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--border-color)] bg-[var(--nav-bg)] backdrop-blur-xl"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {currentUser ? (
                <>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-bold transition-colors ${
                          isActive 
                            ? 'bg-cyan-500/10 text-cyan-500' 
                            : 'text-[var(--text-color)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {link.name}
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-red-400 hover:bg-red-900/20 rounded-xl"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-center text-base font-medium text-slate-200 bg-slate-800 rounded-xl"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-center text-base font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
