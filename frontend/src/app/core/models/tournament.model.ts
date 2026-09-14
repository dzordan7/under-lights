export enum TournamentStatus {
  PRIJAVE_OTVORENE = 'PRIJAVE_OTVORENE',
  GRUPNA_FAZA = 'GRUPNA_FAZA',
  ELIMINACIONA_FAZA = 'ELIMINACIONA_FAZA',
  ZAVRSEN = 'ZAVRSEN',
}

export enum RegistrationStatus {
  NA_CEKANJU = 'NA_CEKANJU',
  ODOBRENO = 'ODOBRENO',
  ODBIJENO = 'ODBIJENO',
}

export interface Tournament {
  id: number;
  naziv: string;
  grad: string;
  lokacija?: string;
  broj_grupa: number;
  status: TournamentStatus;
  datum_pocetka?: string;
  created_at?: string;
}

export interface Group {
  id: number;
  naziv: string;
}

export interface TopScorer {
  player_id: number;
  ime: string;
  prezime: string;
  team_naziv: string;
  slika_url?: string;
  golovi: number;
  asistencije: number;
  odigrano: number;
}

export interface TopGoalkeeper {
  player_id: number;
  ime: string;
  prezime: string;
  team_naziv: string;
  slika_url?: string;
  odbrane: number;
  primljeni_golovi: number;
  clean_sheets: number;
  odigrano: number;
}
