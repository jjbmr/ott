import { Calendar, Clock, MapPin } from 'lucide-react';
import { Fixture, Tournament } from '../data';

interface FixtureRowProps {
  fixtures: Fixture[];
  tournaments: Tournament[];
}

export default function FixtureRow({ fixtures, tournaments }: FixtureRowProps) {
  if (fixtures.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-sky-500 rounded-full" />
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">Upcoming Fixtures</h2>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-12 pb-4 hide-scrollbar">
        {fixtures.map(f => (
          <div key={f.id} className="flex-none w-[280px] sm:w-[320px] bg-zinc-900/50 border border-white/5 rounded-2xl p-5 hover:border-sky-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${f.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                {f.status}
              </span>
            </div>
            
            <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3 truncate">
              {tournaments.find(t => t.id === f.tournamentId)?.name}
            </p>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">{f.team1}</span>
                <span className="text-[10px] font-black text-zinc-600 uppercase italic px-2">VS</span>
                <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors text-right">{f.team2}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Calendar className="w-3 h-3" />
                <span className="text-[10px] font-bold">{f.date}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-bold">{f.time}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <MapPin className="w-3 h-3" />
                <span className="text-[10px] font-bold truncate">{f.venue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
