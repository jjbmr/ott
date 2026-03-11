import { Tournament } from '../data';

interface TournamentRailProps {
  tournaments: Tournament[];
  activeCategory: string;
  onSelectCategory: (name: string) => void;
}

export default function TournamentRail({ tournaments, activeCategory, onSelectCategory }: TournamentRailProps) {
  return (
    <div className="py-8 max-w-[1440px] mx-auto px-6 lg:px-12 overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-10 min-w-max">
        {/* 'All' Circle */}
        <button 
          onClick={() => onSelectCategory('All')}
          className="flex flex-col items-center gap-3 group transition-all"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            activeCategory === 'All' 
              ? 'border-emerald-500 bg-emerald-500/10 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'border-white/10 bg-zinc-900 group-hover:border-white/30'
          }`}>
            <span className={`text-xs font-black uppercase tracking-widest ${activeCategory === 'All' ? 'text-emerald-400' : 'text-zinc-500'}`}>All</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeCategory === 'All' ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-white'}`}>
            Browse
          </span>
        </button>

        {/* Tournament Circles */}
        {tournaments.map((t) => (
          <button 
            key={t.id}
            onClick={() => onSelectCategory(t.name)}
            className="flex flex-col items-center gap-3 group transition-all"
          >
            <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-300 relative ${
              activeCategory === t.name 
                ? 'border-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'border-white/10 bg-zinc-900 group-hover:border-white/30'
            }`}>
              {/* Dynamic Initial or Placeholder for Tournament Logo */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                <span className={`text-xl font-black ${activeCategory === t.name ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-white'}`}>
                  {t.name.charAt(0)}
                </span>
              </div>
              
              {/* Status Dot */}
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeCategory === t.name ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-white'}`}>
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
