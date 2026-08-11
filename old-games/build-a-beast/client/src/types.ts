export type RoomPhase = "lobby" | "building" | "simulating" | "podium";
export type PlayerStatus = "lobby" | "building" | "submitted" | "finished";
export type Stats = Record<string, number>;

export type BeastPart = {
  id: string;
  name: string;
  category: string;
  description: string;
  cost: number;
  stats: Stats;
};

export type ArenaEvent = {
  id: string;
  title: string;
  description: string;
  statWeights: Stats;
  danger: number;
};

export type Challenge = {
  id: string;
  title: string;
  mode: "education" | "fun";
  subject: string;
  description: string;
  minParts: number;
  maxParts: number;
  parts: BeastPart[];
  events: ArenaEvent[];
};

export type Player = {
  id: string;
  socketId: string;
  name: string;
  score: number;
  status: PlayerStatus;
  submittedAt?: number;
};

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  beastName: string;
  score: number;
  rank: number;
  partCount: number;
  summary: string;
};

export type HostDashboardPlayer = {
  id: string;
  name: string;
  status: PlayerStatus;
  score: number;
  submitted: boolean;
  beastName: string;
  selectedPartCount: number;
  submittedAt?: number;
};

export type HostDashboard = {
  room: {
    id: string;
    phase: RoomPhase;
    playerCount: number;
    challengeTitle: string;
    submittedCount: number;
  };
  challenge: Challenge;
  leaderboard: LeaderboardEntry[];
  players: HostDashboardPlayer[];
};

export type BeastBuild = {
  playerId: string;
  playerName: string;
  beastName: string;
  selectedPartIds: string[];
  submittedAt: number;
};

export type TimelineResult = {
  playerId: string;
  playerName: string;
  beastName: string;
  delta: number;
  scoreAfter: number;
  reasons: string[];
};

export type SimulationStep = {
  eventId: string;
  title: string;
  description: string;
  results: TimelineResult[];
};

export type SimulationOutput = {
  timeline: SimulationStep[];
  leaderboard: LeaderboardEntry[];
};
