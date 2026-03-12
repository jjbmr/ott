import { Ad } from '../data';
import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface AdBannerProps {
  ad: Ad;
}

export default function AdBanner({ ad }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !ad.active) return null;

  const isVideo = ad.videoUrl.endsWith('.mp4') || ad.videoUrl.endsWith('.m3u8') || ad.type === 'video';

  if (ad.type === 'aston') {
    return (
      <div className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl animate-in slide-in-from-bottom-10 duration-700">
        <div className="relative glass-card rounded-2xl overflow-hidden shadow-2xl border-sky-500/20">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-all z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          <a 
            href={ad.linkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 sm:p-4 group"
          >
            <div className="relative flex-none w-20 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-900">
              {isVideo ? (
                <video src={ad.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={ad.videoUrl} className="w-full h-full object-cover" alt={ad.title} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Sponsored</span>
              <h4 className="text-sm sm:text-lg font-black text-white truncate leading-tight group-hover:text-sky-400 transition-colors uppercase">{ad.title}</h4>
              <p className="text-[10px] sm:text-xs font-medium text-zinc-400 truncate">Click to learn more about this exclusive offer</p>
            </div>
            <div className="hidden sm:flex flex-none items-center justify-center w-10 h-10 bg-sky-500 rounded-xl text-zinc-950 group-hover:scale-110 transition-transform">
              <ExternalLink className="w-5 h-5" />
            </div>
          </a>
        </div>
      </div>
    );
  }

  if (ad.type === 'video') {
    return (
      <div className="w-full bg-black relative group overflow-hidden border-b border-white/5">
        <div className="max-w-[1440px] mx-auto relative aspect-[21/9] sm:aspect-[32/9] lg:aspect-[48/9] max-h-[180px] sm:max-h-[220px]">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-4 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-all z-20"
          >
            <X className="w-4 h-4" />
          </button>
          
          <a 
            href={ad.linkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full h-full relative"
          >
            <div className="absolute inset-0">
              {isVideo ? (
                <video 
                  src={ad.videoUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={ad.videoUrl} 
                  className="w-full h-full object-cover" 
                  alt={ad.title} 
                />
              )}
              {/* Overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
            </div>

            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20">
              <span className="text-[10px] sm:text-xs font-black text-sky-500 uppercase tracking-[0.3em] mb-1">Sponsored</span>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight max-w-xl line-clamp-1">{ad.title}</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-sky-400 transition-colors">
                  Check Now
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    );
  }

  // Fallback for any other type (though we primarily use video and aston)
  return (
    <div className="w-full bg-zinc-950 border-b border-white/5 relative group overflow-hidden">
      <div className="max-w-[1440px] mx-auto relative h-12 sm:h-16 flex items-center px-4 sm:px-12">
        <div className="flex items-center gap-4 w-full">
          <div className="flex-none bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-sky-500/20">
            Ad
          </div>
          <a 
            href={ad.linkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 text-[10px] sm:text-sm font-bold text-zinc-300 hover:text-white transition-colors truncate pr-8"
          >
            {ad.title} — <span className="text-zinc-500 font-medium hidden sm:inline">Check out the latest from our sponsors.</span> <span className="text-sky-500">Learn More</span>
          </a>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 sm:right-12 p-1 text-zinc-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Animated Progress Bar for Ad */}
      <div className="absolute bottom-0 left-0 h-[1px] bg-sky-500/30 w-full overflow-hidden">
        <div className="h-full bg-sky-500 w-1/3 animate-[slide_3s_infinite_linear]" style={{
          animation: 'shimmer 2s infinite linear',
          backgroundImage: 'linear-gradient(to right, transparent, rgba(14, 165, 233, 0.5), transparent)'
        }} />
      </div>
    </div>
  );
}
