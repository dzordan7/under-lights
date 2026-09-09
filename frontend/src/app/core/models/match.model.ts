import { Team } from './team.model';
import { Group, Tournament } from './tournament.model';

export enum MatchPhase {
  GRUPNA = 'GRUPNA',
  OSMINA = 'OSMINA',
  CETVRTFINALE = 'CETVRTFINALE',
  POLUFINALE = 'POLUFINALE',
  FINALE = 'FINALE',
}

export enum MatchStatus {
  ZAKAZAN = 'ZAKAZAN',
  ODIGRAN = 'ODIGRAN',
}

export interface Match {
  id: number;
  tournament?: Tournament;
  group?: Group;
  faza: MatchPhase;
  teamA: Team;
  teamB: Team;
  rezultat_a?: number;
  rezultat_b?: number;
  datum_termin?: string;
  status: MatchStatus;
}
