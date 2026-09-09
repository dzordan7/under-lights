import { createFeature, createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Tournament } from '../../core/models/tournament.model';
import { TournamentActions, TournamentFilters } from './tournament.actions';

export interface TournamentState extends EntityState<Tournament> {
  loading: boolean;
  error: string | null;
  filters: TournamentFilters;
}

export const tournamentAdapter = createEntityAdapter<Tournament>();

const initialState: TournamentState = tournamentAdapter.getInitialState({
  loading: false,
  error: null,
  filters: {},
});

export const tournamentFeature = createFeature({
  name: 'tournaments',
  reducer: createReducer(
    initialState,
    on(TournamentActions.loadTournaments, (state, { filters }) => ({
      ...state,
      loading: true,
      error: null,
      filters,
    })),
    on(TournamentActions.loadTournamentsSuccess, (state, { tournaments }) =>
      tournamentAdapter.setAll(tournaments, { ...state, loading: false }),
    ),
    on(TournamentActions.loadTournamentsFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
  ),
});

export const {
  name: tournamentFeatureKey,
  reducer: tournamentReducer,
  selectTournamentsState,
  selectLoading,
  selectError,
  selectFilters,
} = tournamentFeature;
