export interface Sport {
  id: string;
  name: string;
  icon?: string;
  active: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  year: string;
  logo?: string;
}

export interface Ad {
  id: string;
  title: string;
  videoUrl: string;
  active: boolean;
  linkUrl?: string;
  type: 'video' | 'aston';
}

export interface Match {
  id: string;
  title: string;
  sportId: string;
  tournamentId: string;
  tournament?: string;
  tournamentShortName?: string;
  stage?: string;
  thumbnail: string;
  videoUrl: string;
  videoType?: 'mp4' | 'youtube';
  duration: string;
  date: string;
  time?: string;
  quality?: '4K' | 'Full HD';
  views: string;
  description: string;
  featured?: boolean;
  scoreCardId?: string;
  externalMatchId?: string;
  liveScore?: {
    team1: { name: string; score: string; overs: string };
    team2: { name: string; score: string; overs: string };
    status: string;
  };
}

export interface Fixture {
  id: string;
  tournamentId: string;
  sportId: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  status: 'upcoming' | 'live' | 'finished';
}

export interface Standing {
  id: string;
  tournamentId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  nrr: string;
  points: number;
}

export const tournaments: Tournament[] = [];

export const matches: Match[] = [];

