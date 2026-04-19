import { Tournament } from '../data';
import { Play } from 'lucide-react';

interface TournamentRailProps {
  tournaments: Tournament[];
  activeCategory: string;
  onSelectCategory: (name: string) => void;
}

export default function TournamentRail({ tournaments, activeCategory, onSelectCategory }: TournamentRailProps) {
  return (
    <div className="py-6 sm:py-10 space-y-4 sm:space-y-6">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tighter uppercase">Popular Tournaments</h2>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-4 sm:gap-6 min-w-max pb-4">
          {/* 'All' Card */}
          <button 
            onClick={() => onSelectCategory('All')}
            className={`group relative w-44 sm:w-64 aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-105 ${
              activeCategory === 'All' 
                ? 'border-sky-500 shadow-2xl shadow-sky-500/20' 
                : 'border-white/5 bg-zinc-900/50 hover:border-white/20'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
              <div className={`p-2 sm:p-3 rounded-full border-2 transition-colors ${activeCategory === 'All' ? 'border-sky-500 bg-sky-500/10' : 'border-zinc-700'}`}>
                <Play className={`w-4 h-4 sm:w-6 sm:h-6 ${activeCategory === 'All' ? 'text-sky-400 fill-sky-400' : 'text-zinc-500'}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] ${activeCategory === 'All' ? 'text-sky-400' : 'text-zinc-500'}`}>
                All Tournaments
              </span>
            </div>
          </button>

          {/* Tournament Cards */}
          {tournaments.map((t) => (
            <button 
              key={t.id}
              onClick={() => onSelectCategory(t.name)}
              className={`group relative w-44 sm:w-64 aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-105 ${
                activeCategory === t.name 
                  ? 'border-sky-500 shadow-2xl shadow-sky-500/20' 
                  : 'border-white/5 bg-zinc-900/50 hover:border-white/20'
              }`}
            >
              {t.logo ? (
                <div className="absolute inset-0 bg-zinc-950">
                  <img src={t.logo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={t.name} loading="lazy" />
                  <div className={`absolute inset-0 bg-black/40 transition-opacity ${activeCategory === t.name ? 'opacity-0' : 'opacity-40 group-hover:opacity-0'}`} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center p-4 sm:p-6 text-center">
                  <span className={`text-base sm:text-xl font-black uppercase tracking-tighter ${activeCategory === t.name ? 'text-sky-400' : 'text-zinc-600 group-hover:text-white'}`}>
                    {t.name}
                  </span>
                </div>
              )}
              
              {/* Active Glow */}
              {activeCategory === t.name && (
                <div className="absolute inset-0 ring-4 ring-sky-500/30 rounded-xl sm:rounded-2xl" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
