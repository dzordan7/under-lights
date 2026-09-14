export interface PlayerTournamentStats {
  tournament_id: number;
  tournament_naziv: string;
  odigrano: number;
  golovi: number;
  asistencije: number;
  zuti_kartoni: number;
  crveni_kartoni: number;
  odbrane: number;
  primljeni_golovi: number;
  clean_sheets: number;
}

export interface PlayerProfile {
  id: number;
  ime: string;
  prezime: string;
  pozicija: string;
  broj_dresa: number;
  slika_url?: string;
  team: {
    id: number;
    naziv: string;
  };
  ukupno: {
    odigrano: number;
    golovi: number;
    asistencije: number;
  };
  po_turnirima: PlayerTournamentStats[];
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
