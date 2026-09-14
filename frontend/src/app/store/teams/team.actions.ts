import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Team } from '../../core/models/team.model';

export const TeamActions = createActionGroup({
  source: 'Team',
  events: {
    'Load Teams': emptyProps(),
    'Load Teams Success': props<{ teams: Team[] }>(),
    'Load Teams Failure': props<{ error: string }>(),
  },
});
