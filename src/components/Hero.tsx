import { Play, Plus, Volume2, VolumeX, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Match } from '../data';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getYouTubeId } from '../utils';

interface HeroProps {
  matches: Match[];
  onPlay: (match: Match) => void;
}

export default function Hero({ matches, onPlay }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (!matches || matches.length === 0) return null;

  const match = matches[currentIndex];
  if (!match) return null;

  const normalizedTitle = match.title.replace(/\s+/g, ' ').trim();
  const segments = normalizedTitle.split('||').map(segment => segment.trim()).filter(Boolean);
  
  // Dynamic Title Logic: Use || separator if exists, otherwise Title + Tournament
  const [primaryTitle, secondaryTitle] = segments.length >= 2
    ? [segments[0], segments[1]]
    : [normalizedTitle, match.tournament || 'Latest Highlights'];
  
  const heroTitleSize = primaryTitle.length > 32
    ? 'text-[clamp(1.1rem,4vw,2.2rem)] sm:text-[clamp(1.4rem,4vw,2.2rem)]'
    : 'text-[clamp(1.4rem,5vw,3.5rem)] sm:text-[clamp(1.8rem,5vw,3.5rem)]';

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="relative pt-0 h-auto sm:h-[75vh] lg:h-[85vh] w-full flex flex-col sm:flex-row items-center justify-center overflow-hidden bg-zinc-950">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 200, damping: 25 },
            opacity: { duration: 0.8, ease: "easeInOut" }
          }}
          className="relative sm:absolute inset-0 flex flex-col sm:block"
        >
          {/* Background / Player Area */}
          <div className="relative w-full aspect-video sm:absolute sm:inset-0 sm:aspect-auto sm:h-full bg-black overflow-hidden">
            {!match.thumbnail || match.thumbnail === '' ? (
              <div className="absolute inset-0">
                {match.videoType === 'youtube' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(match.videoUrl)}?autoplay=1&mute=${isMuted ? '1' : '0'}&controls=0&loop=1&playlist=${getYouTubeId(match.videoUrl)}&rel=0&modestbranding=1`}
                    className="w-full h-[140%] -translate-y-[15%] pointer-events-none scale-125 sm:scale-110 sm:h-[120%] sm:-translate-y-[10%]"
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <video
                    src={match.videoUrl}
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    className="w-full h-full object-cover scale-110"
                  />
                )}
              </div>
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-out scale-110"
                style={{ backgroundImage: `url(${match.thumbnail})` }}
              />
            )}
            
            {/* Multi-layered Gradients for OTT feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent sm:block" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent hidden sm:block" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Hero Content - Perfectly Aligned */}
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 w-full h-full flex items-center pt-6 sm:pt-0 bg-zinc-950 sm:bg-transparent pb-8 sm:pb-0">
            <div className="max-w-3xl space-y-3 sm:space-y-6 w-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-500 rounded-md shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-zinc-950 rounded-full animate-pulse" />
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">
                    Latest
                  </span>
                </div>
                <span className="text-[9px] sm:text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] line-clamp-1">
                  {match.tournamentShortName || match.tournament} Exclusive
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${heroTitleSize} font-black text-white leading-[1] sm:leading-[0.95] tracking-tight drop-shadow-2xl uppercase`}
              >
                <span className="block opacity-95">
                  {primaryTitle}
                </span>
                <span className="block mt-0.5 sm:mt-2 text-[clamp(0.9rem,3vw,2rem)] text-sky-500 tracking-tight drop-shadow-[0_0_15px_rgba(14,165,233,0.4)]">
                  {secondaryTitle}
                </span>
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2 sm:gap-8 text-[9px] sm:text-[13px] font-black text-zinc-300 uppercase tracking-widest"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-500 whitespace-nowrap">98% Match</span>
                </div>
                <span className="px-1 py-0.5 border border-zinc-700 sm:border-2 rounded-[4px] text-[8px] sm:text-[11px] uppercase font-black tracking-widest text-sky-500">
                  {match.quality === '4K' ? '4K' : 'HD'}
                </span>
                <div className="flex items-center gap-3 sm:gap-6 opacity-60">
                  <span className="whitespace-nowrap">{match.date}</span>
                  <span className="whitespace-nowrap">{match.duration}</span>
                </div>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[10px] sm:text-base lg:text-lg text-zinc-400/80 leading-relaxed max-w-xl font-medium line-clamp-2 sm:line-clamp-3"
              >
                {match.description}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-4"
              >
                <button
                  onClick={() => onPlay(match)}
                  className="flex-1 sm:flex-none group flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-white text-zinc-950 rounded-lg sm:rounded-xl font-black hover:bg-sky-400 hover:scale-105 transition-all duration-300 shadow-xl shadow-white/5"
                >
                  <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-current group-hover:scale-110 transition-transform" />
                  <span className="uppercase tracking-widest text-[10px] sm:text-sm">Play Now</span>
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 bg-zinc-800/60 text-white rounded-lg sm:rounded-xl font-bold hover:bg-zinc-700 transition-all backdrop-blur-md border border-white/10 group">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" />
                  <span className="uppercase tracking-widest text-[10px] sm:text-sm">Watchlist</span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slider Controls & Preview */}
      <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-6 lg:left-12 right-4 sm:right-6 lg:right-12 z-20 hidden sm:flex items-end justify-between pointer-events-none">
        {/* Navigation Dots */}
        <div className="flex gap-1.5 sm:gap-2 pointer-events-auto">
          {matches.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-6 sm:w-8 bg-sky-500' : 'bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>

        {/* Square Preview Box (Right) - Hidden on very small screens */}
        <div className="hidden sm:flex gap-2 sm:gap-3 pointer-events-auto">
          {matches.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`relative w-12 sm:w-16 lg:w-20 aspect-square rounded-lg sm:rounded-xl overflow-hidden border transition-all duration-300 hover:scale-110 ${
                idx === currentIndex 
                ? 'border-sky-500 shadow-lg shadow-sky-500/20 scale-105 sm:border-2' 
                : 'border-white/10 grayscale hover:grayscale-0'
              }`}
            >
              {!m.thumbnail || m.thumbnail === '' ? (
                <div className="w-full h-full bg-zinc-800">
                  {m.videoType === 'youtube' ? (
                    <img 
                      src={`https://img.youtube.com/vi/${getYouTubeId(m.videoUrl)}/mqdefault.jpg`} 
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                      loading="lazy"
                    />
                  ) : (
                    <video src={m.videoUrl} className="w-full h-full object-cover" muted />
                  )}
                </div>
              ) : (
                <img src={m.thumbnail} className="w-full h-full object-cover" alt="Preview" loading="lazy" />
              )}
              {idx === currentIndex && (
                <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Buttons - Positioned differently on mobile/desktop */}
      <div className="absolute right-4 sm:right-6 lg:right-12 top-4 sm:top-auto sm:bottom-40 z-20 flex flex-col gap-3 sm:gap-4 pointer-events-auto">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 sm:p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:scale-110 transition-all shadow-xl pointer-events-auto"
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({
                title: match.title,
                text: match.description,
                url: window.location.href,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied!');
            }
          }}
          className="p-2 sm:p-3 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:scale-110 transition-all shadow-xl"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      
      {/* Mobile Navigation Dots (Centered) */}
      <div className="sm:hidden flex gap-1.5 py-4 justify-center bg-zinc-950">
        {matches.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-6 bg-sky-500' : 'bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
