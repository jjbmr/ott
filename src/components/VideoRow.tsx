import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Match } from '../data';
import VideoCard from './VideoCard';

interface VideoRowProps {
  title: string;
  matches: Match[];
  onPlay: (match: Match) => void;
}

export default function VideoRow({ title, matches, onPlay }: VideoRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll);
      // Wait a bit for layout to settle
      const timer = setTimeout(handleScroll, 100);
      return () => {
        current.removeEventListener('scroll', handleScroll);
        clearTimeout(timer);
      };
    }
  }, [matches]);

  if (matches.length === 0) return null;

  return (
    <div className="py-6 sm:py-10 space-y-4 sm:space-y-6">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between group">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter flex items-center gap-2 sm:gap-3">
              {title}
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
            </h2>
            <div className="h-0.5 w-8 sm:w-12 bg-sky-500 rounded-full" />
          </div>
          
          <button className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-zinc-500 hover:text-sky-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 group/btn">
            <span className="hidden sm:inline">Explore All</span>
            <span className="sm:hidden">All</span>
            <div className="bg-zinc-900 p-1 sm:p-1.5 rounded-lg border border-white/5 group-hover/btn:bg-sky-500 group-hover/btn:text-zinc-950 transition-all">
              <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Professional Horizontal Scroll with Navigation */}
      <div className="relative group/row max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Navigation Buttons */}
        <div className={`absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-zinc-950 to-transparent z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-start ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => scroll('left')}
            className="pointer-events-auto bg-zinc-900/80 hover:bg-sky-500 text-white hover:text-zinc-950 p-2 sm:p-2.5 rounded-full border border-white/10 transition-all hover:scale-110 shadow-2xl ml-1 sm:ml-2"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        <div className={`absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-zinc-950 to-transparent z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-end ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => scroll('right')}
            className="pointer-events-auto bg-zinc-900/80 hover:bg-sky-500 text-white hover:text-zinc-950 p-2 sm:p-2.5 rounded-full border border-white/10 transition-all hover:scale-110 shadow-2xl mr-1 sm:mr-2"
          >
            <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
        
        <div 
          ref={scrollRef}
          className="relative w-full overflow-x-auto pb-4 sm:pb-6 hide-scrollbar scroll-smooth"
        >
          <div className="flex gap-4 sm:gap-8 w-max">
            {matches.map((match) => (
              <VideoCard key={match.id} match={match} onPlay={onPlay} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
