import { Home, Search, Bookmark, User } from 'lucide-react';

interface BottomNavProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onSearchClick: () => void;
  onLoginClick: () => void;
  onProfileClick: () => void;
  user: any;
}

export default function BottomNav({ activeCategory, onSelectCategory, onSearchClick, onLoginClick, onProfileClick, user }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 w-full bg-zinc-950/90 backdrop-blur-lg border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <button 
          onClick={() => onSelectCategory('All')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeCategory === 'All' ? 'text-sky-500' : 'text-zinc-500'}`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Search className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button 
          onClick={() => onSelectCategory('Watchlist')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeCategory === 'Watchlist' ? 'text-sky-500' : 'text-zinc-500'}`}
        >
          <Bookmark className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Watchlist</span>
        </button>
        <button 
          onClick={user ? onProfileClick : onLoginClick}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${user ? 'text-sky-500' : 'text-zinc-500'}`}
        >
          {user && user.photoURL ? (
            <img src={user.photoURL} className="w-6 h-6 rounded-full border border-white/10 mb-1" alt="Profile" />
          ) : (
            <User className="w-5 h-5 mb-1" />
          )}
          <span className="text-[10px] font-medium">{user ? 'Profile' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
}
