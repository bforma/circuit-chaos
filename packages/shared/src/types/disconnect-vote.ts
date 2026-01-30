export type DisconnectVoteOption = 'remove' | 'random-cards' | 'stop-game';

export interface DisconnectVote {
  playerId: string;           // The disconnected player
  playerName: string;         // Name for display
  votes: Record<string, DisconnectVoteOption>; // voterId -> vote
  startedAt: number;          // Timestamp when vote started
  endsAt: number;             // Timestamp when vote ends
}

export const DISCONNECT_VOTE_DELAY_MS = 30000;  // 30 seconds before vote starts
export const DISCONNECT_VOTE_DURATION_MS = 5000; // 5 seconds to vote
