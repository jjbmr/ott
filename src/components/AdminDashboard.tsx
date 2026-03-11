import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, LogOut, LayoutGrid, List, RefreshCcw } from 'lucide-react';
import { Match, Tournament } from '../data';
import { auth, db } from '../firebase';
import { get, ref, set, remove } from 'firebase/database';

interface AdminDashboardProps {
  onLogout: () => void;
}

type MatchFormState = Partial<Match> & {
  stageType?: string;
  customStage?: string;
  matchNumber?: string;
};

const STAGE_OPTIONS = ['Quarter Final', 'Semi Final', 'Final', 'Custom Stage'];

const createMatchFormState = (overrides: Partial<MatchFormState> = {}): MatchFormState => ({
  sport: 'Cricket',
  date: 'Today',
  views: '0',
  stageType: STAGE_OPTIONS[0],
  customStage: '',
  matchNumber: '',
  ...overrides
});

const parseStageValue = (stage?: string) => {
  if (!stage) return { stageType: STAGE_OPTIONS[0], matchNumber: '', customStage: '' };
  const presetStage = STAGE_OPTIONS.find(option => option !== 'Custom Stage' && stage.startsWith(option));
  if (presetStage) {
    const matchNumber = stage.split(' • Match ')[1] || '';
    return { stageType: presetStage, matchNumber, customStage: '' };
  }
  return { stageType: 'Custom Stage', matchNumber: '', customStage: stage };
};

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [view, setView] = useState<'tournaments' | 'matches'>('tournaments');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  
  // New Tournament State
  const [newTournament, setNewTournament] = useState<Partial<Tournament>>({});
  
  // New Match State
  const [newMatch, setNewMatch] = useState<MatchFormState>(createMatchFormState());
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const resetMatchForm = (tournamentId?: string) => {
    setNewMatch(createMatchFormState({ tournamentId }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tSnapshot, mSnapshot] = await Promise.all([
        get(ref(db, 'tournaments')),
        get(ref(db, 'matches'))
      ]);

      const tournamentsList = tSnapshot.exists()
        ? (Object.values(tSnapshot.val()) as Tournament[])
        : [];
      const matchesList = mSnapshot.exists()
        ? (Object.values(mSnapshot.val()) as Match[])
        : [];

      setTournaments(tournamentsList);
      setMatches(
        matchesList.length
          ? matchesList.map(match => ({ ...match, featured: !!match.featured }))
          : []
      );
    } catch (error) {
      console.error('Fetch data failed:', error);
    }
  };

  const handleTournamentClick = (id: string) => {
    setSelectedTournamentId(id);
    setNewMatch(prev => ({ ...prev, tournamentId: id }));
    setView('matches');
  };

  const handleAddTournament = async () => {
    if (!newTournament.name || !newTournament.year) {
      alert('Please fill in tournament name and year');
      return;
    }
    const tournament: Tournament = {
      id: `t${Date.now()}`,
      name: newTournament.name!,
      year: newTournament.year!
    };

    await set(ref(db, `tournaments/${tournament.id}`), tournament);

    fetchData();
    setNewTournament({});
  };

  const handleAddMatch = async () => {
    if (!newMatch.title || !newMatch.tournamentId || !newMatch.videoUrl || !newMatch.thumbnail) {
      alert('Please fill in all required fields including Tournament');
      return;
    }

    const stageType = newMatch.stageType || STAGE_OPTIONS[0];
    const customStage = newMatch.customStage?.trim();
    const matchNumber = newMatch.matchNumber?.trim();

    const stageValue = stageType === 'Custom Stage'
      ? (customStage || 'Custom Stage')
      : `${stageType}${matchNumber ? ` • Match ${matchNumber}` : ''}`;

    const matchId = editingMatchId || `m${Date.now()}`;

    const matchToAdd: Match = {
      id: matchId,
      title: newMatch.title!,
      tournamentId: newMatch.tournamentId!,
      sport: 'Cricket',
      stage: stageValue,
      thumbnail: newMatch.thumbnail!,
      videoUrl: newMatch.videoUrl!,
      duration: newMatch.duration || '00:00',
      date: newMatch.date || 'Today',
      views: '0',
      description: newMatch.description || '',
      featured: newMatch.featured || false
    };

    await set(ref(db, `matches/${matchToAdd.id}`), {
      ...matchToAdd,
      featured: matchToAdd.featured ? 1 : 0
    });

    fetchData();
    setEditingMatchId(null);
    resetMatchForm(newMatch.tournamentId);
  };

  const deleteTournament = async (id: string) => {
    if (!confirm('Delete tournament and all its matches?')) return;

    await remove(ref(db, `tournaments/${id}`));

    const matchesSnapshot = await get(ref(db, 'matches'));
    if (matchesSnapshot.exists()) {
      const matchesData = matchesSnapshot.val() || {};
      for (const matchId in matchesData) {
        if (matchesData[matchId].tournamentId === id) {
          await remove(ref(db, `matches/${matchId}`));
        }
      }
    }

    fetchData();
  };

  const deleteMatch = async (id: string) => {
    await remove(ref(db, `matches/${id}`));
    fetchData();
  };

  const handleEditMatch = (match: Match) => {
    const { stageType, matchNumber, customStage } = parseStageValue(match.stage);
    setEditingMatchId(match.id);
    setSelectedTournamentId(match.tournamentId);
    setNewMatch(createMatchFormState({
      ...match,
      tournamentId: match.tournamentId,
      stageType,
      matchNumber,
      customStage
    }));
    setView('matches');
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    resetMatchForm(newMatch.tournamentId);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-12 text-zinc-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-2">Manage tournaments and match highlights</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all border border-white/5"
            >
              <RefreshCcw className="w-4 h-4" />
              Website
            </button>
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setView('tournaments')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'tournaments' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Tournaments
              </button>
              <button 
                onClick={() => setView('matches')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'matches' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
                Matches
              </button>
            </div>
            <button
              onClick={() => {
                auth.signOut();
                onLogout();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-all border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {view === 'tournaments' ? (
          <div className="space-y-12">
            {/* Create Tournament */}
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-emerald-500">
                <Plus className="w-5 h-5" />
                Create New Tournament
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Tournament Name</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., ICC World Cup"
                    value={newTournament.name || ''}
                    onChange={e => setNewTournament({ ...newTournament, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Year</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 2024"
                    value={newTournament.year || ''}
                    onChange={e => setNewTournament({ ...newTournament, year: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={handleAddTournament}
                className="mt-6 px-8 py-3 bg-emerald-500 rounded-xl text-zinc-950 font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                Create Tournament
              </button>
            </div>

            {/* List Tournaments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleTournamentClick(t.id)}
                  className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 flex justify-between items-center group cursor-pointer hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-500 transition-colors">{t.name}</h3>
                    <p className="text-zinc-500 text-sm">{t.year}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-emerald-500 text-xs font-medium">
                        {matches.filter(m => m.tournamentId === t.id).length} Matches
                      </span>
                      <span className="text-zinc-600 text-[10px]">•</span>
                      <span className="text-zinc-500 text-[10px] uppercase tracking-wider group-hover:text-zinc-300">Click to add match</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTournament(t.id);
                      }}
                      className="p-3 bg-zinc-800 text-zinc-500 rounded-xl opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-sm"
                      title="Delete Tournament"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Create Match Highlight */}
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-emerald-500">
                <Plus className="w-5 h-5" />
                Add Match to Tournament
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Select Tournament</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    value={newMatch.tournamentId || ''}
                    onChange={e => setNewMatch({ ...newMatch, tournamentId: e.target.value })}
                  >
                    <option value="">Choose Tournament...</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.year})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Match Stage</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    value={newMatch.stageType || STAGE_OPTIONS[0]}
                    onChange={e => setNewMatch({ ...newMatch, stageType: e.target.value })}
                  >
                    {STAGE_OPTIONS.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                {newMatch.stageType !== 'Custom Stage' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Match Number (optional)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., 5"
                      value={newMatch.matchNumber || ''}
                      onChange={e => setNewMatch({ ...newMatch, matchNumber: e.target.value })}
                    />
                  </div>
                )}
                {newMatch.stageType === 'Custom Stage' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Custom Stage Label</label>
                    <input
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Group A Match"
                      value={newMatch.customStage || ''}
                      onChange={e => setNewMatch({ ...newMatch, customStage: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Match Title</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., India vs England"
                    value={newMatch.title || ''}
                    onChange={e => setNewMatch({ ...newMatch, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Duration</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 10:30"
                    value={newMatch.duration || ''}
                    onChange={e => setNewMatch({ ...newMatch, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Date/Time</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Today, 2 Days Ago"
                    value={newMatch.date || ''}
                    onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium text-zinc-500">Description</label>
                  <textarea
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                    placeholder="Brief description of the highlights..."
                    value={newMatch.description || ''}
                    onChange={e => setNewMatch({ ...newMatch, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2 lg:col-span-1 flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={newMatch.featured || false}
                        onChange={e => setNewMatch({ ...newMatch, featured: e.target.checked })}
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${newMatch.featured ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newMatch.featured ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Featured on Home Page</span>
                  </label>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-sm font-medium text-zinc-500">Thumbnail URL</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://images.unsplash.com/..."
                    value={newMatch.thumbnail || ''}
                    onChange={e => setNewMatch({ ...newMatch, thumbnail: e.target.value })}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium text-zinc-500">Video URL (m3u8/mp4)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://..."
                    value={newMatch.videoUrl || ''}
                    onChange={e => setNewMatch({ ...newMatch, videoUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <button
                  onClick={handleAddMatch}
                  className="px-8 py-3 bg-emerald-500 rounded-xl text-zinc-950 font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {editingMatchId ? 'Update Highlight' : 'Add Highlight'}
                </button>
                {editingMatchId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-8 py-3 bg-zinc-800 rounded-xl text-zinc-300 border border-white/10 font-bold hover:text-white hover:border-emerald-500 transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* List Matches */}
            <div className="bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/30">
                <h3 className="font-semibold text-zinc-300">
                  {selectedTournamentId 
                    ? `Matches for ${tournaments.find(t => t.id === selectedTournamentId)?.name}` 
                    : 'All Matches'}
                </h3>
                {selectedTournamentId && (
                  <button 
                    onClick={() => setSelectedTournamentId('')}
                    className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                  >
                    Show All Matches
                  </button>
                )}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Highlight</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tournament</th>
                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(selectedTournamentId 
                    ? matches.filter(m => m.tournamentId === selectedTournamentId) 
                    : matches
                  ).map(match => (
                    <tr key={match.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={match.thumbnail} className="w-16 h-10 object-cover rounded-lg" />
                          <div className="text-sm font-medium text-white">{match.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {tournaments.find(t => t.id === match.tournamentId)?.name}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleEditMatch(match)}
                          className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                          title="Edit highlight"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteMatch(match.id)}
                          className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
