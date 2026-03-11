import { Play, Plus, Info, Volume2, Share2 } from 'lucide-react';
import { Match } from '../data';

interface HeroProps {
  match: Match;
  onPlay: (match: Match) => void;
}

export default function Hero({ match, onPlay }: HeroProps) {
  const normalizedTitle = match.title.replace(/\s+/g, ' ').trim();
  const segments = normalizedTitle.split('||').map(segment => segment.trim()).filter(Boolean);
  const [primaryTitle, suggestedSecondary] = segments.length >= 2
    ? [segments[0], segments[1]]
    : ['Match Highlights', normalizedTitle];
  const secondaryTitle = suggestedSecondary || 'Teams';
  const heroTitleSize = normalizedTitle.length > 32
    ? 'text-[clamp(2.2rem,3vw,2.8rem)]'
    : 'text-[clamp(3rem,4vw,4.4rem)]';

  return (
    <div className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
      {/* Background with Professional Parallax Effect (Simulated) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-linear scale-110"
        style={{ backgroundImage: `url(${match.thumbnail})` }}
      />
      
      {/* Multi-layered Gradients for OTT feel */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Hero Content - Perfectly Aligned */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 w-full h-full flex items-center">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500 rounded-md shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">
                Trending
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.3em] text-glow-emerald">
              {match.tournament}
            </span>
          </div>

          <h1 className={`${heroTitleSize} font-black text-white leading-[1.05] tracking-tight drop-shadow-2xl uppercase`}>
            <span className="block text-[inherit]">
              {primaryTitle}
            </span>
            <span className="block mt-2 text-[clamp(2rem,3vw,2.6rem)] text-white/90 tracking-tight">
              {secondaryTitle}
            </span>
          </h1>

          <div className="flex items-center gap-6 text-sm font-bold text-zinc-300/80">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">98% Match</span>
            </div>
            <span className="px-1.5 py-0.5 border border-zinc-700 rounded text-[10px] uppercase">4K ULTRA HD</span>
            <div className="flex items-center gap-4">
              <span>{match.date}</span>
              <span>{match.duration}</span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">U/A 13+</span>
            </div>
          </div>

          <p className="text-xl text-zinc-400/90 leading-relaxed max-w-xl font-medium line-clamp-3">
            {match.description}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => onPlay(match)}
              className="group flex items-center gap-3 px-10 py-4 bg-white text-zinc-950 rounded-xl font-black hover:bg-emerald-400 hover:scale-105 transition-all duration-300 shadow-xl shadow-white/5"
            >
              <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
              <span className="uppercase tracking-widest text-sm">Play Now</span>
            </button>
            <button className="flex items-center gap-3 px-8 py-4 bg-zinc-800/60 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all backdrop-blur-md border border-white/10 group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span className="uppercase tracking-widest text-sm">Watchlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons (Right) */}
      <div className="absolute right-12 bottom-12 z-10 flex flex-col gap-4">
        <button className="p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:scale-110 transition-all">
          <Volume2 className="w-5 h-5" />
        </button>
        <button className="p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:scale-110 transition-all">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
