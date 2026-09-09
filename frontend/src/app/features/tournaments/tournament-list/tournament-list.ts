import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { TournamentActions } from '../../../store/tournaments/tournament.actions';
import {
  selectAllTournaments,
  selectTournamentsLoading,
} from '../../../store/tournaments/tournament.selectors';
import { TournamentStatus } from '../../../core/models/tournament.model';
import { LucideSportShoe } from '@lucide/angular';

@Component({
  selector: 'app-tournament-list',
  imports: [RouterLink, LucideSportShoe],
  templateUrl: './tournament-list.html',
  styleUrl: './tournament-list.scss',
})
export class TournamentList implements OnInit {
  private store = inject(Store);

  tournaments = this.store.selectSignal(selectAllTournaments);
  loading = this.store.selectSignal(selectTournamentsLoading);

  grad = signal('');
  status = signal<TournamentStatus | ''>('');

  statusOptions: { value: TournamentStatus | ''; label: string }[] = [
    { value: '', label: 'Svi statusi' },
    { value: TournamentStatus.PRIJAVE_OTVORENE, label: 'Prijave otvorene' },
    { value: TournamentStatus.GRUPNA_FAZA, label: 'Grupna faza' },
    { value: TournamentStatus.ELIMINACIONA_FAZA, label: 'Eliminaciona faza' },
    { value: TournamentStatus.ZAVRSEN, label: 'Završeni' },
  ];

  ngOnInit() {
    this.loadTournaments();
  }

  onGradChange(value: string) {
    this.grad.set(value);
    this.loadTournaments();
  }

  onStatusChange(value: string) {
    this.status.set(value as TournamentStatus | '');
    this.loadTournaments();
  }

  clearFilters() {
    this.grad.set('');
    this.status.set('');
    this.loadTournaments();
  }

  pillClass(status: TournamentStatus): string {
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

  statusLabel(status: TournamentStatus): string {
    return this.statusOptions.find((o) => o.value === status)?.label ?? status;
  }

  private loadTournaments() {
    this.store.dispatch(
      TournamentActions.loadTournaments({
        filters: { grad: this.grad(), status: this.status() },
      }),
    );
  }
}
