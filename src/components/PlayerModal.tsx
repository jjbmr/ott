import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Settings, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Match, Ad } from '../data';
import { getYouTubeId } from '../utils';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

interface PlayerModalProps {
  match: Match | null;
  onClose: () => void;
  onPlay: (match: Match) => void;
}

export default function PlayerModal({ match, onClose, onPlay }: PlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [qualities, setQualities] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 for Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const hlsRef = useRef<Hls | null>(null);
  
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [adTimeRemaining, setAdTimeRemaining] = useState(0);

  const youtubeId = match?.videoType === 'youtube' ? getYouTubeId(match.videoUrl) : null;

  useEffect(() => {
    const fetchAndPlayAd = async () => {
      try {
        const adsSnapshot = await get(ref(db, 'ads'));
        if (adsSnapshot.exists()) {
          const adsList = Object.values(adsSnapshot.val()) as Ad[];
          const videoAds = adsList.filter(ad => ad.active && ad.type === 'video');
          if (videoAds.length > 0) {
            const randomAd = videoAds[Math.floor(Math.random() * videoAds.length)];
            setActiveAd(randomAd);
            setShowAdOverlay(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      }
    };

    if (match) {
      fetchAndPlayAd();
      setIsPlaying(true);
      setHasEnded(false);
      setProgress(0);
    }
  }, [match]);

  useEffect(() => {
    if (match && videoRef.current && match.videoType !== 'youtube' && !showAdOverlay) {
      const video = videoRef.current;
      const isHLS = match.videoUrl.includes('.m3u8');

      if (isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(match.videoUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const availableQualities = hls.levels.map((level, index) => ({
              id: index,
              height: level.height,
              bitrate: level.bitrate
            }));
            setQualities(availableQualities);
            video.play().catch(console.error);
          });
          return () => {
            hls.destroy();
            hlsRef.current = null;
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

  const changeQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
      setShowQualityMenu(false);
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
        {/* Ad Overlay */}
        {showAdOverlay && activeAd && (
          <div className="absolute inset-0 z-40 bg-black">
            <video
              ref={adVideoRef}
              src={activeAd.videoUrl}
              className="w-full h-full object-contain"
              autoPlay
              onTimeUpdate={() => {
                if (adVideoRef.current) {
                  setAdTimeRemaining(Math.ceil(adVideoRef.current.duration - adVideoRef.current.currentTime));
                }
              }}
              onEnded={() => setShowAdOverlay(false)}
            />
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                Advertisement
              </span>
              <span className="px-3 py-1 bg-sky-500 rounded-lg text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em]">
                {adTimeRemaining}s
              </span>
            </div>
            {activeAd.linkUrl && (
              <a 
                href={activeAd.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-6 left-6 flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-xl"
              >
                Learn More
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button 
              onClick={() => setShowAdOverlay(false)}
              className="absolute bottom-6 right-6 px-6 py-3 bg-zinc-900/80 backdrop-blur-md text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-zinc-950 transition-all border border-white/10"
            >
              Skip Ad
            </button>
          </div>
        )}

        {/* Video Player */}
        {!showAdOverlay && (match.videoType === 'youtube' ? (
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
        ))}

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
              
              <div className="flex items-center gap-4">
                {qualities.length > 0 && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowQualityMenu(!showQualityMenu)} 
                      className="text-white hover:text-sky-400 transition-colors flex items-center gap-1.5"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {currentQuality === -1 ? 'Auto' : `${qualities[currentQuality].height}p`}
                      </span>
                    </button>

                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-4 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[120px] animate-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 border-b border-white/5 bg-white/5">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Quality</p>
                        </div>
                        <button
                          onClick={() => changeQuality(-1)}
                          className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5 transition-colors ${currentQuality === -1 ? 'text-sky-500' : 'text-zinc-400'}`}
                        >
                          Auto
                        </button>
                        {[...qualities].reverse().map((q) => (
                          <button
                            key={q.id}
                            onClick={() => changeQuality(q.id)}
                            className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-white/5 transition-colors ${currentQuality === q.id ? 'text-sky-500' : 'text-zinc-400'}`}
                          >
                            {q.height}p
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <button onClick={toggleFullScreen} className="text-white hover:text-sky-400 transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
