import { ChevronRight } from 'lucide-react';
import { Match } from '../data';
import VideoCard from './VideoCard';

interface VideoRowProps {
  title: string;
  matches: Match[];
  onPlay: (match: Match) => void;
}

export default function VideoRow({ title, matches, onPlay }: VideoRowProps) {
  if (matches.length === 0) return null;

  return (
    <div className="py-10 space-y-6">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between group">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              {title}
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </h2>
            <div className="h-0.5 w-12 bg-emerald-500 rounded-full" />
          </div>
          
          <button className="flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-emerald-400 uppercase tracking-[0.2em] transition-all duration-300 group/btn">
            Explore All
            <div className="bg-zinc-900 p-1.5 rounded-lg border border-white/5 group-hover/btn:bg-emerald-500 group-hover/btn:text-zinc-950 transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Professional Horizontal Scroll with Edge Fades */}
      <div className="relative group/row">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative w-full max-w-[1440px] mx-auto overflow-x-auto pb-6 hide-scrollbar px-6 lg:px-12">
          <div className="flex gap-8 w-max">
            {matches.map((match) => (
              <VideoCard key={match.id} match={match} onPlay={onPlay} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
