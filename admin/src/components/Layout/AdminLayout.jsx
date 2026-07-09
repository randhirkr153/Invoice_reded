import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, ShoppingBag, FileText, 
  CreditCard, TrendingUp, Settings, LogOut, Sun, Moon, Menu, X, Plus 
} from 'lucide-react';
import { logoutAction } from '../../redux/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/products', label: 'Products', icon: ShoppingBag },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: TrendingUp },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logoutAction());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-base font-sans overflow-hidden">
              <span className="z-10">RD</span>
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-slate-900 animate-pulse"></span>
            </div>
            <span className="font-semibold text-base tracking-tight text-slate-800 dark:text-slate-100 font-sans">Reded Dotcom</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/30">
            <button
              onClick={() => navigate('/invoices?action=create')}
              className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer font-sans"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[120px]">{user?.name || 'Admin'}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 p-6 flex flex-col md:hidden border-r border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-8">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center space-x-2">
                <div className="relative w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-base font-sans overflow-hidden">
                  <span className="z-10">RD</span>
                  <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-slate-900 animate-pulse"></span>
                </div>
                <span className="font-semibold text-base tracking-tight text-slate-800 dark:text-slate-100 font-sans">Reded Dotcom</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/30">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate('/invoices?action=create');
                  }}
                  className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Invoice</span>
                </button>
              </div>
            </nav>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
                    {user?.name ? user.name[0].toUpperCase() : 'A'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[120px]">{user?.name || 'Admin'}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <div className="pt-4 text-center text-[10px] text-slate-400 font-medium font-sans">
                Created by Randhir & Co.
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex-shrink-0 z-30">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="ml-4 font-semibold text-lg text-slate-800 dark:text-slate-200 capitalize font-sans">
              {location.pathname === '/' ? 'Overview' : location.pathname.substring(1)}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.companyName || 'SaaS Organization'}</p>
              <p className="text-[10px] text-slate-400">GSTIN: {user?.gstNumber || 'None'}</p>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-6 md:p-8 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {children}
          </motion.div>
          <footer className="mt-8 text-center text-xs text-slate-400 font-medium font-sans border-t border-slate-100 dark:border-slate-800/50 pt-4">
            Created by Randhir & Co.
          </footer>
        </main>
      </div>

    </div>
  );
}
