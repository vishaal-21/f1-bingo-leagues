import { League, LeagueMember, Race, Board, Claim, User } from '@/types';

export const currentUser: User = {
  id: 'user-1',
  email: 'max@f1fan.com',
  displayName: 'MaxVerstappen33',
  avatarUrl: undefined,
};

const users: User[] = [
  currentUser,
  { id: 'user-2', email: 'lewis@f1fan.com', displayName: 'HammerTime44' },
  { id: 'user-3', email: 'charles@f1fan.com', displayName: 'Leclerc16' },
  { id: 'user-4', email: 'lando@f1fan.com', displayName: 'LandoNorris' },
  { id: 'user-5', email: 'oscar@f1fan.com', displayName: 'OscarP81' },
  { id: 'user-6', email: 'carlos@f1fan.com', displayName: 'SmoothOperator' },
];

export const mockLeagues: League[] = [
  {
    id: 'league-1',
    name: 'Pit Lane Legends',
    seasonYear: 2026,
    inviteCode: 'PIT-2026-XKCD',
    scoringMode: 'points',
    createdBy: 'user-1',
    memberCount: 6,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'league-2',
    name: 'DRS Zone Degens',
    seasonYear: 2026,
    inviteCode: 'DRS-YOLO-42',
    scoringMode: 'classic',
    createdBy: 'user-2',
    memberCount: 4,
    createdAt: '2026-02-01T14:30:00Z',
  },
];

export const mockMembers: LeagueMember[] = [
  { id: 'm1', leagueId: 'league-1', userId: 'user-1', user: users[0], cumulativePoints: 385, totalCorrectPredictions: 28, totalBingos: 2, joinedAt: '2026-01-15T10:00:00Z' },
  { id: 'm2', leagueId: 'league-1', userId: 'user-2', user: users[1], cumulativePoints: 340, totalCorrectPredictions: 24, totalBingos: 1, joinedAt: '2026-01-16T08:00:00Z' },
  { id: 'm3', leagueId: 'league-1', userId: 'user-3', user: users[2], cumulativePoints: 290, totalCorrectPredictions: 20, totalBingos: 1, joinedAt: '2026-01-17T12:00:00Z' },
  { id: 'm4', leagueId: 'league-1', userId: 'user-4', user: users[3], cumulativePoints: 265, totalCorrectPredictions: 19, totalBingos: 0, joinedAt: '2026-01-18T09:00:00Z' },
  { id: 'm5', leagueId: 'league-1', userId: 'user-5', user: users[4], cumulativePoints: 210, totalCorrectPredictions: 15, totalBingos: 0, joinedAt: '2026-01-20T11:00:00Z' },
  { id: 'm6', leagueId: 'league-1', userId: 'user-6', user: users[5], cumulativePoints: 180, totalCorrectPredictions: 12, totalBingos: 0, joinedAt: '2026-01-22T15:00:00Z' },
];

// Helper to determine race status based on current date
const getRaceStatus = (raceDate: string): Race['status'] => {
  const now = new Date();
  const race = new Date(raceDate);
  const raceWeekStart = new Date(race);
  raceWeekStart.setDate(raceWeekStart.getDate() - 3); // Wednesday before race Sunday

  if (now > race) return 'finished';
  // For demo purposes, make first race in the future "live" if within race day
  if (now >= raceWeekStart && now <= race) return 'upcoming'; // race week = board unlocked
  return 'upcoming';
};

