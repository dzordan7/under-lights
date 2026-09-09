import { createActionGroup, props } from '@ngrx/store';
import { Tournament, TournamentStatus } from '../../core/models/tournament.model';

export interface TournamentFilters {
  grad?: string;
  status?: TournamentStatus | '';
}

export const TournamentActions = createActionGroup({
  source: 'Tournament',
  events: {
    'Load Tournaments': props<{ filters: TournamentFilters }>(),
    'Load Tournaments Success': props<{ tournaments: Tournament[] }>(),
    'Load Tournaments Failure': props<{ error: string }>(),
  },
});
