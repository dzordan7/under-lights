import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, zip, switchMap, takeUntil } from 'rxjs';
import { TeamService } from '../../../core/services/team.service';
import { Team, Player } from '../../../core/models/team.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-team-detail',
  imports: [RouterLink],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.scss',
})
export class TeamDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  error = signal<string | null>(null);
  team = signal<Team | null>(null);
  players = signal<Player[]>([]);

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          this.error.set(null);
          return zip(this.teamService.getOne(id), this.teamService.getPlayers(id));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ([team, players]) => {
          this.team.set(team);
          this.players.set(players);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Ekipa nije pronadjena.');
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  positionLabel(pozicija: string): string {
    switch (pozicija) {
      case 'GK':
        return 'Golman';
      case 'DEF':
        return 'Odbrana';
      case 'MID':
        return 'Vezni';
      case 'FWD':
        return 'Napad';
      default:
        return pozicija;
    }
  }
}