// Full 2026 F1 Calendar
export const f1Calendar2026: Omit<Race, 'leagueId'>[] = [
  { id: 'race-aus', name: 'Australian Grand Prix', scheduledStartTime: '2026-03-08T04:00:00Z', lockTime: '2026-03-08T03:00:00Z', status: 'upcoming', country: 'Australia', flagEmoji: '🇦🇺' },
  { id: 'race-chn', name: 'Chinese Grand Prix', scheduledStartTime: '2026-03-15T07:00:00Z', lockTime: '2026-03-15T06:00:00Z', status: 'upcoming', country: 'China', flagEmoji: '🇨🇳' },
  { id: 'race-jpn', name: 'Japanese Grand Prix', scheduledStartTime: '2026-03-29T05:00:00Z', lockTime: '2026-03-29T04:00:00Z', status: 'upcoming', country: 'Japan', flagEmoji: '🇯🇵' },
  { id: 'race-bhr', name: 'Bahrain Grand Prix', scheduledStartTime: '2026-04-12T15:00:00Z', lockTime: '2026-04-12T14:00:00Z', status: 'upcoming', country: 'Bahrain', flagEmoji: '🇧🇭' },
  { id: 'race-ksa', name: 'Saudi Arabian Grand Prix', scheduledStartTime: '2026-04-19T17:00:00Z', lockTime: '2026-04-19T16:00:00Z', status: 'upcoming', country: 'Saudi Arabia', flagEmoji: '🇸🇦' },
  { id: 'race-mia', name: 'Miami Grand Prix', scheduledStartTime: '2026-05-03T19:00:00Z', lockTime: '2026-05-03T18:00:00Z', status: 'upcoming', country: 'United States', flagEmoji: '🇺🇸' },
  { id: 'race-can', name: 'Canadian Grand Prix', scheduledStartTime: '2026-05-24T18:00:00Z', lockTime: '2026-05-24T17:00:00Z', status: 'upcoming', country: 'Canada', flagEmoji: '🇨🇦' },
  { id: 'race-mon', name: 'Monaco Grand Prix', scheduledStartTime: '2026-06-07T13:00:00Z', lockTime: '2026-06-07T12:00:00Z', status: 'upcoming', country: 'Monaco', flagEmoji: '🇲🇨' },
  { id: 'race-cat', name: 'Barcelona-Catalunya Grand Prix', scheduledStartTime: '2026-06-14T13:00:00Z', lockTime: '2026-06-14T12:00:00Z', status: 'upcoming', country: 'Spain', flagEmoji: '🇪🇸' },
  { id: 'race-aut', name: 'Austrian Grand Prix', scheduledStartTime: '2026-06-28T13:00:00Z', lockTime: '2026-06-28T12:00:00Z', status: 'upcoming', country: 'Austria', flagEmoji: '🇦🇹' },
  { id: 'race-gbr', name: 'British Grand Prix', scheduledStartTime: '2026-07-05T14:00:00Z', lockTime: '2026-07-05T13:00:00Z', status: 'upcoming', country: 'United Kingdom', flagEmoji: '🇬🇧' },
  { id: 'race-bel', name: 'Belgian Grand Prix', scheduledStartTime: '2026-07-19T13:00:00Z', lockTime: '2026-07-19T12:00:00Z', status: 'upcoming', country: 'Belgium', flagEmoji: '🇧🇪' },
  { id: 'race-hun', name: 'Hungarian Grand Prix', scheduledStartTime: '2026-07-26T13:00:00Z', lockTime: '2026-07-26T12:00:00Z', status: 'upcoming', country: 'Hungary', flagEmoji: '🇭🇺' },
  { id: 'race-ned', name: 'Dutch Grand Prix', scheduledStartTime: '2026-08-23T13:00:00Z', lockTime: '2026-08-23T12:00:00Z', status: 'upcoming', country: 'Netherlands', flagEmoji: '🇳🇱' },
  { id: 'race-ita', name: 'Italian Grand Prix', scheduledStartTime: '2026-09-06T13:00:00Z', lockTime: '2026-09-06T12:00:00Z', status: 'upcoming', country: 'Italy', flagEmoji: '🇮🇹' },
  { id: 'race-esp', name: 'Spanish Grand Prix', scheduledStartTime: '2026-09-13T13:00:00Z', lockTime: '2026-09-13T12:00:00Z', status: 'upcoming', country: 'Spain', flagEmoji: '🇪🇸' },
  { id: 'race-aze', name: 'Azerbaijan Grand Prix', scheduledStartTime: '2026-09-26T11:00:00Z', lockTime: '2026-09-26T10:00:00Z', status: 'upcoming', country: 'Azerbaijan', flagEmoji: '🇦🇿' },
  { id: 'race-sgp', name: 'Singapore Grand Prix', scheduledStartTime: '2026-10-11T12:00:00Z', lockTime: '2026-10-11T11:00:00Z', status: 'upcoming', country: 'Singapore', flagEmoji: '🇸🇬' },
  { id: 'race-usa', name: 'United States Grand Prix', scheduledStartTime: '2026-10-25T19:00:00Z', lockTime: '2026-10-25T18:00:00Z', status: 'upcoming', country: 'United States', flagEmoji: '🇺🇸' },
  { id: 'race-mex', name: 'Mexico City Grand Prix', scheduledStartTime: '2026-11-01T20:00:00Z', lockTime: '2026-11-01T19:00:00Z', status: 'upcoming', country: 'Mexico', flagEmoji: '🇲🇽' },
  { id: 'race-bra', name: 'São Paulo Grand Prix', scheduledStartTime: '2026-11-08T17:00:00Z', lockTime: '2026-11-08T16:00:00Z', status: 'upcoming', country: 'Brazil', flagEmoji: '🇧🇷' },
  { id: 'race-lvs', name: 'Las Vegas Grand Prix', scheduledStartTime: '2026-11-21T06:00:00Z', lockTime: '2026-11-21T05:00:00Z', status: 'upcoming', country: 'United States', flagEmoji: '🇺🇸' },
  { id: 'race-qat', name: 'Qatar Grand Prix', scheduledStartTime: '2026-11-29T14:00:00Z', lockTime: '2026-11-29T13:00:00Z', status: 'upcoming', country: 'Qatar', flagEmoji: '🇶🇦' },
  { id: 'race-abd', name: 'Abu Dhabi Grand Prix', scheduledStartTime: '2026-12-06T13:00:00Z', lockTime: '2026-12-06T12:00:00Z', status: 'upcoming', country: 'Abu Dhabi', flagEmoji: '🇦🇪' },
];

