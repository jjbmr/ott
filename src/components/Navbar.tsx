import { Play, Search, User, Bell, LogOut, Bookmark, Shield } from 'lucide-react';
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Tournament } from '../data';

export interface NavbarHandle {
  toggleProfileMenu: () => void;
}

interface NavbarProps {
  activeCategory: string | 'All';
  onSelectCategory: (category: string | 'All') => void;
  onLoginClick: () => void;
  user: any;
  onLogout: () => void;
  tournaments: Tournament[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notificationCount: number;
  onNotificationClick: () => void;
}

const Navbar = forwardRef<NavbarHandle, NavbarProps>(({ activeCategory, onSelectCategory, onLoginClick, user, onLogout, tournaments, searchQuery, onSearchChange, notificationCount, onNotificationClick }, ref) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    toggleProfileMenu: () => {
      setShowProfileMenu(prev => !prev);
    }
  }));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const categories = [
    { id: 'All', label: 'All' },
    { id: 'Watchlist', label: 'Watchlist' },
    ...tournaments.map(t => ({ id: t.name, label: t.shortName || t.name }))
  ];

  return (
    <nav className={`sticky sm:fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'glass-header py-3' : 'bg-gradient-to-b from-black/60 to-transparent py-5'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group" onClick={() => onSelectCategory('All')}>
              <div className="bg-sky-500 p-1 sm:p-1.5 rounded-lg shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 fill-zinc-950" />
              </div>
              <span className="text-lg sm:text-2xl font-black tracking-tighter text-white whitespace-nowrap">JBMR SPORTS</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`text-sm font-semibold tracking-wide transition-all duration-300 relative py-1 ${
                    activeCategory === cat.id 
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                  {activeCategory === cat.id && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className={`flex items-center bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 transition-all duration-500 absolute sm:static top-full left-4 right-4 sm:left-auto sm:right-auto mt-2 sm:mt-0 ${showSearch ? 'scale-100 opacity-100 translate-y-0 sm:w-64' : 'scale-95 opacity-0 pointer-events-none -translate-y-4 sm:w-0'}`}>
              <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <input
                autoFocus={showSearch}
                type="text"
                placeholder="Search highlights..."
                className="bg-transparent border-none outline-none text-xs ml-3 w-full text-white font-medium"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`text-zinc-400 hover:text-sky-400 transition-colors p-2 hover:bg-white/5 rounded-full ${showSearch ? 'text-sky-400 bg-white/5' : ''}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={onNotificationClick}
              className="text-zinc-400 hover:text-sky-400 transition-colors p-1.5 sm:p-2 hover:bg-white/5 rounded-full relative"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-sky-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                  <span className="text-[7px] sm:text-[8px] font-black text-zinc-950">{notificationCount}</span>
                </div>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4 relative" ref={profileMenuRef}>
                <div 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-500 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 cursor-pointer hover:ring-2 hover:ring-sky-500/50 transition-all active:scale-95"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-zinc-950" />
                  )}
                </div>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[70]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                      <p className="text-xs font-black text-white truncate">{user.displayName || 'Sports Fan'}</p>
                      <p className="text-[10px] font-bold text-zinc-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          onSelectCategory('Watchlist');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-sky-400 transition-all text-left group"
                      >
                        <Bookmark className="w-4 h-4 group-hover:fill-sky-400" />
                        <span className="text-xs font-black uppercase tracking-widest">My Watchlist</span>
                      </button>

                      {user.email === 'jbmrsports@gmail.com' && (
                        <button 
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('toggle-admin-dashboard'));
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-500/10 text-zinc-400 hover:text-sky-500 transition-all text-left"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-xs font-black uppercase tracking-widest">Admin Dashboard</span>
                        </button>
                      )}

                      <div className="h-px bg-white/5 my-2" />

                      <button 
                        onClick={() => {
                          onLogout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-3 bg-sky-500 px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl hover:bg-sky-400 transition-all group shadow-lg shadow-sky-500/20"
                >
                  <span className="text-[10px] sm:text-xs font-black text-zinc-950 uppercase tracking-widest">Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
