import { ChevronLeft, Play, Share2, Plus, Volume2, Maximize, Clock, Calendar, Eye, Check, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Match, Tournament, Standing } from '../data';
import VideoCard from './VideoCard';
import { getThumbnailUrl, getYouTubeId } from '../utils';
import PointsTable from './PointsTable';

import TournamentRail from './TournamentRail';

interface DetailsPageProps {
  match: Match;
  allMatches: Match[];
  tournaments: Tournament[];
  watchlist: string[];
  activeCategory: string;
  onToggleWatchlist: (id: string) => void;
  onBack: () => void;
  onPlay: (match: Match) => void;
  onSelectCategory: (category: string) => void;
}

interface ScorecardData {
  team1: { name: string; score: string; overs: string };
  team2: { name: string; score: string; overs: string };
  status: string;
  batting: Array<{ name: string; runs: string; balls: string; fours: string; sr: string }>;
  bowling: Array<{ name: string; overs: string; maidens: string; runs: string; wickets: string }>;
}

function PlaylistTitle({ title, stage }: { title: string; stage?: string }) {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();
  const segments = normalizedTitle.split('|').map(segment => segment.trim()).filter(Boolean);
  
  return (
    <div className="space-y-1">
      {stage && (
        <p className="text-[9px] sm:text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]">
          {stage.toLowerCase().includes('match') && !stage.includes('-') ? stage.replace(/match\s*(\d+)/i, 'Match - $1') : stage}
        </p>
      )}
      {segments.length >= 2 ? (
        <>
          <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
            {segments.slice(0, segments.length - 1).join(' | ')}
          </p>
          <h4 className="text-[10px] sm:text-[12px] font-black text-zinc-100 leading-tight group-hover:text-sky-400 transition-colors uppercase break-words tracking-tight">
            {segments[segments.length - 1]}
          </h4>
        </>
      ) : (
        <h4 className="text-[10px] sm:text-[12px] font-black text-zinc-100 leading-tight group-hover:text-sky-400 transition-colors uppercase break-words tracking-tight">
          {normalizedTitle}
        </h4>
      )}
    </div>
  );
}

