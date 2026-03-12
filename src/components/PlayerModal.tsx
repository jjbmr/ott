import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Match } from '../data';
import { getYouTubeId } from '../utils';

interface PlayerModalProps {
  match: Match | null;
  onClose: () => void;
  onPlay: (match: Match) => void;
}

export default function PlayerModal({ match, onClose, onPlay }: PlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  
  const youtubeId = match?.videoType === 'youtube' ? getYouTubeId(match.videoUrl) : null;

  useEffect(() => {
    if (match && videoRef.current && match.videoType !== 'youtube') {
      const video = videoRef.current;
      const isHLS = match.videoUrl.includes('.m3u8');

      if (isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(match.videoUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(console.error);
          });
          return () => {
            hls.destroy();
          };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS
          video.src = match.videoUrl;
          video.play().catch(console.error);
        }
      } else {
        // Standard mp4
        video.src = match.videoUrl;
        video.play().catch(console.error);
      }

      setIsPlaying(true);
      setHasEnded(false);
      setProgress(0);
    }
  }, [match]);

  if (!match) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (hasEnded) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setHasEnded(false);
        setIsPlaying(true);
      } else if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 bg-zinc-800/50 hover:bg-zinc-700/80 text-white rounded-full transition-colors backdrop-blur-md"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-6xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
        {/* Video Player */}
        {match.videoType === 'youtube' ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              setHasEnded(true);
            }}
            onClick={togglePlay}
            autoPlay
          />
        )}

        {/* Replay Overlay */}
        {hasEnded && (
          <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-white mb-6">Highlight Ended</h3>
            <button 
              onClick={togglePlay}
              className="mt-6 flex items-center gap-3 px-8 py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-sky-500/20"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Replay Highlight</span>
            </button>
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-6 ${hasEnded || match.videoType === 'youtube' ? 'hidden' : ''}`}>
          <div className="pointer-events-auto space-y-4">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress relative">
              <div 
                className="h-full bg-sky-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-sky-400 transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-sky-400 transition-colors">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <div className="ml-4">
                  <h3 className="text-white font-bold text-lg">{match.title}</h3>
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">{match.tournament} • {match.duration}</p>
                </div>
              </div>
              
              <button onClick={toggleFullScreen} className="text-white hover:text-sky-400 transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
