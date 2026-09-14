import { TournamentStatus } from '../models/tournament.model';

export function tournamentPillClass(status: TournamentStatus): string {
  switch (status) {
    case TournamentStatus.PRIJAVE_OTVORENE:
      return 'pill-prijave';
    case TournamentStatus.GRUPNA_FAZA:
      return 'pill-grupna';
    case TournamentStatus.ELIMINACIONA_FAZA:
      return 'pill-eliminaciona';
    case TournamentStatus.ZAVRSEN:
      return 'pill-zavrsen';
  }
}

export function tournamentStatusLabel(status: TournamentStatus): string {
  switch (status) {
    case TournamentStatus.PRIJAVE_OTVORENE:
      return 'Prijave otvorene';
    case TournamentStatus.GRUPNA_FAZA:
      return 'Grupna faza';
    case TournamentStatus.ELIMINACIONA_FAZA:
      return 'Eliminaciona faza';
    case TournamentStatus.ZAVRSEN:
      return 'Zavrsen';
  }
}
