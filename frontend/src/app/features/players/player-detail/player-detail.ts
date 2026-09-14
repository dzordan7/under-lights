import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, zip, switchMap, takeUntil } from 'rxjs';
import { PlayerService } from '../../../core/services/player.service';
import { PlayerProfile } from '../../../core/models/player-profile.model';
import { Award, AwardType } from '../../../core/models/award.model';

const POZICIJA_LABEL: Record<string, string> = {
  GK: 'Golman',
  DEF: 'Odbrana',
  MID: 'Vezni',
  FWD: 'Napad',
};

@Component({
  selector: 'app-player-detail',
  imports: [RouterLink],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.scss',
})
export class PlayerDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private playerService = inject(PlayerService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  error = signal<string | null>(null);
  profile = signal<PlayerProfile | null>(null);
  awards = signal<Award[]>([]);

  isGoalkeeper = computed(() => this.profile()?.pozicija === 'GK');

  goalkeeperTotals = computed(() => {
    const rows = this.profile()?.po_turnirima ?? [];
    return rows.reduce(
      (zbir, r) => ({
        odbrane: zbir.odbrane + r.odbrane,
        primljeni_golovi: zbir.primljeni_golovi + r.primljeni_golovi,
        clean_sheets: zbir.clean_sheets + r.clean_sheets,
      }),
      { odbrane: 0, primljeni_golovi: 0, clean_sheets: 0 },
    );
  });

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          this.error.set(null);
          return zip(this.playerService.getProfile(id), this.playerService.getAwards(id));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ([profile, awards]) => {
          this.profile.set(profile);
          this.awards.set(awards);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Igrac nije pronadjen.');
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  positionLabel(pozicija: string): string {
    return POZICIJA_LABEL[pozicija] ?? pozicija;
  }

  awardLabel(tip: AwardType): string {
    switch (tip) {
      case AwardType.NAJBOLJI_IGRAC:
        return 'Najbolji igrac';
      case AwardType.NAJBOLJI_GOLMAN:
        return 'Najbolji golman';
      case AwardType.NAJBOLJI_STRELAC:
        return 'Najbolji strelac';
    }
  }
}
