import { createSelector } from '@ngrx/store';
import { teamAdapter, teamFeature } from './team.reducer';

const { selectAll } = teamAdapter.getSelectors();

export const selectAllTeams = createSelector(teamFeature.selectTeamsState, selectAll);
