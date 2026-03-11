export type Sport = 'Cricket';

export interface Tournament {
  id: string;
  name: string;
  year: string;
}

export interface Match {
  id: string;
  title: string;
  sport: Sport;
  tournamentId: string;
  tournament?: string;
  stage?: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  date: string;
  views: string;
  description: string;
  featured?: boolean;
}

export const tournaments: Tournament[] = [
  { id: 't1', name: 'Asia Cup', year: '2023' },
  { id: 't2', name: 'The Ashes', year: '2023' }
];

export const matches: Match[] = [
  {
    id: 'm1',
    title: 'India vs Pakistan - Asia Cup Final',
    sport: 'Cricket',
    tournamentId: 't1',
    stage: 'Match 1',
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1920',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '12:45',
    date: '2 Days Ago',
    views: '1.2M',
    description: 'A high-voltage clash between the arch-rivals in the Asia Cup final.',
    featured: true,
  },
  {
    id: 'm3',
    title: 'Sri Lanka vs India - Asia Cup Super 4s',
    sport: 'Cricket',
    tournamentId: 't1',
    stage: 'Match 2',
    thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1920',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '09:15',
    date: '4 Days Ago',
    views: '540K',
    description: 'A thrilling encounter in the Super 4 stage of the Asia Cup.',
  },
  {
    id: 'm2',
    title: 'Australia vs England - The Ashes 2023',
    sport: 'Cricket',
    tournamentId: 't2',
    stage: 'Quarter Final',
    thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1920',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '08:30',
    date: '1 Week Ago',
    views: '850K',
    description: 'Highlights from the historic Ashes series between Australia and England.',
  },
  {
    id: 'm4',
    title: 'England vs Australia - 2nd Test Highlights',
    sport: 'Cricket',
    tournamentId: 't2',
    stage: 'Semi Final',
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1920',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: '11:20',
    date: '2 Weeks Ago',
    views: '920K',
    description: 'Action-packed highlights from the 2nd Test of The Ashes 2023.',
  }
];

