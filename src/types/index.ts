export type ScoringMode = 'classic' | 'points';
export type RaceStatus = 'upcoming' | 'locked' | 'live' | 'finished';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface League {
  id: string;
  name: string;
  seasonYear: number;
  inviteCode: string;
  scoringMode: ScoringMode;
  createdBy: string;
  memberCount: number;
  createdAt: string;
}

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  user: User;
  cumulativePoints: number;
  totalCorrectPredictions: number;
  totalBingos: number;
  joinedAt: string;
}

export interface Race {
  id: string;
  leagueId: string;
  name: string;
  scheduledStartTime: string;
  lockTime: string;
  finishTime: string;
  status: RaceStatus;
  country: string;
  flagEmoji: string;
  isSprintWeekend?: boolean;
}

export interface Prediction {
  id: string;
  boardId: string;
  text: string;
  positionIndex: number;
  marked: boolean;
  confirmedAt?: string;
}

export interface Board {
  id: string;
  raceId: string;
  userId: string;
  locked: boolean;
  predictions: Prediction[];
}

export interface Claim {
  id: string;
  predictionId: string;
  predictionText: string;
  claimedBy: User;
  leagueId: string;
  status: ClaimStatus;
  approvalsCount: number;
  rejectsCount: number;
  totalVotes: number;
  createdAt: string;
}

export interface RaceScore {
  id: string;
  raceId: string;
  userId: string;
  user: User;
  racePoints: number;
  correctPredictions: number;
  hasBingo: boolean;
}

// Rivalries types
export type RivalryStatus = 'pending' | 'active' | 'declined' | 'ended';

export interface Rivalry {
  id: string;
  user1Id: string;
  user2Id: string;
  status: RivalryStatus;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  createdAt: string;
  // Populated fields
  rivalUser?: User;
  cumulativeScore?: {
    myWins: number;
    rivalWins: number;
    ties: number;
  };
}

export interface RivalApproval {
  id: string;
  rivalryId: string;
  raceId: string;
  predictionId: string;
  approvedBy: string;
  approved: boolean;
  notes?: string;
  createdAt: string;
}

export interface RivalResult {
  id: string;
  rivalryId: string;
  raceId: string;
  userId: string;
  boardId?: string;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
  bingos: number;
  calculatedAt: string;
}
