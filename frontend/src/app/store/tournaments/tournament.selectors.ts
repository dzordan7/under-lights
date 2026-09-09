import { createSelector } from '@ngrx/store';
import { tournamentAdapter, tournamentFeature } from './tournament.reducer';

const { selectAll } = tournamentAdapter.getSelectors();

export const selectAllTournaments = createSelector(
  tournamentFeature.selectTournamentsState,
  selectAll,
);

export const selectTournamentsLoading = tournamentFeature.selectLoading;
export const selectTournamentsError = tournamentFeature.selectError;
export const selectTournamentsFilters = tournamentFeature.selectFilters;
