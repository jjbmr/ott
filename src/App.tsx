import { useEffect, useState, useRef } from 'react';
import { Play, User } from 'lucide-react';
import Navbar, { NavbarHandle } from './components/Navbar';
import BottomNav from './components/BottomNav';
import Hero from './components/Hero';
import VideoRow from './components/VideoRow';
import PlayerModal from './components/PlayerModal';
import DetailsPage from './components/DetailsPage';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import TournamentRail from './components/TournamentRail';
import AdBanner from './components/AdBanner';
import FixtureRow from './components/FixtureRow';
import LiveTicker from './components/LiveTicker';
import { Match, Tournament, Ad, Sport, Fixture, Standing, matches as mockMatches, tournaments as mockTournaments } from './data';
import { getThumbnailUrl } from './utils';

import { auth, db, messaging } from './firebase';
import { signOut } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { getToken, onMessage } from 'firebase/messaging';

export default function App() {
  const navbarRef = useRef<NavbarHandle>(null);
  const [activeCategory, setActiveCategory] = useState<string | 'All'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'All';
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'dashboard';
  });
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [notifications, setNotifications] = useState<Match[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
  const [sports, setSports] = useState<Sport[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Setup FCM
    const setupFCM = async () => {
      if (!messaging) return;
      
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { 
            vapidKey: 'BGHQ_oVn_Q8L9W5Z-6N1YjYy8_8-0-0-0-0-0-0-0-0-0' // placeholder, will try without first or user might need to provide
          });
          if (token) {
            console.log('FCM Token:', token);
            localStorage.setItem('fcm_token', token);
          }
        }
      } catch (error) {
        console.error('FCM Setup error:', error);
      }
    };

    setupFCM();

    // Listen for foreground messages
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Custom foreground notification logic could go here
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    fetchData();

    // Load local watchlist first
    const savedWatchlist = JSON.parse(localStorage.getItem('user_watchlist') || '[]');
    setWatchlist(savedWatchlist);

    // Load local history
    const savedHistory = JSON.parse(localStorage.getItem('user_history') || '[]');
    setHistory(savedHistory);

    const handleToggleDashboard = () => setShowDashboard(prev => !prev);
    window.addEventListener('toggle-admin-dashboard', handleToggleDashboard);

    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync watchlist from Firebase
        const watchlistRef = ref(db, `users/${firebaseUser.uid}/watchlist`);
        const wSnapshot = await get(watchlistRef);
        
        const localWatchlist = JSON.parse(localStorage.getItem('user_watchlist') || '[]');
        
        if (wSnapshot.exists()) {
          const cloudWatchlist = wSnapshot.val();
          // Merge local and cloud, removing duplicates
          const mergedWatchlist = [...new Set([...localWatchlist, ...cloudWatchlist])];
          setWatchlist(mergedWatchlist);
          localStorage.setItem('user_watchlist', JSON.stringify(mergedWatchlist));
          
          // Update cloud if they were different
          if (mergedWatchlist.length !== cloudWatchlist.length) {
            set(watchlistRef, mergedWatchlist);
          }
        } else if (localWatchlist.length > 0) {
          // Cloud empty but local has data, upload it
          set(watchlistRef, localWatchlist);
          setWatchlist(localWatchlist);
        }

        // Sync history from Firebase
        const historyRef = ref(db, `users/${firebaseUser.uid}/history`);
        const hSnapshot = await get(historyRef);
        const localHistory = JSON.parse(localStorage.getItem('user_history') || '[]');
        
        if (hSnapshot.exists()) {
          const cloudHistory = hSnapshot.val();
          const mergedHistory = [...new Set([...localHistory, ...cloudHistory])].slice(0, 10);
          setHistory(mergedHistory);
          localStorage.setItem('user_history', JSON.stringify(mergedHistory));
          
          if (mergedHistory.length !== cloudHistory.length) {
            set(historyRef, mergedHistory);
          }
        } else if (localHistory.length > 0) {
          set(historyRef, localHistory);
          setHistory(localHistory);
        }

        // Check admin role
        const roleRef = ref(db, `users/${firebaseUser.uid}/role`);
        const snapshot = await get(roleRef);
        const role = snapshot.val();
        
        if (role === 'admin' || firebaseUser.email === 'jbmrsports@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        // Store FCM Token for user
        const fcmToken = localStorage.getItem('fcm_token');
        if (fcmToken) {
          set(ref(db, `users/${firebaseUser.uid}/fcmToken`), fcmToken);
        }
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
      const [tSnapshot, mSnapshot, aSnapshot, sSnapshot, fSnapshot, stSnapshot] = await Promise.all([
        get(ref(db, 'tournaments')),
        get(ref(db, 'matches')),
        get(ref(db, 'ads')),
        get(ref(db, 'sports')),
        get(ref(db, 'fixtures')),
        get(ref(db, 'standings'))
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
      const sportsList = sSnapshot.exists()
        ? (Object.values(sSnapshot.val()) as Sport[])
        : [];
      const fixturesList = fSnapshot.exists()
        ? (Object.values(fSnapshot.val()) as Fixture[])
        : [];
      const standingsList = stSnapshot.exists()
        ? (Object.values(stSnapshot.val()) as Standing[])
        : [];

      setSports(sportsList);
      setFixtures(fixturesList);
      setStandings(standingsList);

      const fetchedMatches = matchesList.length
        ? matchesList.map(match => ({ ...match, featured: !!match.featured }))
        : mockMatches;

      // Sort by ID descending to get latest content first
      fetchedMatches.sort((a, b) => b.id.localeCompare(a.id));

      // Track new data for notifications
      const existingMatchIds = JSON.parse(localStorage.getItem('seen_match_ids') || '[]');
      const newMatches = fetchedMatches.filter(m => !existingMatchIds.includes(m.id));
      
      if (newMatches.length > 0) {
        setNotifications(newMatches);
      }

      setTournaments(tournamentsList.length ? tournamentsList : mockTournaments);
      setMatches(fetchedMatches);
      setAds(adsList);

      // Restore selected match from URL
      const params = new URLSearchParams(window.location.search);
      const matchId = params.get('matchId');
      if (matchId) {
        const match = fetchedMatches.find(m => m.id === matchId);
        if (match) {
          const t = tournamentsList.find(tour => tour.id === match.tournamentId) || mockTournaments.find(tour => tour.id === match.tournamentId);
          setSelectedMatch({ ...match, tournament: t?.name || '' });
        }
      }
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setIsInitialLoad(false);
    }
  };

  const handleClearNotifications = () => {
    const allMatchIds = matches.map(m => m.id);
    localStorage.setItem('seen_match_ids', JSON.stringify(allMatchIds));
    setNotifications([]);
    setShowNotifications(false);
  };

  const toggleWatchlist = async (matchId: string) => {
    let next: string[];
    setWatchlist(prev => {
      next = prev.includes(matchId) 
        ? prev.filter(id => id !== matchId) 
        : [...prev, matchId];
      
      localStorage.setItem('user_watchlist', JSON.stringify(next));
      
      // Sync to Firebase if logged in
      if (user) {
        import('firebase/database').then(({ ref, set }) => {
          set(ref(db, `users/${user.uid}/watchlist`), next);
        });
      }
      
      return next;
    });
  };

  const handlePlayMatch = (match: Match) => {
    // Add to history
    setHistory(prev => {
      const next = [match.id, ...prev.filter(id => id !== match.id)].slice(0, 10);
      localStorage.setItem('user_history', JSON.stringify(next));
      if (user) {
        import('firebase/database').then(({ ref, set }) => {
          set(ref(db, `users/${user.uid}/history`), next);
        });
      }
      return next;
    });

    const tournamentName = tournaments.find(t => t.id === match.tournamentId)?.name || '';
    setSelectedMatch({ ...match, tournament: tournamentName });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSelectedMatch(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showDashboard) {
    return <AdminDashboard onLogout={() => { setShowDashboard(false); fetchData(); }} />;
  }

  // Filter matches based on tournament, watchlist and search query
  const filteredMatches = matches.filter(m => {
    let categoryMatch = false;
    if (activeCategory === 'All') {
      categoryMatch = true;
    } else if (activeCategory === 'Watchlist') {
      categoryMatch = watchlist.includes(m.id);
    } else {
      // Check for sport ID match or tournament ID match
      categoryMatch = m.sportId === activeCategory || m.tournamentId === activeCategory;
    }

    const searchMatch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournaments.find(t => t.id === m.tournamentId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sports.find(s => s.id === m.sportId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Featured match (first one or first of category)
  const featuredMatch = filteredMatches[0];

  return (
    <div className="min-h-screen text-zinc-50 font-sans selection:bg-sky-500/30 overflow-x-hidden">
      {ads.filter(a => a.active).map(ad => (
        <AdBanner key={ad.id} ad={ad} />
      ))}
      
      <Navbar 
        ref={navbarRef}
        activeCategory={activeCategory} 
        onSelectCategory={handleCategoryChange} 
        onLoginClick={() => setShowAuthModal(true)}
        user={user}
        isAdmin={isAdmin}
        onDashboardClick={() => setShowDashboard(true)}
        onLogout={handleLogout}
        tournaments={tournaments}
        sports={sports}
        matches={matches}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notificationCount={notifications.length}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
        onPlayMatch={handlePlayMatch}
        onInstallClick={handleInstallClick}
        showInstallButton={!!deferredPrompt}
      />

      {showNotifications && (
        <div className="fixed top-20 right-4 sm:right-6 lg:right-12 w-[calc(100%-2rem)] sm:w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">New Highlights</h3>
            <button 
              onClick={handleClearNotifications}
              className="text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-400"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(match => (
                <div 
                  key={match.id}
                  onClick={() => {
                    handlePlayMatch(match);
                    setShowNotifications(false);
                  }}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 border-b border-white/5 last:border-0"
                >
                  {getThumbnailUrl(match) ? (
                    <img src={getThumbnailUrl(match)!} className="w-16 h-10 object-cover rounded-lg flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-16 h-10 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Play className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white line-clamp-1">{match.title}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{match.duration} • {match.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <main className="pb-32">
        {selectedMatch ? (
          <DetailsPage 
            match={selectedMatch} 
            allMatches={matches}
            tournaments={tournaments}
            watchlist={watchlist}
            activeCategory={activeCategory}
            onToggleWatchlist={toggleWatchlist}
            onBack={() => setSelectedMatch(null)}
            onPlay={handlePlayMatch}
            onSelectCategory={handleCategoryChange}
          />
        ) : (
          <>
            {filteredMatches.length > 0 ? (
              <Hero 
                matches={filteredMatches.slice(0, 5).map(m => {
                  const t = tournaments.find(tour => tour.id === m.tournamentId);
                  return {
                    ...m,
                    tournament: t?.name || '',
                    tournamentShortName: t?.shortName || t?.name || ''
                  };
                })} 
                onPlay={handlePlayMatch} 
              />
            ) : (
              <div className="h-[40vh] flex items-center justify-center text-zinc-600 font-black uppercase tracking-widest bg-zinc-900/20">
                No highlights available
              </div>
            )}

            <LiveTicker />

            {/* Desktop Tournament Rail */}
            <div className="hidden sm:block">
              <TournamentRail 
                tournaments={tournaments} 
                activeCategory={activeCategory} 
                onSelectCategory={handleCategoryChange} 
              />
            </div>

            <div className="mt-4 space-y-12">
              {activeCategory === 'All' ? (
                <>
                  {/* Continue Watching */}
                  {history.length > 0 && (
                    <div className="relative pt-4">
                      <VideoRow 
                        title="Continue Watching" 
                        matches={history.map(id => matches.find(m => m.id === id)).filter(Boolean).map(m => ({
                          ...m!,
                          tournament: tournaments.find(t => t.id === m!.tournamentId)?.name || ''
                        }))} 
                        onPlay={handlePlayMatch} 
                      />
                    </div>
                  )}

                  {/* Trending & Tournament Rows */}
                  <div className="relative pt-4 space-y-4">
                    <FixtureRow fixtures={fixtures} tournaments={tournaments} />
                    
                    <VideoRow 
                      title="Trending Now" 
                      matches={[...matches].sort(() => 0.5 - Math.random()).slice(0, 12).map(m => ({
                        ...m,
                        tournament: tournaments.find(t => t.id === m.tournamentId)?.name || ''
                      }))} 
                      onPlay={handlePlayMatch} 
                    />
                  </div>

                  {/* Mobile Tournament Rail (Moved below Trending) */}
                  <div className="sm:hidden">
                    <TournamentRail 
                      tournaments={tournaments} 
                      activeCategory={activeCategory} 
                      onSelectCategory={handleCategoryChange} 
                    />
                  </div>

                  {/* Tournament Rows */}
                  {tournaments.map((tournament, idx) => {
                    const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
                    if (tournamentMatches.length === 0) return null;
                    return (
                      <div key={tournament.id} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                        <VideoRow 
                          title={`${tournament.shortName || tournament.name} Highlights`} 
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
                    title={activeCategory === 'Watchlist' ? 'My Watchlist' : `All ${activeCategory} Highlights`} 
                    matches={filteredMatches.map(m => ({
                      ...m,
                      tournament: tournaments.find(t => t.id === m.tournamentId)?.name || ''
                    }))} 
                    onPlay={handlePlayMatch} 
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-white/5 py-12 sm:py-20 bg-black/20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
          <div className="col-span-1 md:col-span-2 space-y-4 sm:space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="bg-sky-500 p-1.5 rounded-lg">
                <Play className="w-5 h-5 text-zinc-950 fill-zinc-950" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">JBMR SPORTS</span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto md:mx-0 font-medium leading-relaxed">
              Experience the best cricket highlights in 4K Ultra HD. Premium content for the ultimate sports fan. Stream anywhere, anytime.
            </p>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Company</h4>
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-zinc-500 font-bold">
              <a href="#" className="hover:text-sky-500 transition-colors">About Us</a>
              <a href="#" className="hover:text-sky-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-sky-500 transition-colors">Privacy Policy</a>
            </div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Support</h4>
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-zinc-500 font-bold">
              <a href="#" className="hover:text-sky-500 transition-colors">Help Center</a>
              <a href="#" className="hover:text-sky-500 transition-colors">Cookie Preferences</a>
              <a href="#" className="hover:text-sky-500 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-600 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center">&copy; {new Date().getFullYear()} JBMR SPORTS. All Rights Reserved.</p>
          <div className="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="text-[10px] font-black text-white tracking-widest border border-white/20 px-2 py-1 rounded">4K</div>
            <div className="text-[10px] font-black text-white tracking-widest border border-white/20 px-2 py-1 rounded">UHD</div>
            <div className="text-[10px] font-black text-white tracking-widest border border-white/20 px-2 py-1 rounded">HDR</div>
          </div>
        </div>
      </footer>

      <BottomNav 
        activeCategory={activeCategory}
        onSelectCategory={handleCategoryChange}
        onSearchClick={() => {
          setSelectedMatch(null);
          // Small delay to ensure focus works if we add it
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }, 100);
        }}
        onLoginClick={() => setShowAuthModal(true)}
        onProfileClick={() => navbarRef.current?.toggleProfileMenu()}
        user={user}
        isAdmin={isAdmin}
        onDashboardClick={() => setShowDashboard(true)}
      />

      {showAuthModal && (
        <AuthModal 
          onCancel={() => setShowAuthModal(false)} 
        />
      )}

      {ads.filter(a => a.active && a.type === 'aston').map(ad => (
        <AdBanner key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
