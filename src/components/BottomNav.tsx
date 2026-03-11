import { Home, Search, Bookmark, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 w-full bg-zinc-950/90 backdrop-blur-lg border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <button className="flex flex-col items-center justify-center w-full h-full text-emerald-500">
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-zinc-300 transition-colors">
          <Search className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-zinc-300 transition-colors">
          <Bookmark className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Watchlist</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-zinc-300 transition-colors">
          <User className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
