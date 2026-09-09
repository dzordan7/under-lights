import { User } from './user.model';
import { Group, RegistrationStatus, Tournament } from './tournament.model';

export interface Team {
  id: number;
  naziv: string;
  logo_url?: string;
  kapiten?: User;
  igraci?: Player[];
  created_at?: string;
}

export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD',
}

export interface Player {
  id: number;
  ime: string;
  prezime: string;
  email?: string;
  broj_dresa: number;
  pozicija: Position;
  datum_rodjenja?: string;
  team?: Team;
}

export interface TeamTournament {
  id: number;
  team: Team;
  tournament?: Tournament;
  group?: Group;
  status_prijave: RegistrationStatus;
  odigrano: number;
  pobede: number;
  neresenio: number;
  porazi: number;
  postignuti_golovi: number;
  primljeni_golovi: number;
  bodovi: number;
}
