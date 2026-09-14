import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { RouterLink } from '@angular/router';
import { LucideSportShoe } from '@lucide/angular';
import { EMPTY, switchMap, zip, takeUntil, take, Subject } from 'rxjs';
import { TournamentActions } from '../../store/tournaments/tournament.actions';
import { selectTournamentsLoading } from '../../store/tournaments/tournament.selectors';
import { TournamentService } from '../../core/services/tournament.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/user.model';
import { Tournament, TournamentStatus, TopScorer } from '../../core/models/tournament.model';
import { Match, MatchStatus } from '../../core/models/match.model';
import {
  tournamentPillClass,
  tournamentStatusLabel,
} from '../../core/utils/tournament-status.util';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LucideSportShoe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private tournamentService = inject(TournamentService);
  authService = inject(AuthService);
  Role = Role;

  private destroy$ = new Subject<void>();

  loading = this.store.selectSignal(selectTournamentsLoading);

  featuredTournaments = signal<Tournament[]>([]);
  featuredTournamentName = signal<string | null>(null);
  recentResults = signal<Match[]>([]);
  featuredPlayers = signal<TopScorer[]>([]);

  pillClass = tournamentPillClass;
  statusLabel = tournamentStatusLabel;

  ngOnInit() {
    this.store.dispatch(TournamentActions.loadTournaments({ filters: {} }));

    this.actions$
      .pipe(
        ofType(TournamentActions.loadTournamentsSuccess),
        take(1),
        switchMap(({ tournaments }) => {
          this.featuredTournaments.set(tournaments.slice(0, 3));

          if (tournaments.length === 0) {
            return EMPTY;
          }

          const featured =
            tournaments.find(
              (t) =>
                t.status === TournamentStatus.GRUPNA_FAZA ||
                t.status === TournamentStatus.ELIMINACIONA_FAZA,
            ) ?? tournaments[0];

          this.featuredTournamentName.set(featured.naziv);

          return zip(
            this.tournamentService.getMatches(featured.id),
            this.tournamentService.getTopScorers(featured.id),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([matches, scorers]) => {
        this.recentResults.set(
          matches
            .filter((m) => m.status === MatchStatus.ODIGRAN)
            .sort((a, b) => b.id - a.id)
            .slice(0, 4),
        );
        this.featuredPlayers.set(scorers.slice(0, 4));
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initials(naziv: string): string {
    return naziv
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
