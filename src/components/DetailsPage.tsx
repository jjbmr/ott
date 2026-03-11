import { ChevronLeft, Play, Share2, Plus, Volume2, Maximize, Clock, Calendar, Eye } from 'lucide-react';
import { Match, Tournament } from '../data';
import VideoCard from './VideoCard';

interface DetailsPageProps {
  match: Match;
  allMatches: Match[];
  tournaments: Tournament[];
  onBack: () => void;
  onPlay: (match: Match) => void;
}

export default function DetailsPage({ match, allMatches, tournaments, onBack, onPlay }: DetailsPageProps) {
  const tournament = tournaments.find(t => t.id === match.tournamentId);
  const relatedMatches = allMatches.filter(m => m.tournamentId === match.tournamentId && m.id !== match.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-20 animate-in fade-in duration-500">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 glass-header py-4 px-6 lg:px-12 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <div className="bg-zinc-900 p-2 rounded-xl border border-white/5 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Back to Browse</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1 rounded-lg">
            <Play className="w-4 h-4 text-zinc-950 fill-zinc-950" />
          </div>
          <span className="text-sm font-black tracking-tighter">JBMR SPORTS</span>
        </div>
      </nav>

      <main className="pt-24 max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Video Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl ring-1 ring-white/10 group">
              <video 
                src={match.videoUrl} 
                className="w-full h-full object-cover"
                controls
                autoPlay
              />
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-3 py-1 bg-emerald-500 text-zinc-950 text-[10px] font-black rounded-md uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  {tournament?.name || match.tournament} {tournament?.year}
                </span>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {match.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {match.duration}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {match.views} Views</span>
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                {match.title}
              </h1>

              <div className="flex items-center gap-4 py-2">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-xl font-black hover:bg-emerald-400 transition-all uppercase tracking-widest text-xs">
                  <Plus className="w-4 h-4" /> Add to Watchlist
                </button>
                <button className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 bg-zinc-900/40 rounded-3xl border border-white/5 space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Match Description</h3>
                <p className="text-lg text-zinc-300 leading-relaxed font-medium">
                  {match.description}
                </p>
              </div>
            </div>
          </div>

          {/* Related Sidebar */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">More from this Tournament</h2>
            </div>
            
            <div className="space-y-6">
              {relatedMatches.length > 0 ? (
                relatedMatches.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => onPlay(m)}
                    className="group flex gap-4 cursor-pointer"
                  >
                    <div className="relative flex-none w-40 aspect-video rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 group-hover:ring-emerald-500/30 transition-all">
                      <img src={m.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-100 line-clamp-2 group-hover:text-emerald-400 transition-colors leading-tight">
                        {m.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <span>{m.duration}</span>
                        <span>•</span>
                        <span>{m.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                  <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">No more highlights</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
