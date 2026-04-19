import { Trophy } from 'lucide-react';
import { Standing } from '../data';

interface PointsTableProps {
  standings: Standing[];
  tournamentName?: string;
}

export default function PointsTable({ standings, tournamentName }: PointsTableProps) {
  if (standings.length === 0) return null;

  // Sort standings by points, then NRR (simple sort)
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return parseFloat(b.nrr) - parseFloat(a.nrr);
  });

  return (
    <div className="p-5 sm:p-8 bg-zinc-900/40 rounded-2xl sm:rounded-3xl border border-white/5 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-sky-500" />
          <h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.2em]">Points Table - {tournamentName}</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="pb-3 pl-2">Pos</th>
              <th className="pb-3">Team</th>
              <th className="pb-3 text-center">P</th>
              <th className="pb-3 text-center">W</th>
              <th className="pb-3 text-center">L</th>
              <th className="pb-3 text-center">NRR</th>
              <th className="pb-3 text-right pr-2">PTS</th>
            </tr>
          </thead>
          <tbody className="text-[11px] sm:text-xs font-bold text-zinc-300">
            {sortedStandings.map((s, i) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 pl-2 text-zinc-500">{i + 1}</td>
                <td className="py-4 text-white font-black">{s.teamName}</td>
                <td className="py-4 text-center">{s.played}</td>
                <td className="py-4 text-center">{s.won}</td>
                <td className="py-4 text-center">{s.lost}</td>
                <td className="py-4 text-center font-mono text-[10px]">{s.nrr}</td>
                <td className="py-4 text-right pr-2 text-sky-500 font-black">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
