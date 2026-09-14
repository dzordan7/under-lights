import { Component, input, output, OnChanges, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { zip, takeUntil, Subject } from 'rxjs';
import { TeamService } from '../../../core/services/team.service';
import { MatchService, PlayerStatInput } from '../../../core/services/match.service';
import { Match } from '../../../core/models/match.model';
import { Player } from '../../../core/models/team.model';

interface PlayerRow {
  player: Player;
  isGk: boolean;
}

@Component({
  selector: 'app-match-result-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './match-result-modal.html',
  styleUrl: './match-result-modal.scss',
})
export class MatchResultModal implements OnChanges {
  match = input.required<Match>();
  closed = output<void>();
  saved = output<void>();

  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);
  private matchService = inject(MatchService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  playersA = signal<PlayerRow[]>([]);
  playersB = signal<PlayerRow[]>([]);

  scoreForm = this.fb.group({
    rezultat_a: [0, [Validators.required, Validators.min(0)]],
    rezultat_b: [0, [Validators.required, Validators.min(0)]],
  });

  statsA: FormArray<FormGroup> = this.fb.array<FormGroup>([]);
  statsB: FormArray<FormGroup> = this.fb.array<FormGroup>([]);

  ngOnChanges() {
    this.loadPlayers();
  }

  private loadPlayers() {
    const m = this.match();
    this.loading.set(true);
    this.errorMsg.set(null);

    zip(this.teamService.getPlayers(m.teamA.id), this.teamService.getPlayers(m.teamB.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([playersA, playersB]) => {
        this.playersA.set(playersA.map((p) => ({ player: p, isGk: p.pozicija === 'GK' })));
        this.playersB.set(playersB.map((p) => ({ player: p, isGk: p.pozicija === 'GK' })));

        this.statsA = this.fb.array(playersA.map(() => this.buildStatGroup()));
        this.statsB = this.fb.array(playersB.map(() => this.buildStatGroup()));

        this.scoreForm.reset({ rezultat_a: 0, rezultat_b: 0 });
        this.loading.set(false);
      });
  }

  private buildStatGroup(): FormGroup {
    return this.fb.group({
      golovi: [0],
      asistencije: [0],
      odbrane: [0],
      primljeni_golovi: [0],
      zuti_kartoni: [0],
      crveni_kartoni: [0],
    });
  }

  close() {
    this.closed.emit();
  }

  submit() {
    this.errorMsg.set(null);

    if (this.scoreForm.invalid) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    const raw = this.scoreForm.getRawValue();
    const rezultatA = Number(raw.rezultat_a);
    const rezultatB = Number(raw.rezultat_b);

    const sumA = this.sumGoals(this.statsA);
    const sumB = this.sumGoals(this.statsB);

    if (sumA !== rezultatA || sumB !== rezultatB) {
      this.errorMsg.set(
        `Zbir golova igraca (${sumA}:${sumB}) ne odgovara unetom rezultatu (${rezultatA}:${rezultatB}).`,
      );
      return;
    }

    this.saving.set(true);

    const stats: PlayerStatInput[] = [
      ...this.collectStats(this.playersA(), this.statsA),
      ...this.collectStats(this.playersB(), this.statsB),
    ];

    this.matchService
      .completeMatch(this.match().id, { rezultat_a: rezultatA, rezultat_b: rezultatB, stats })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMsg.set(err.error?.message ?? 'Cuvanje rezultata nije uspelo.');
        },
      });
  }

  private sumGoals(form: FormArray<FormGroup>): number {
    return form.controls.reduce(
      (zbir, group) => zbir + (Number(group.get('golovi')?.value) || 0),
      0,
    );
  }

  private collectStats(rows: PlayerRow[], form: FormArray<FormGroup>): PlayerStatInput[] {
    const result: PlayerStatInput[] = [];
    rows.forEach((row, i) => {
      const v = form.at(i).getRawValue();
      const hasSomething =
        Number(v.golovi) > 0 ||
        Number(v.asistencije) > 0 ||
        Number(v.odbrane) > 0 ||
        Number(v.primljeni_golovi) > 0 ||
        Number(v.zuti_kartoni) > 0 ||
        Number(v.crveni_kartoni) > 0;
      if (!hasSomething) return;

      result.push({
        player_id: row.player.id,
        golovi: row.isGk ? 0 : Number(v.golovi) || 0,
        asistencije: row.isGk ? 0 : Number(v.asistencije) || 0,
        odbrane: row.isGk ? Number(v.odbrane) || 0 : 0,
        primljeni_golovi: row.isGk ? Number(v.primljeni_golovi) || 0 : 0,
        zuti_kartoni: Number(v.zuti_kartoni) || 0,
        crveni_kartoni: Number(v.crveni_kartoni) || 0,
      });
    });
    return result;
  }
}
