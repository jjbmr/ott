import { useEffect, useState } from 'react';
import { Play, User } from 'lucide-react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Hero from './components/Hero';
import VideoRow from './components/VideoRow';
import PlayerModal from './components/PlayerModal';
import DetailsPage from './components/DetailsPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import TournamentRail from './components/TournamentRail';
import { Match, Tournament, matches as mockMatches, tournaments as mockTournaments } from './data';

import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);

  useEffect(() => {
    fetchData();

    const handleToggleDashboard = () => setShowDashboard(prev => !prev);
    window.addEventListener('toggle-admin-dashboard', handleToggleDashboard);

    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check admin role in Realtime Database
        const roleRef = ref(db, `users/${firebaseUser.uid}/role`);
        const snapshot = await get(roleRef);
        const role = snapshot.val();
        
        if (role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      } else {
        setIsAdmin(false);
      }
    });
    return () => {
      unsubscribe();
      window.removeEventListener('toggle-admin-dashboard', handleToggleDashboard);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setShowDashboard(false);
    fetchData();
  };

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

      setTournaments(tournamentsList.length ? tournamentsList : mockTournaments);
      setMatches(
        matchesList.length
          ? matchesList.map(match => ({ ...match, featured: !!match.featured }))
          : mockMatches
      );
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleAdminLogin = async (idToken: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    if (res.ok) {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      const data = await res.json();
      alert(data.message || 'Unauthorized access');
    }
  };

  const handlePlayMatch = (match: Match) => {
    const tournamentName = tournaments.find(t => t.id === match.tournamentId)?.name || '';
    setSelectedMatch({ ...match, tournament: tournamentName });
  };

  if (showDashboard) {
    return <AdminDashboard onLogout={() => { setShowDashboard(false); fetchData(); }} />;
  }

  // Filter matches based on tournament
  const filteredMatches = activeCategory === 'All' 
    ? matches 
    : matches.filter(m => {
        const t = tournaments.find(tour => tour.id === m.tournamentId);
        return t?.name === activeCategory;
      });

  // Featured match (first one or first of category)
  const featuredMatch = filteredMatches[0];

  if (selectedMatch) {
    return (
      <DetailsPage 
        match={selectedMatch} 
        allMatches={matches}
        tournaments={tournaments}
        onBack={() => setSelectedMatch(null)}
        onPlay={handlePlayMatch}
      />
    );
  }

  return (
    <div className="min-h-screen text-zinc-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
        onLoginClick={() => setShowAdminLogin(true)}
        user={user}
        onLogout={handleLogout}
        tournaments={tournaments}
      />
      
      <main className="pb-32">
        {featuredMatch ? (
          <Hero 
            match={{
              ...featuredMatch,
              tournament: tournaments.find(t => t.id === featuredMatch.tournamentId)?.name || ''
            }} 
            onPlay={handlePlayMatch} 
          />
        ) : (
          <div className="h-[40vh] flex items-center justify-center text-zinc-600 font-black uppercase tracking-widest bg-zinc-900/20">
            No highlights available
          </div>
        )}

        {/* Signature Circular Navigation (Jio/Hotstar style) */}
        <TournamentRail 
          tournaments={tournaments} 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory} 
        />

        <div className="mt-4 space-y-12">
          {activeCategory === 'All' ? (
            <>
              {/* Trending Row */}
              <div className="relative pt-4">
                <VideoRow 
                  title="Trending Highlights" 
                  matches={matches.slice(0, 6).map(m => ({
                    ...m,
                    tournament: tournaments.find(t => t.id === m.tournamentId)?.name || ''
                  }))} 
                  onPlay={handlePlayMatch} 
                />
              </div>

              {/* Tournament Rows */}
              {tournaments.map((tournament, idx) => {
                const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
                if (tournamentMatches.length === 0) return null;
                return (
                  <div key={tournament.id} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <VideoRow 
                      title={`${tournament.name} Highlights`} 
                      matches={tournamentMatches.map(m => ({
                        ...m,
                        tournament: tournament.name
                      }))} 
                      onPlay={handlePlayMatch} 
                    />
                  </div>
                );
              })}
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pt-8">
              <VideoRow 
                title={`All ${activeCategory} Highlights`} 
                matches={filteredMatches.map(m => ({
                  ...m,
                  tournament: tournaments.find(t => t.id === m.tournamentId)?.name || ''
                }))} 
                onPlay={handlePlayMatch} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-white/5 py-20 bg-black/20">
        <div className="max-w-[1440px] mx-auto px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Play className="w-5 h-5 text-zinc-950 fill-zinc-950" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">JBMR SPORTS</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-sm font-medium leading-relaxed">
              Experience the best cricket highlights in 4K Ultra HD. Premium content for the ultimate sports fan. Stream anywhere, anytime.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Company</h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500 font-bold">
              <a href="#" className="hover:text-emerald-500 transition-colors">About Us</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Support</h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500 font-bold">
              <a href="#" className="hover:text-emerald-500 transition-colors">Help Center</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Cookie Preferences</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-12 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} JBMR SPORTS. All rights reserved.</p>
          <div className="flex gap-8">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all cursor-pointer">
              <i className="fab fa-facebook-f text-xs" />
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all cursor-pointer">
              <i className="fab fa-twitter text-xs" />
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all cursor-pointer">
              <i className="fab fa-instagram text-xs" />
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />

      {showAdminLogin && (
        <AdminLogin 
          onLogin={handleAdminLogin} 
          onCancel={() => setShowAdminLogin(false)} 
        />
      )}
    </div>
  );
}
