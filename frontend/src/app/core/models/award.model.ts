import { Player } from './team.model';
import { Tournament } from './tournament.model';

export enum AwardType {
  NAJBOLJI_IGRAC = 'NAJBOLJI_IGRAC',
  NAJBOLJI_GOLMAN = 'NAJBOLJI_GOLMAN',
  NAJBOLJI_STRELAC = 'NAJBOLJI_STRELAC',
}

export interface Award {
  id: number;
  tournament: Tournament;
  player: Player;
  tip: AwardType;
}

export interface AwardSuggestionPlayer {
  player_id: number;
  ime: string;
  prezime: string;
  team_naziv: string;
  razlog: string;
}

export interface AwardSuggestion {
  tip: string;
  predlog: AwardSuggestionPlayer | null;
}
