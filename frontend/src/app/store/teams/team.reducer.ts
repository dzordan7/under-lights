import { createFeature, createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { Team } from '../../core/models/team.model';
import { TeamActions } from './team.actions';

export interface TeamState extends EntityState<Team> {
  loading: boolean;
  error: string | null;
}

export const teamAdapter = createEntityAdapter<Team>();

const initialState: TeamState = teamAdapter.getInitialState({
  loading: false,
  error: null,
});

export const teamFeature = createFeature({
  name: 'teams',
  reducer: createReducer(
    initialState,
    on(TeamActions.loadTeams, (state) => ({ ...state, loading: true, error: null })),
    on(TeamActions.loadTeamsSuccess, (state, { teams }) =>
      teamAdapter.setAll(teams, { ...state, loading: false }),
    ),
    on(TeamActions.loadTeamsFailure, (state, { error }) => ({ ...state, loading: false, error })),
  ),
});

export const {
  name: teamFeatureKey,
  reducer: teamReducer,
  selectLoading: selectTeamsLoading,
  selectError: selectTeamsError,
} = teamFeature;
