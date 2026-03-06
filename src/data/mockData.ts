import { Race } from '@/types';

// Full 2026 F1 Calendar (lock_time = scheduled_start_time)
export const f1Calendar2026: Omit<Race, 'leagueId'>[] = [
  { id: 'race-aus', name: 'Australian Grand Prix', scheduledStartTime: '2026-03-08T04:00:00Z', lockTime: '2026-03-08T04:00:00Z', finishTime: '2026-03-08T08:00:00Z', status: 'upcoming', country: 'Australia', flagEmoji: '🇦🇺' },
  { id: 'race-chn', name: 'Chinese Grand Prix', scheduledStartTime: '2026-03-15T07:00:00Z', lockTime: '2026-03-15T07:00:00Z', finishTime: '2026-03-15T11:00:00Z', status: 'upcoming', country: 'China', flagEmoji: '🇨🇳' },
  { id: 'race-jpn', name: 'Japanese Grand Prix', scheduledStartTime: '2026-03-29T05:00:00Z', lockTime: '2026-03-29T05:00:00Z', finishTime: '2026-03-29T09:00:00Z', status: 'upcoming', country: 'Japan', flagEmoji: '🇯🇵' },
  { id: 'race-bhr', name: 'Bahrain Grand Prix', scheduledStartTime: '2026-04-12T15:00:00Z', lockTime: '2026-04-12T15:00:00Z', finishTime: '2026-04-12T19:00:00Z', status: 'upcoming', country: 'Bahrain', flagEmoji: '🇧🇭' },
  { id: 'race-ksa', name: 'Saudi Arabian Grand Prix', scheduledStartTime: '2026-04-19T17:00:00Z', lockTime: '2026-04-19T17:00:00Z', finishTime: '2026-04-19T21:00:00Z', status: 'upcoming', country: 'Saudi Arabia', flagEmoji: '🇸🇦' },
  { id: 'race-mia', name: 'Miami Grand Prix', scheduledStartTime: '2026-05-03T19:00:00Z', lockTime: '2026-05-03T19:00:00Z', finishTime: '2026-05-03T23:00:00Z', status: 'upcoming', country: 'United States', flagEmoji: '🇺🇸' },
  { id: 'race-can', name: 'Canadian Grand Prix', scheduledStartTime: '2026-05-24T18:00:00Z', lockTime: '2026-05-24T18:00:00Z', finishTime: '2026-05-24T22:00:00Z', status: 'upcoming', country: 'Canada', flagEmoji: '🇨🇦' },
  { id: 'race-mon', name: 'Monaco Grand Prix', scheduledStartTime: '2026-06-07T13:00:00Z', lockTime: '2026-06-07T13:00:00Z', finishTime: '2026-06-07T17:00:00Z', status: 'upcoming', country: 'Monaco', flagEmoji: '🇲🇨' },
  { id: 'race-cat', name: 'Barcelona-Catalunya Grand Prix', scheduledStartTime: '2026-06-14T13:00:00Z', lockTime: '2026-06-14T13:00:00Z', finishTime: '2026-06-14T17:00:00Z', status: 'upcoming', country: 'Spain', flagEmoji: '🇪🇸' },
  { id: 'race-aut', name: 'Austrian Grand Prix', scheduledStartTime: '2026-06-28T13:00:00Z', lockTime: '2026-06-28T13:00:00Z', finishTime: '2026-06-28T17:00:00Z', status: 'upcoming', country: 'Austria', flagEmoji: '🇦🇹' },
  { id: 'race-gbr', name: 'British Grand Prix', scheduledStartTime: '2026-07-05T14:00:00Z', lockTime: '2026-07-05T14:00:00Z', finishTime: '2026-07-05T18:00:00Z', status: 'upcoming', country: 'United Kingdom', flagEmoji: '🇬🇧' },
  { id: 'race-bel', name: 'Belgian Grand Prix', scheduledStartTime: '2026-07-19T13:00:00Z', lockTime: '2026-07-19T13:00:00Z', finishTime: '2026-07-19T17:00:00Z', status: 'upcoming', country: 'Belgium', flagEmoji: '🇧🇪' },
  { id: 'race-hun', name: 'Hungarian Grand Prix', scheduledStartTime: '2026-07-26T13:00:00Z', lockTime: '2026-07-26T13:00:00Z', finishTime: '2026-07-26T17:00:00Z', status: 'upcoming', country: 'Hungary', flagEmoji: '🇭🇺' },
  { id: 'race-ned', name: 'Dutch Grand Prix', scheduledStartTime: '2026-08-23T13:00:00Z', lockTime: '2026-08-23T13:00:00Z', finishTime: '2026-08-23T17:00:00Z', status: 'upcoming', country: 'Netherlands', flagEmoji: '🇳🇱' },
  { id: 'race-ita', name: 'Italian Grand Prix', scheduledStartTime: '2026-09-06T13:00:00Z', lockTime: '2026-09-06T13:00:00Z', finishTime: '2026-09-06T17:00:00Z', status: 'upcoming', country: 'Italy', flagEmoji: '🇮🇹' },
  { id: 'race-esp', name: 'Spanish Grand Prix', scheduledStartTime: '2026-09-13T13:00:00Z', lockTime: '2026-09-13T13:00:00Z', finishTime: '2026-09-13T17:00:00Z', status: 'upcoming', country: 'Spain', flagEmoji: '🇪🇸' },
  { id: 'race-aze', name: 'Azerbaijan Grand Prix', scheduledStartTime: '2026-09-26T11:00:00Z', lockTime: '2026-09-26T11:00:00Z', finishTime: '2026-09-26T15:00:00Z', status: 'upcoming', country: 'Azerbaijan', flagEmoji: '🇦🇿' },
  { id: 'race-sgp', name: 'Singapore Grand Prix', scheduledStartTime: '2026-10-11T12:00:00Z', lockTime: '2026-10-11T12:00:00Z', finishTime: '2026-10-11T16:00:00Z', status: 'upcoming', country: 'Singapore', flagEmoji: '🇸🇬' },
  { id: 'race-usa', name: 'United States Grand Prix', scheduledStartTime: '2026-10-25T19:00:00Z', lockTime: '2026-10-25T19:00:00Z', finishTime: '2026-10-25T23:00:00Z', status: 'upcoming', country: 'United States', flagEmoji: '🇺🇸' },
  { id: 'race-mex', name: 'Mexico City Grand Prix', scheduledStartTime: '2026-11-01T20:00:00Z', lockTime: '2026-11-01T20:00:00Z', finishTime: '2026-11-02T00:00:00Z', status: 'upcoming', country: 'Mexico', flagEmoji: '🇲🇽' },
  { id: 'race-bra', name: 'São Paulo Grand Prix', scheduledStartTime: '2026-11-08T17:00:00Z', lockTime: '2026-11-08T17:00:00Z', finishTime: '2026-11-08T21:00:00Z', status: 'upcoming', country: 'Brazil', flagEmoji: '🇧🇷' },
  { id: 'race-lvs', name: 'Las Vegas Grand Prix', scheduledStartTime: '2026-11-21T06:00:00Z', lockTime: '2026-11-21T06:00:00Z', finishTime: '2026-11-21T10:00:00Z', status: 'upcoming', country: 'United States', flagEmoji: '🇺🇸' },
  { id: 'race-qat', name: 'Qatar Grand Prix', scheduledStartTime: '2026-11-29T14:00:00Z', lockTime: '2026-11-29T14:00:00Z', finishTime: '2026-11-29T18:00:00Z', status: 'upcoming', country: 'Qatar', flagEmoji: '🇶🇦' },
  { id: 'race-abd', name: 'Abu Dhabi Grand Prix', scheduledStartTime: '2026-12-06T13:00:00Z', lockTime: '2026-12-06T13:00:00Z', finishTime: '2026-12-06T17:00:00Z', status: 'upcoming', country: 'Abu Dhabi', flagEmoji: '🇦🇪' },
];

// Generate races for a league with proper status based on current date
export const getRacesForLeague = (leagueId: string): Race[] => {
  const now = new Date();
  return f1Calendar2026.map((race) => {
    const scheduledStart = new Date(race.scheduledStartTime);
    const lockTime = new Date(race.lockTime);
    const finishTime = new Date(scheduledStart.getTime() + 4 * 60 * 60 * 1000); // 4 hours after start
    const raceWeekStart = new Date(scheduledStart);
    raceWeekStart.setDate(raceWeekStart.getDate() - 6); // Monday of race week

    let status: Race['status'];
    
    if (now >= finishTime) {
      // Race finished (4 hours after start)
      status = 'finished';
    } else if (now >= scheduledStart) {
      // Race is live (started but not finished yet)
      status = 'live';
    } else if (now >= lockTime) {
      // Boards locked (between lock time and race start)
      status = 'locked';
    } else if (now >= raceWeekStart) {
      // Race week - can fill board
      status = 'upcoming';
    } else {
      // Too early - disabled
      status = 'locked';
    }

    return { ...race, leagueId, status };
  });
};
