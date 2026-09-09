export interface AwardSuggestion {
  tip: string;
  predlog: {
    player_id: number;
    ime: string;
    prezime: string;
    team_naziv: string;
    razlog: string;
  } | null;
}
