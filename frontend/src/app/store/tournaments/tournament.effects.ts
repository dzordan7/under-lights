import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { TournamentActions } from './tournament.actions';

@Injectable()
export class TournamentEffects {
  private actions$ = inject(Actions);
  private tournamentService = inject(TournamentService);

  loadTournaments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TournamentActions.loadTournaments),
      switchMap(({ filters }) =>
        this.tournamentService.getAll(filters.grad, filters.status).pipe(
          map((tournaments) => TournamentActions.loadTournamentsSuccess({ tournaments })),
          catchError((err) =>
            of(
              TournamentActions.loadTournamentsFailure({
                error: err.error?.message ?? 'Greška pri učitavanju turnira.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
