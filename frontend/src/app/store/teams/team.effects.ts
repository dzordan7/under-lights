import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { TeamService } from '../../core/services/team.service';
import { TeamActions } from './team.actions';

@Injectable()
export class TeamEffects {
  private actions$ = inject(Actions);
  private teamService = inject(TeamService);

  loadTeams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TeamActions.loadTeams),
      switchMap(() =>
        this.teamService.getAll().pipe(
          map((teams) => TeamActions.loadTeamsSuccess({ teams })),
          catchError((err) =>
            of(
              TeamActions.loadTeamsFailure({
                error: err.error?.message ?? 'Greska pri ucitavanju ekipa.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
