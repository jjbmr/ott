import { Play, Plus, Share2 } from 'lucide-react';
import { Match } from '../data';

interface VideoCardProps {
  match: Match;
  onPlay: (match: Match) => void;
}

export default function VideoCard({ match, onPlay }: VideoCardProps) {
  return (
    <div 
      className="group relative flex-none w-[280px] sm:w-[320px] md:w-[380px] cursor-pointer transition-all duration-500 ease-out"
      onClick={() => onPlay(match)}
    >
      {/* Thumbnail Container - Professional Ratio & Shadow */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/5 group-hover:border-emerald-500/30 transition-all duration-500">
        <img 
          src={match.thumbnail} 
          alt={match.title}
          className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Modern OTT Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
          <div className="flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
              <Play className="w-5 h-5 text-zinc-950 fill-zinc-950 ml-0.5" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(match.videoUrl);
              }}
              className="bg-zinc-800/90 backdrop-blur-md p-3 rounded-xl hover:bg-zinc-700 transition-colors border border-white/10"
              title="Copy link"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button className="bg-zinc-800/90 backdrop-blur-md p-3 rounded-xl hover:bg-zinc-700 transition-colors border border-white/10 ml-auto">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Duration Badge - Sleek Design */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-zinc-950/80 text-white text-[10px] font-black rounded-md backdrop-blur-md border border-white/10 tracking-widest group-hover:opacity-0 transition-opacity duration-300">
          {match.duration}
        </div>
        
        {/* Progress Bar (Simulated Continue Watching) */}
        <div className="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full opacity-60">
          <div className="h-full bg-emerald-500 w-[30%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

      {/* Details - Perfectly Aligned */}
      <div className="mt-4 px-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] text-glow-emerald">
            {match.tournament}
          </span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {match.views} views
          </span>
        </div>
        {match.stage && (
          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            {match.stage}
          </div>
        )}
        <VideoTitle title={match.title} />
        <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500">
          <span>{match.date}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="text-zinc-600">4K • 5.1 AUDIO</span>
        </div>
      </div>
    </div>
  );
}

interface VideoTitleProps {
  title: string;
}

function VideoTitle({ title }: VideoTitleProps) {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();
  const segments = normalizedTitle.split('||').map(segment => segment.trim()).filter(Boolean);
  const [lineOne, lineTwo] = segments.length >= 2
    ? [segments[0], segments[1]]
    : [normalizedTitle, ''];

  return (
    <h3 className="text-base font-bold text-zinc-100 leading-tight transition-colors duration-300 group-hover:text-emerald-400">
      <span className="block uppercase text-[0.85rem] tracking-tight text-white">
        {lineOne}
      </span>
      {lineTwo ? (
        <span className="block mt-1 uppercase text-[0.75rem] tracking-tight text-white/70">
          {lineTwo}
        </span>
      ) : null}
    </h3>
  );
}