export default function DetailsPage({ match, allMatches, tournaments, watchlist, activeCategory, onToggleWatchlist, onBack, onPlay, onSelectCategory }: DetailsPageProps) {
  const [localScorecard, setLocalScorecard] = useState<ScorecardData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);
  
  const tournament = tournaments.find(t => t.id === match.tournamentId);
  const isWatchlisted = watchlist.includes(match.id);
  const relatedMatches = allMatches.filter(m => m.tournamentId === match.tournamentId && m.id !== match.id);
  
  const youtubeId = match.videoType === 'youtube' ? getYouTubeId(match.videoUrl) : null;

  useEffect(() => {
    // Fetch standings for this tournament
    const fetchStandings = async () => {
      try {
        const res = await fetch('/api/standings');
        const data = await res.json();
        const tournamentStandings = data.filter((s: Standing) => s.tournamentId === match.tournamentId);
        setStandings(tournamentStandings);
      } catch (err) {
        console.error('Error fetching standings:', err);
      }
    };
    fetchStandings();
  }, [match.tournamentId]);

  useEffect(() => {
    const fetchScorecard = async () => {
      // Priority 1: External API (CrickDB)
      if (match.externalMatchId) {
        try {
          // First try active tournaments
          let res = await fetch('https://crickdbmodule-api-144271912366.asia-south1.run.app/api/tournaments/list-public?activeOnly=true');
          let data = await res.json();
          
          let foundMatch = null;
          for (const t of data.tournaments || []) {
            foundMatch = t.matches?.find((m: any) => m.matchId === match.externalMatchId);
            if (foundMatch) break;
          }

          // If not found in active, try all tournaments
          if (!foundMatch) {
            res = await fetch('https://crickdbmodule-api-144271912366.asia-south1.run.app/api/tournaments/list-public');
            data = await res.json();
            for (const t of data.tournaments || []) {
              foundMatch = t.matches?.find((m: any) => m.matchId === match.externalMatchId);
              if (foundMatch) break;
            }
          }

          if (foundMatch) {
            const inn1 = foundMatch.innings?.find((i: any) => i.inningsNumber === 1);
            const inn2 = foundMatch.innings?.find((i: any) => i.inningsNumber === 2);
            
            const externalData: ScorecardData = {
              team1: { 
                name: foundMatch.team1.shortName || foundMatch.team1.name, 
                score: inn1 ? `${inn1.runs}/${inn1.wickets}` : '0/0', 
                overs: inn1 ? `${inn1.overs}` : '0' 
              },
              team2: { 
                name: foundMatch.team2.shortName || foundMatch.team2.name, 
                score: inn2 ? `${inn2.runs}/${inn2.wickets}` : (inn1 ? 'Yet to bat' : '0/0'), 
                overs: inn2 ? `${inn2.overs}` : '0' 
              },
              status: foundMatch.result || foundMatch.status || 'Live',
              batting: [], 
              bowling: []
            };
            setLocalScorecard(externalData);
            return;
          }
        } catch (err) {
          console.error('External scorecard fetch error:', err);
        }
      }

      // Priority 2: Local JSON (scorecards.json)
      if (match.scoreCardId) {
        fetch('data/scorecards.json')
          .then(res => res.json())
          .then(data => {
            if (data[match.scoreCardId!]) {
              setLocalScorecard(data[match.scoreCardId!]);
            } else {
              setLocalScorecard(null);
            }
          })
          .catch(err => {
            console.error('Scorecard fetch error:', err);
            setLocalScorecard(null);
          });
      } else if (!match.externalMatchId) {
        setLocalScorecard(null);
      }
    };

    fetchScorecard();
    const interval = setInterval(fetchScorecard, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [match.scoreCardId, match.externalMatchId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-20 animate-in fade-in duration-500">
      <main className="pt-4 sm:pt-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Simple Back Navigation */}
        <div className="mb-4 sm:mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-[0.2em] transition-all group"
          >
            <div className="bg-zinc-900 p-1.5 sm:p-2 rounded-lg border border-white/5 group-hover:bg-sky-500 group-hover:text-zinc-950 transition-all">
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            Back to Browse
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          {/* Main Video Section */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-8">
            <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl ring-1 ring-white/10 group">
              {match.videoType === 'youtube' && youtubeId ? (
                <iframe 
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={match.videoUrl} 
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                />
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-500 text-zinc-950 text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-widest shadow-lg shadow-sky-500/20">
                  {tournament?.name || match.tournament} {tournament?.year}
                </span>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {match.date}</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {match.duration}</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {match.views}</span>
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[9px] font-black uppercase tracking-widest border border-white/5">
                    {match.quality || '4K'}
                  </span>
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tighter leading-tight">
                {match.title}
              </h1>

              <div className="flex items-center gap-3 sm:gap-4 py-1 sm:py-2">
                <button 
                  onClick={() => onToggleWatchlist(match.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black transition-all uppercase tracking-widest text-[10px] sm:text-xs ${
                    isWatchlisted 
                      ? 'bg-sky-500 text-zinc-950 hover:bg-sky-400' 
                      : 'bg-white text-zinc-950 hover:bg-sky-400'
                  }`}
                >
                  {isWatchlisted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
                </button>
                {match.videoType === 'youtube' && (
                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black transition-all uppercase tracking-widest text-[10px] sm:text-xs ${
                      showChat 
                        ? 'bg-sky-500 text-zinc-950 hover:bg-sky-400' 
                        : 'bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {showChat ? 'Hide Chat' : 'Live Chat'}
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: match.title,
                        text: match.description,
                        url: window.location.href,
                      });
                    } else {
                      alert('Share link copied to clipboard!');
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="p-2.5 sm:p-3 bg-zinc-900 border border-white/10 rounded-lg sm:rounded-xl text-zinc-400 hover:text-white transition-all"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-8 bg-zinc-900/40 rounded-2xl sm:rounded-3xl border border-white/5 space-y-2 sm:space-y-4">
                <h3 className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Description</h3>
                <p className="text-xs sm:text-base text-zinc-300 leading-relaxed font-medium">
                  {match.description}
                </p>
              </div>

              {showChat && youtubeId && (
                <div className="p-1 sm:p-2 bg-zinc-900/40 rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden">
                  <iframe 
                    src={`https://www.youtube.com/live_chat?v=${youtubeId}&embed_domain=${window.location.hostname}`}
                    className="w-full h-[400px] sm:h-[500px] rounded-xl sm:rounded-2xl"
                  />
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest text-center py-2 italic">YouTube Live Chat Integration</p>
                </div>
              )}

              {localScorecard ? (
                /* Dynamic Scorecard from JSON */
                <div className="p-5 sm:p-8 bg-zinc-900/40 rounded-2xl sm:rounded-3xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-[9px] sm:text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]">Match Scorecard</h3>
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 text-[8px] font-black rounded uppercase tracking-widest">Final</span>
                  </div>

                  {/* Score Header */}
                  <div className="grid grid-cols-2 gap-4 items-center bg-zinc-950/50 p-6 rounded-2xl border border-white/5">
                    <div className="text-center space-y-2 border-r border-white/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{localScorecard.team1.name}</p>
                      <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{localScorecard.team1.score}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 opacity-60">({localScorecard.team1.overs}) Overs</p>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{localScorecard.team2.name}</p>
                      <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{localScorecard.team2.score}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 opacity-60">({localScorecard.team2.overs}) Overs</p>
                    </div>
                  </div>

                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] text-center pt-2">
                    {localScorecard.status}
                  </p>

                  {/* Batsmen Table */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Top Performers</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">
                            <th className="pb-2 pl-2">Batter</th>
                            <th className="pb-2 text-right">R</th>
                            <th className="pb-2 text-right">B</th>
                            <th className="pb-2 text-right">4s</th>
                            <th className="pb-2 text-right pr-2">SR</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-zinc-300">
                          {localScorecard.batting.map((b, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 pl-2">{b.name}</td>
                              <td className="py-3 text-right text-white">{b.runs}</td>
                              <td className="py-3 text-right">{b.balls}</td>
                              <td className="py-3 text-right text-sky-500">{b.fours}</td>
                              <td className="py-3 text-right pr-2">{b.sr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bowlers Table */}
                  <div className="space-y-3 pt-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">
                            <th className="pb-2 pl-2">Bowler</th>
                            <th className="pb-2 text-right">O</th>
                            <th className="pb-2 text-right">M</th>
                            <th className="pb-2 text-right">R</th>
                            <th className="pb-2 text-right pr-2">W</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-zinc-300">
                          {localScorecard.bowling.map((b, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 pl-2">{b.name}</td>
                              <td className="py-3 text-right">{b.overs}</td>
                              <td className="py-3 text-right">{b.maidens}</td>
                              <td className="py-3 text-right">{b.runs}</td>
                              <td className="py-3 text-right pr-2 text-sky-500 font-black">{b.wickets}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : match.scoreCardId ? (
                <div className="p-5 sm:p-8 bg-zinc-900/40 rounded-2xl sm:rounded-3xl border border-white/5 space-y-4">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Scorecard</h3>
                  <div className="w-full h-[500px] rounded-xl overflow-hidden bg-white/5">
                    <iframe
                      src={`https://www.cricket.com.au/matches/${match.scoreCardId}`}
                      className="w-full h-full border-0 grayscale invert opacity-80"
                      title="Cricket Scorecard"
                    />
                  </div>
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest text-center italic">Scorecard data provided by third-party API</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Related Sidebar - Playlist Style */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-10">
            {standings.length > 0 && (
              <PointsTable standings={standings} tournamentName={tournament?.name} />
            )}

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between px-1 sm:px-2">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tighter uppercase">Playlist</h2>
                <div className="h-0.5 w-8 bg-sky-500 rounded-full" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 sm:py-1 rounded-md border border-white/5">
                {relatedMatches.length + 1} Videos
              </span>
            </div>
            
            <div className="bg-zinc-900/30 rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden">
              <div className="max-h-[500px] sm:max-h-[700px] overflow-y-auto hide-scrollbar">
                {/* Currently Playing Indicator */}
                <div className="p-2 sm:p-3 bg-sky-500/10 border-b border-white/5 flex gap-3 sm:gap-4 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
                  <div className="relative flex-none w-24 sm:w-32 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-zinc-900 shadow-xl shadow-black/40">
                    {getThumbnailUrl(match) ? (
                      <img src={getThumbnailUrl(match)!} className="w-full h-full object-cover opacity-50" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex gap-0.5 items-end h-3">
                        <div className="w-0.5 h-full bg-sky-500 animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-0.5 h-2/3 bg-sky-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 h-full bg-sky-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <p className="text-[8px] sm:text-[9px] font-black text-sky-500 uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Now Playing</p>
                    <PlaylistTitle title={match.title} stage={match.stage} />
                  </div>
                </div>

                <div className="p-1 sm:p-2 space-y-0.5 sm:space-y-1">
                  {relatedMatches.length > 0 ? (
                    relatedMatches.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => onPlay(m)}
                        className="group flex gap-3 sm:gap-4 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <div className="relative flex-none w-24 sm:w-32 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 group-hover:ring-sky-500/30 transition-all shadow-lg">
                          {getThumbnailUrl(m) ? (
                            <img src={getThumbnailUrl(m)!} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                              <Play className="w-4 sm:w-6 h-4 sm:h-6 text-zinc-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-4 sm:w-5 h-4 sm:w-5 text-white fill-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5 sm:py-1">
                          <PlaylistTitle title={m.title} stage={m.stage} />
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                            <span>{m.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 sm:p-8 text-center">
                      <p className="text-[10px] sm:text-xs font-black text-zinc-600 uppercase tracking-widest">No more highlights</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Tournaments in Details Page */}
        <div className="mt-12 sm:mt-20">
          <TournamentRail 
            tournaments={tournaments} 
            activeCategory={activeCategory} 
            onSelectCategory={onSelectCategory} 
          />
        </div>
      </main>
    </div>
  );
}
