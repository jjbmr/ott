import { Match } from './data';

export function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function getThumbnailUrl(match: Match): string | null {
  if (match.thumbnail && match.thumbnail !== '') {
    return match.thumbnail;
  }
  
  if (match.videoType === 'youtube') {
    const ytId = getYouTubeId(match.videoUrl);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }
  }
  
  // Return null instead of empty string to avoid React warnings on src attribute
  return null;
}
