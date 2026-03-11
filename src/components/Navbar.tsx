import { Play, Search, User, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tournament } from '../data';

interface NavbarProps {
  activeCategory: string | 'All';
  onSelectCategory: (category: string | 'All') => void;
  onLoginClick: () => void;
  user: any;
  onLogout: () => void;
  tournaments: Tournament[];
}

export default function Navbar({ activeCategory, onSelectCategory, onLoginClick, user, onLogout, tournaments }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories: (string | 'All')[] = ['All', ...tournaments.map(t => t.name)];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'glass-header py-3' : 'bg-gradient-to-b from-black/60 to-transparent py-5'}`}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onSelectCategory('All')}>
              <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-zinc-950 fill-zinc-950" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">JBMR SPORTS</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onSelectCategory(category)}
                  className={`text-sm font-semibold tracking-wide transition-all duration-300 relative py-1 ${
                    activeCategory === category 
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {category}
                  {activeCategory === category && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button className="text-zinc-400 hover:text-emerald-400 transition-colors p-2 hover:bg-white/5 rounded-full">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-zinc-400 hover:text-emerald-400 transition-colors p-2 hover:bg-white/5 rounded-full relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all group"
                >
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-widest">Logout</span>
                </button>
                {/* Check for admin role - assuming your user object has it from App.tsx logic */}
                {user.email === 'jbmrsports@gmail.com' && (
                  <button 
                    onClick={() => {
                      // Trigger dashboard view in App.tsx
                      // App.tsx needs a way to receive this or we use a custom event/callback
                      window.dispatchEvent(new CustomEvent('toggle-admin-dashboard'));
                    }}
                    className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl hover:bg-emerald-500/20 transition-all group"
                  >
                    <User className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Dashboard</span>
                  </button>
                )}
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center overflow-hidden border border-white/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-zinc-950" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-6 py-2 rounded-xl hover:bg-zinc-800 transition-all group"
                >
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-widest">Login</span>
                </button>
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-3 bg-emerald-500 px-6 py-2 rounded-xl hover:bg-emerald-400 transition-all group"
                >
                  <span className="text-xs font-bold text-zinc-950 uppercase tracking-widest">Admin Access</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