// Generate races for a league with proper status based on current date
export const getRacesForLeague = (leagueId: string): Race[] => {
  const now = new Date();
  return f1Calendar2026.map((race) => {
    const raceDate = new Date(race.scheduledStartTime);
    const raceWeekStart = new Date(raceDate);
    raceWeekStart.setDate(raceWeekStart.getDate() - 6); // Monday of race week

    let status: Race['status'];
    if (now > raceDate) {
      status = 'finished';
    } else if (now >= raceWeekStart && now <= raceDate) {
      status = 'upcoming'; // Race week = board can be filled
    } else {
      status = 'locked'; // Not race week yet = disabled
    }

    return { ...race, leagueId, status };
  });
};

// Keep old mockRaces for backward compat but use getRacesForLeague in league page
export const mockRaces: Race[] = getRacesForLeague('league-1');

const predictionTexts = [
  'Safety car in first 5 laps', 'Red flag shown', 'Verstappen leads lap 1',
  'Hamilton overtakes on track', 'McLaren 1-2 at any point', 'Rain interrupts race',
  'DRS train forms for 10+ laps', 'Leclerc locks up into turn 1', 'Team radio rage moment',
  'Pit stop under 2 seconds', 'Position gained on pit strategy', 'Norris sets fastest lap',
  'FREE SPACE', 'Crash in the midfield', 'Blue flag controversy',
  'Driver complains about tyres', 'Undercut attempt by Ferrari', 'Overcut works perfectly',
  'Last lap overtake', 'Double stack pit stop', 'Track limits penalty',
  'Mechanical DNF', 'Virtual safety car deployed', 'Surprise podium finisher',
  'Championship lead changes',
];

export const mockBoard: Board = {
  id: 'board-1',
  raceId: 'race-mon',
  userId: 'user-1',
  locked: true,
  predictions: predictionTexts.map((text, i) => ({
    id: `pred-${i}`,
    boardId: 'board-1',
    text,
    positionIndex: i,
    marked: [0, 3, 6, 12, 18, 24].includes(i),
    confirmedAt: [0, 12, 18].includes(i) ? '2026-05-24T13:30:00Z' : undefined,
  })),
};

export const mockClaims: Claim[] = [
  { id: 'claim-1', predictionId: 'pred-0', predictionText: 'Safety car in first 5 laps', claimedBy: users[0], status: 'approved', approvalsCount: 4, rejectsCount: 1, totalVotes: 5, createdAt: '2026-05-24T13:08:00Z' },
  { id: 'claim-2', predictionId: 'pred-3', predictionText: 'Hamilton overtakes on track', claimedBy: users[1], status: 'approved', approvalsCount: 5, rejectsCount: 0, totalVotes: 5, createdAt: '2026-05-24T13:15:00Z' },
  { id: 'claim-3', predictionId: 'pred-8', predictionText: 'Team radio rage moment', claimedBy: users[3], status: 'pending', approvalsCount: 2, rejectsCount: 1, totalVotes: 3, createdAt: '2026-05-24T13:42:00Z' },
  { id: 'claim-4', predictionId: 'pred-15', predictionText: 'Driver complains about tyres', claimedBy: users[2], status: 'pending', approvalsCount: 1, rejectsCount: 0, totalVotes: 1, createdAt: '2026-05-24T13:45:00Z' },
];
