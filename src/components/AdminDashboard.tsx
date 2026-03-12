import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, LogOut, LayoutGrid, List, RefreshCcw, Megaphone, Check, X, Upload, Loader2 } from 'lucide-react';
import { Match, Tournament, Ad } from '../data';
import { auth, db, storage } from '../firebase';
import { get, ref, set, remove } from 'firebase/database';
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  quality: '4K',
  videoType: 'mp4',
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

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="mt-2 w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
    <div 
      className="bg-sky-500 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [view, setView] = useState<'tournaments' | 'matches' | 'ads'>('tournaments');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  
  // New Tournament State
  const [newTournament, setNewTournament] = useState<Partial<Tournament>>({});
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  
  // New Match State
  const [newMatch, setNewMatch] = useState<MatchFormState>(createMatchFormState());
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // New Ad State
  const [newAd, setNewAd] = useState<Partial<Ad>>({ type: 'video', active: true });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [isUploadingAd, setIsUploadingAd] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetMatchForm = (tournamentId?: string) => {
    setNewMatch(createMatchFormState({ tournamentId }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tSnapshot, mSnapshot, aSnapshot] = await Promise.all([
        get(ref(db, 'tournaments')),
        get(ref(db, 'matches')),
        get(ref(db, 'ads'))
      ]);

      const tournamentsList = tSnapshot.exists()
        ? (Object.values(tSnapshot.val()) as Tournament[])
        : [];
      const matchesList = mSnapshot.exists()
        ? (Object.values(mSnapshot.val()) as Match[])
        : [];
      const adsList = aSnapshot.exists()
        ? (Object.values(aSnapshot.val()) as Ad[])
        : [];

      setTournaments(tournamentsList);
      setMatches(
        matchesList.length
          ? matchesList.map(match => ({ ...match, featured: !!match.featured }))
          : []
      );
      setAds(adsList);
    } catch (error) {
      console.error('Fetch data failed:', error);
    }
  };

  const handleAdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAd(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.url) {
            setNewAd(prev => ({ ...prev, videoUrl: response.url }));
          } else {
            alert('Upload failed: ' + (response.error || 'Unknown error'));
          }
        } catch (e) {
          alert('Upload failed: Invalid server response');
        }
      } else {
        alert('Upload failed: Server error ' + xhr.status);
      }
      setIsUploadingAd(false);
      setUploadProgress(0);
    });

    xhr.addEventListener('error', () => {
      alert('Upload failed: Network error');
      setIsUploadingAd(false);
      setUploadProgress(0);
    });

    // Use your Hostinger URL here
    xhr.open('POST', '/upload_ad.php'); 
    xhr.send(formData);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumbnail(true);
    setUploadProgress(0);
    try {
      const storageRef = sRef(storage, `thumbnails/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Thumbnail upload failed:', error);
          alert('Thumbnail upload failed');
          setIsUploadingThumbnail(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setNewMatch(prev => ({ ...prev, thumbnail: url }));
          setIsUploadingThumbnail(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      setIsUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setUploadProgress(0);
    try {
      const storageRef = sRef(storage, `highlights/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Video upload failed:', error);
          alert('Video upload failed');
          setIsUploadingVideo(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setNewMatch(prev => ({ ...prev, videoUrl: url, videoType: 'mp4' }));
          setIsUploadingVideo(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Video upload error:', error);
      setIsUploadingVideo(false);
    }
  };

  const handleAddAd = async () => {
    if (!newAd.title || !newAd.videoUrl) {
      alert('Please fill in ad title and video URL');
      return;
    }

    const adId = editingAdId || `ad${Date.now()}`;
    const ad: Ad = {
      id: adId,
      title: newAd.title!,
      videoUrl: newAd.videoUrl!,
      active: newAd.active ?? true,
      type: newAd.type || 'video',
      linkUrl: newAd.linkUrl || ''
    };

    await set(ref(db, `ads/${ad.id}`), ad);
    fetchData();
    setNewAd({ type: 'video', active: true });
    setEditingAdId(null);
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    await remove(ref(db, `ads/${id}`));
    fetchData();
  };

  const toggleAdStatus = async (ad: Ad) => {
    await set(ref(db, `ads/${ad.id}/active`), !ad.active);
    fetchData();
  };

  const handleTournamentClick = (id: string) => {
    setSelectedTournamentId(id);
    setNewMatch(prev => ({ ...prev, tournamentId: id }));
    setView('matches');
  };

  const handleAddTournament = async () => {
    if (!newTournament.name || !newTournament.year || !newTournament.shortName) {
      alert('Please fill in tournament name, short name and year');
      return;
    }

    const tournamentId = editingTournamentId || `t${Date.now()}`;

    const tournament: Tournament = {
      id: tournamentId,
      name: newTournament.name!,
      shortName: newTournament.shortName!,
      year: newTournament.year!,
      logo: newTournament.logo || ''
    };

    await set(ref(db, `tournaments/${tournament.id}`), tournament);

    fetchData();
    setNewTournament({});
    setEditingTournamentId(null);
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournamentId(tournament.id);
    setNewTournament({
      name: tournament.name,
      shortName: tournament.shortName,
      year: tournament.year,
      logo: tournament.logo
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelTournamentEdit = () => {
    setEditingTournamentId(null);
    setNewTournament({});
  };

  const handleAddMatch = async () => {
    if (!newMatch.title || !newMatch.tournamentId || !newMatch.videoUrl) {
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
      thumbnail: newMatch.thumbnail || '',
      videoUrl: newMatch.videoUrl!,
      videoType: newMatch.videoType || 'mp4',
      duration: newMatch.duration || '00:00',
      date: newMatch.date || new Date().toISOString().split('T')[0],
      time: newMatch.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      quality: newMatch.quality || '4K',
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'tournaments' ? 'bg-sky-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Tournaments
              </button>
              <button 
                onClick={() => setView('matches')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'matches' ? 'bg-sky-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
                Matches
              </button>
              <button 
                onClick={() => setView('ads')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'ads' ? 'bg-sky-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                <Megaphone className="w-4 h-4" />
                Ads
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
            {/* Create/Edit Tournament */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${editingTournamentId ? 'bg-sky-500/10 border-sky-500/30' : 'bg-zinc-900/50 border-white/10'}`}>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-sky-500">
                {editingTournamentId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingTournamentId ? 'Edit Tournament' : 'Create New Tournament'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Tournament Name</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., ICC World Cup"
                    value={newTournament.name || ''}
                    onChange={e => setNewTournament({ ...newTournament, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Short Name (for Rail)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., World Cup"
                    value={newTournament.shortName || ''}
                    onChange={e => setNewTournament({ ...newTournament, shortName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Year</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., 2024"
                    value={newTournament.year || ''}
                    onChange={e => setNewTournament({ ...newTournament, year: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium text-zinc-500">Tournament Logo URL (16:9 recommended)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://..."
                    value={newTournament.logo || ''}
                    onChange={e => setNewTournament({ ...newTournament, logo: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={handleAddTournament}
                  className="px-8 py-3 bg-sky-500 rounded-xl text-zinc-950 font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
                >
                  {editingTournamentId ? 'Update Tournament' : 'Create Tournament'}
                </button>
                {editingTournamentId && (
                  <button
                    onClick={handleCancelTournamentEdit}
                    className="px-8 py-3 bg-zinc-800 rounded-xl text-zinc-300 font-bold hover:bg-zinc-700 transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* List Tournaments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleTournamentClick(t.id)}
                  className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 flex justify-between items-center group cursor-pointer hover:bg-zinc-800/80 hover:border-sky-500/50 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-500 transition-colors">{t.name}</h3>
                    <p className="text-zinc-500 text-sm">{t.year}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sky-500 text-xs font-medium">
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
                        handleEditTournament(t);
                      }}
                      className="p-3 bg-zinc-800 text-zinc-500 rounded-xl opacity-0 group-hover:opacity-100 hover:text-sky-500 hover:bg-sky-500/10 transition-all shadow-sm"
                      title="Edit Tournament"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
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
        ) : view === 'ads' ? (
          <div className="space-y-12">
            {/* Create/Edit Ad */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${editingAdId ? 'bg-sky-500/10 border-sky-500/30' : 'bg-zinc-900/50 border-white/10'}`}>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-sky-500">
                {editingAdId ? <Edit2 className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                {editingAdId ? 'Edit Advertisement' : 'Create New Ad'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Ad Title</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., Summer Sale"
                    value={newAd.title || ''}
                    onChange={e => setNewAd({ ...newAd, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Ad Type</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                    value={newAd.type || 'video'}
                    onChange={e => setNewAd({ ...newAd, type: e.target.value as 'video' | 'aston' })}
                  >
                    <option value="video">Top Video Ad (Full Width)</option>
                    <option value="aston">Aston Ad (Overlay Banner)</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-500">Video/Image (Upload or URL)</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="https://..."
                        value={newAd.videoUrl || ''}
                        onChange={e => setNewAd({ ...newAd, videoUrl: e.target.value })}
                      />
                    </div>
                    <label className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-800 rounded-xl text-zinc-300 font-bold hover:bg-zinc-700 transition-all cursor-pointer border border-white/5 ${isUploadingAd ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploadingAd ? <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> : <Upload className="w-4 h-4" />}
                      {isUploadingAd ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload File'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleAdFileUpload}
                        disabled={isUploadingAd}
                      />
                    </label>
                  </div>
                  {isUploadingAd && <ProgressBar progress={uploadProgress} />}
                  {newAd.videoUrl && !isUploadingAd && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Preview</p>
                      <div className="relative w-full aspect-video sm:w-64 rounded-xl overflow-hidden bg-zinc-950 border border-white/5 ring-4 ring-black">
                        {newAd.videoUrl.match(/\.(mp4|m3u8|webm)$|video/i) ? (
                          <video src={newAd.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                        ) : (
                          <img src={newAd.videoUrl} className="w-full h-full object-cover" alt="Preview" />
                        )}
                        <div className="absolute top-2 left-2 bg-sky-500 text-zinc-950 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                          Live
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Redirect Link (Optional)</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://..."
                    value={newAd.linkUrl || ''}
                    onChange={e => setNewAd({ ...newAd, linkUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={handleAddAd}
                  className="px-8 py-3 bg-sky-500 rounded-xl text-zinc-950 font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
                >
                  {editingAdId ? 'Update Ad' : 'Create Ad'}
                </button>
                {editingAdId && (
                  <button
                    onClick={() => { setEditingAdId(null); setNewAd({ type: 'video', active: true }); }}
                    className="px-8 py-3 bg-zinc-800 rounded-xl text-zinc-300 font-bold hover:bg-zinc-700 transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* List Ads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map(ad => (
                <div 
                  key={ad.id} 
                  className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{ad.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${ad.type === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {ad.type}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs truncate max-w-xs mt-1">{ad.videoUrl}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <button 
                        onClick={() => toggleAdStatus(ad)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${ad.active ? 'text-sky-500' : 'text-zinc-500'}`}
                      >
                        {ad.active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {ad.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingAdId(ad.id);
                        setNewAd(ad);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-3 bg-zinc-800 text-zinc-500 rounded-xl opacity-0 group-hover:opacity-100 hover:text-sky-500 hover:bg-sky-500/10 transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteAd(ad.id)}
                      className="p-3 bg-zinc-800 text-zinc-500 rounded-xl opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
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
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-sky-500">
                <Plus className="w-5 h-5" />
                Add Match to Tournament
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Select Tournament</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
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
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="e.g., Group A Match"
                      value={newMatch.customStage || ''}
                      onChange={e => setNewMatch({ ...newMatch, customStage: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Match Title</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., India vs England"
                    value={newMatch.title || ''}
                    onChange={e => setNewMatch({ ...newMatch, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Duration</label>
                  <input
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., 10:30"
                    value={newMatch.duration || ''}
                    onChange={e => setNewMatch({ ...newMatch, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Match Date</label>
                  <input
                    type="date"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={newMatch.date || ''}
                    onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Match Time</label>
                  <input
                    type="time"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={newMatch.time || ''}
                    onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500">Video Quality</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                    value={newMatch.quality || '4K'}
                    onChange={e => setNewMatch({ ...newMatch, quality: e.target.value as '4K' | 'Full HD' })}
                  >
                    <option value="4K">4K Ultra HD</option>
                    <option value="Full HD">Full HD 1080p</option>
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium text-zinc-500">Description</label>
                  <textarea
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[100px]"
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
                      <div className={`w-10 h-6 rounded-full transition-colors ${newMatch.featured ? 'bg-sky-500' : 'bg-zinc-800'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newMatch.featured ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Featured on Home Page</span>
                  </label>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-sm font-medium text-zinc-500">Thumbnail (Upload or URL)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="https://..."
                      value={newMatch.thumbnail || ''}
                      onChange={e => setNewMatch({ ...newMatch, thumbnail: e.target.value })}
                    />
                    <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-xs text-zinc-300 font-bold hover:bg-zinc-700 transition-all cursor-pointer border border-white/5 ${isUploadingThumbnail ? 'opacity-50' : ''}`}>
                      {isUploadingThumbnail ? <Loader2 className="w-3 h-3 animate-spin text-sky-500" /> : <Upload className="w-3 h-3" />}
                      {isUploadingThumbnail ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload Thumbnail'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={isUploadingThumbnail} />
                    </label>
                  </div>
                  {isUploadingThumbnail && <ProgressBar progress={uploadProgress} />}
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-sm font-medium text-zinc-500">Video Type</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                    value={newMatch.videoType || 'mp4'}
                    onChange={e => setNewMatch({ ...newMatch, videoType: e.target.value as 'mp4' | 'youtube' })}
                  >
                    <option value="mp4">MP4 / Direct Link</option>
                    <option value="youtube">YouTube Link</option>
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium text-zinc-500">Video URL (m3u8/mp4 or YouTube URL)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder={newMatch.videoType === 'youtube' ? "https://www.youtube.com/watch?v=..." : "https://..."}
                      value={newMatch.videoUrl || ''}
                      onChange={e => setNewMatch({ ...newMatch, videoUrl: e.target.value })}
                    />
                    {newMatch.videoType === 'mp4' && (
                      <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-xs text-zinc-300 font-bold hover:bg-zinc-700 transition-all cursor-pointer border border-white/5 ${isUploadingVideo ? 'opacity-50' : ''}`}>
                        {isUploadingVideo ? <Loader2 className="w-3 h-3 animate-spin text-sky-500" /> : <Upload className="w-3 h-3" />}
                        {isUploadingVideo ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload Video'}
                        <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} disabled={isUploadingVideo} />
                      </label>
                    )}
                  </div>
                  {isUploadingVideo && <ProgressBar progress={uploadProgress} />}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <button
                  onClick={handleAddMatch}
                  className="px-8 py-3 bg-sky-500 rounded-xl text-zinc-950 font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
                >
                  {editingMatchId ? 'Update Highlight' : 'Add Highlight'}
                </button>
                {editingMatchId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-8 py-3 bg-zinc-800 rounded-xl text-zinc-300 border border-white/10 font-bold hover:text-white hover:border-sky-500 transition-all"
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
                    className="text-xs text-sky-500 hover:text-sky-400 font-medium"
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
                          className="p-2 text-zinc-500 hover:text-sky-400 transition-colors"
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
