import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface TickerMatch {
  matchId: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  status: string;
}

export default function LiveTicker() {
  const [matches, setMatches] = useState<TickerMatch[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('https://crickdbmodule-api-144271912366.asia-south1.run.app/api/tournaments/list-public?activeOnly=true');
        const data = await res.json();
        
        const liveMatches: TickerMatch[] = [];
        for (const t of data.tournaments || []) {
          for (const m of t.matches || []) {
            if (m.status?.toLowerCase().includes('live') || m.status?.toLowerCase().includes('match')) {
              const inn1 = m.innings?.find((i: any) => i.inningsNumber === 1);
              const inn2 = m.innings?.find((i: any) => i.inningsNumber === 2);
              
              liveMatches.push({
                matchId: m.matchId,
                team1: m.team1.shortName || m.team1.name,
                team2: m.team2.shortName || m.team2.name,
                score1: inn1 ? `${inn1.runs}/${inn1.wickets} (${inn1.overs})` : '0/0',
                score2: inn2 ? `${inn2.runs}/${inn2.wickets} (${inn2.overs})` : '',
                status: m.status
              });
            }
          }
        }
        setMatches(liveMatches);
      } catch (err) {
        console.error('Ticker fetch error:', err);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="bg-sky-600/10 border-b border-sky-500/20 py-2 relative overflow-hidden whitespace-nowrap group">
      <div className="flex animate-ticker items-center gap-12 sm:gap-24">
        {/* Double the list for seamless loop */}
        {[...matches, ...matches].map((m, i) => (
          <div key={`${m.matchId}-${i}`} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-sky-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{m.team1} vs {m.team2}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
              <span className="text-sky-400">{m.score1}</span>
              {m.score2 && <span className="text-zinc-500">|</span>}
              <span className="text-sky-400">{m.score2}</span>
            </div>
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5">
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
