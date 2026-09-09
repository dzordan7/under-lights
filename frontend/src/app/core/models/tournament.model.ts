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
