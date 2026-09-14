import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, zip, takeUntil } from 'rxjs';
import { TournamentService } from '../../core/services/tournament.service';
import { TeamService } from '../../core/services/team.service';
import { Tournament, TournamentStatus, Group } from '../../core/models/tournament.model';
import { TeamTournament, Player } from '../../core/models/team.model';
import { Match, MatchPhase, MatchStatus } from '../../core/models/match.model';
import { AwardType, AwardSuggestion, Award } from '../../core/models/award.model';
import { MatchResultModal } from './match-result-modal/match-result-modal';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, MatchResultModal],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private tournamentService = inject(TournamentService);
  private teamService = inject(TeamService);
  private destroy$ = new Subject<void>();

  loadingList = signal(true);
  loadingDetail = signal(false);
  tournaments = signal<Tournament[]>([]);
  selectedId = signal<number | null>(null);

  selected = signal<Tournament | null>(null);
  registrations = signal<TeamTournament[]>([]);
  groups = signal<Group[]>([]);
  standings = signal<TeamTournament[]>([]);
  matches = signal<Match[]>([]);

  actionMsg = signal<string | null>(null);
  actionBusy = signal(false);

  showCreateForm = signal(false);
  creating = signal(false);
  createForm = this.fb.group({
    naziv: ['', [Validators.required]],
    grad: ['', [Validators.required]],
    lokacija: [''],
    broj_grupa: [2, [Validators.required, Validators.min(1)]],
    datum_pocetka: [''],
  });

  selectedMatch = signal<Match | null>(null);

  awards = signal<Award[]>([]);
  awardSuggestions = signal<AwardSuggestion[]>([]);
  loadingAwards = signal(false);
  awardingType = signal<AwardType | null>(null);

  finalPlayers = signal<Player[]>([]);
  selectedBestPlayerId = signal<number | null>(null);

  TournamentStatus = TournamentStatus;
  AwardType = AwardType;

  approvedCount = computed(
    () => this.registrations().filter((r) => r.status_prijave === 'ODOBRENO').length,
  );
  minTeamsForDraw = computed(() => (this.selected()?.broj_grupa ?? 0) * 2);
  canDraw = computed(() => this.approvedCount() >= this.minTeamsForDraw());

  groupMatches = computed(() => this.matches().filter((m) => m.faza === MatchPhase.GRUPNA));
  unplayedGroupMatches = computed(() =>
    this.groupMatches().filter((m) => m.status !== MatchStatus.ODIGRAN),
  );
  canStartKnockout = computed(
    () => this.groupMatches().length > 0 && this.unplayedGroupMatches().length === 0,
  );

  currentKnockoutRound = computed<Match[]>(() => {
    const knockout = this.matches().filter((m) => m.faza !== MatchPhase.GRUPNA);
    if (knockout.length === 0) return [];
    const redosled = [
      MatchPhase.OSMINA,
      MatchPhase.CETVRTFINALE,
      MatchPhase.POLUFINALE,
      MatchPhase.FINALE,
    ];
    let poslednjaFaza = knockout[0].faza;
    for (const faza of redosled) {
      if (knockout.some((m) => m.faza === faza)) poslednjaFaza = faza;
    }
    return knockout.filter((m) => m.faza === poslednjaFaza);
  });
  unplayedKnockoutMatches = computed(() =>
    this.currentKnockoutRound().filter((m) => m.status !== MatchStatus.ODIGRAN),
  );
  canAdvanceKnockout = computed(
    () => this.currentKnockoutRound().length > 0 && this.unplayedKnockoutMatches().length === 0,
  );

  finalMatch = computed(() => this.matches().find((m) => m.faza === MatchPhase.FINALE));

  groupStandings = computed(() => {
    const byGroupId = this.standings().reduce<Map<number, TeamTournament[]>>((acc, row) => {
      if (!row.group) return acc;
      const list = acc.get(row.group.id) ?? [];
      list.push(row);
      acc.set(row.group.id, list);
      return acc;
    }, new Map());

    return this.groups()
      .filter((g) => byGroupId.has(g.id))
      .map((group) => ({
        group,
        rows: [...(byGroupId.get(group.id) ?? [])].sort((a, b) => {
          if (b.bodovi !== a.bodovi) return b.bodovi - a.bodovi;
          const grA = a.postignuti_golovi - a.primljeni_golovi;
          const grB = b.postignuti_golovi - b.primljeni_golovi;
          if (grB !== grA) return grB - grA;
          return b.postignuti_golovi - a.postignuti_golovi;
        }),
      }));
  });

  ngOnInit() {
    this.tournamentService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.tournaments.set(list);
        this.loadingList.set(false);
        if (list.length > 0) {
          this.selectTournament(list[0].id);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTournament(id: number) {
    this.selectedId.set(id);
    this.actionMsg.set(null);
    this.loadingDetail.set(true);
    this.awards.set([]);
    this.awardSuggestions.set([]);
    this.finalPlayers.set([]);
    this.selectedBestPlayerId.set(null);

    zip(
      this.tournamentService.getOne(id),
      this.tournamentService.getRegistrations(id),
      this.tournamentService.getGroups(id),
      this.tournamentService.getStandings(id),
      this.tournamentService.getMatches(id),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([tournament, registrations, groups, standings, matches]) => {
        this.selected.set(tournament);
        this.registrations.set(registrations);
        this.groups.set(groups);
        this.standings.set(standings);
        this.matches.set(matches);
        this.loadingDetail.set(false);

        if (tournament.status === TournamentStatus.ZAVRSEN) {
          this.loadAwardsTab();
        }
      });
  }

  refreshDetail() {
    const id = this.selectedId();
    if (id) this.selectTournament(id);
  }

  updateRegistration(registrationId: number, status: 'ODOBRENO' | 'ODBIJENO') {
    this.tournamentService
      .updateRegistrationStatus(registrationId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshDetail());
  }

  runDraw() {
    const id = this.selectedId();
    if (!id) return;
    this.actionBusy.set(true);
    this.actionMsg.set(null);
    this.tournamentService
      .generateGroupStage(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionBusy.set(false);
          this.refreshDetail();
        },
        error: (err) => {
          this.actionBusy.set(false);
          this.actionMsg.set(err.error?.message ?? 'Zreb nije uspeo.');
        },
      });
  }

  startKnockout() {
    const id = this.selectedId();
    if (!id) return;
    this.actionBusy.set(true);
    this.actionMsg.set(null);
    this.tournamentService
      .generateKnockoutStage(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionBusy.set(false);
          this.refreshDetail();
        },
        error: (err) => {
          this.actionBusy.set(false);
          this.actionMsg.set(err.error?.message ?? 'Pokretanje eliminacione faze nije uspelo.');
        },
      });
  }

  advanceRound() {
    const id = this.selectedId();
    if (!id) return;
    this.actionBusy.set(true);
    this.actionMsg.set(null);
    this.tournamentService
      .advanceKnockoutRound(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionBusy.set(false);
          this.refreshDetail();
        },
        error: (err) => {
          this.actionBusy.set(false);
          this.actionMsg.set(err.error?.message ?? 'Prelazak u sledece kolo nije uspeo.');
        },
      });
  }

  submitCreateTournament() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    const raw = this.createForm.getRawValue();
    this.tournamentService
      .create({
        naziv: raw.naziv!,
        grad: raw.grad!,
        lokacija: raw.lokacija || undefined,
        broj_grupa: Number(raw.broj_grupa),
        datum_pocetka: raw.datum_pocetka || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (t) => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset({
            naziv: '',
            grad: '',
            lokacija: '',
            broj_grupa: 2,
            datum_pocetka: '',
          });
          this.tournaments.update((list) => [t, ...list]);
          this.selectTournament(t.id);
        },
        error: () => this.creating.set(false),
      });
  }

  openResultModal(m: Match) {
    this.selectedMatch.set(m);
  }

  closeResultModal() {
    this.selectedMatch.set(null);
  }

  onResultSaved() {
    this.selectedMatch.set(null);
    this.refreshDetail();
  }

  loadAwardsTab() {
    const id = this.selectedId();
    if (!id) return;

    this.loadingAwards.set(true);

    zip(this.tournamentService.getAwards(id), this.tournamentService.getAwardSuggestions(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([awards, suggestions]) => {
        this.awards.set(awards);
        this.awardSuggestions.set(suggestions);
        this.loadingAwards.set(false);
        this.loadFinalPlayers();
      });
  }

  private loadFinalPlayers() {
    const final = this.finalMatch();
    if (!final) {
      this.finalPlayers.set([]);
      return;
    }

    zip(this.teamService.getPlayers(final.teamA.id), this.teamService.getPlayers(final.teamB.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([playersA, playersB]) => this.finalPlayers.set([...playersA, ...playersB]));
  }

  givenAward(tip: AwardType): Award | undefined {
    return this.awards().find((a) => a.tip === tip);
  }

  giveAward(tip: AwardType, playerId: number) {
    const id = this.selectedId();
    if (!id) return;

    this.awardingType.set(tip);
    this.tournamentService
      .createAward(id, playerId, tip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.awardingType.set(null);
          this.loadAwardsTab();
        },
        error: (err) => {
          this.awardingType.set(null);
          this.actionMsg.set(err.error?.message ?? 'Dodela nagrade nije uspela.');
        },
      });
  }

  giveBestPlayer() {
    const id = this.selectedId();
    const playerId = this.selectedBestPlayerId();
    if (!id || !playerId) return;

    this.awardingType.set(AwardType.NAJBOLJI_IGRAC);
    this.tournamentService
      .createAward(id, playerId, AwardType.NAJBOLJI_IGRAC)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.awardingType.set(null);
          this.selectedBestPlayerId.set(null);
          this.loadAwardsTab();
        },
        error: (err) => {
          this.awardingType.set(null);
          this.actionMsg.set(err.error?.message ?? 'Dodela nagrade nije uspela.');
        },
      });
  }

  suggestionFor(tip: AwardType): AwardSuggestion | undefined {
    return this.awardSuggestions().find((s) => s.tip === tip);
  }

  faseLabel(faza: MatchPhase | undefined): string {
    if (!faza) return '';
    switch (faza) {
      case MatchPhase.OSMINA:
        return 'Osmina finala';
      case MatchPhase.CETVRTFINALE:
        return 'Cetvrtfinale';
      case MatchPhase.POLUFINALE:
        return 'Polufinale';
      case MatchPhase.FINALE:
        return 'Finale';
      default:
        return faza;
    }
  }

  showEditForm = signal(false);
  editing = signal(false);
  editForm = this.fb.group({
    naziv: ['', [Validators.required]],
    grad: ['', [Validators.required]],
    lokacija: [''],
    broj_grupa: [2, [Validators.required, Validators.min(1)]],
    datum_pocetka: [''],
  });

  deleting = signal(false);

  openEditForm() {
    const t = this.selected();
    if (!t) return;

    this.editForm.reset({
      naziv: t.naziv,
      grad: t.grad,
      lokacija: t.lokacija ?? '',
      broj_grupa: t.broj_grupa,
      datum_pocetka: t.datum_pocetka ?? '',
    });
    this.showEditForm.set(true);
  }

  cancelEditForm() {
    this.showEditForm.set(false);
  }

  submitEditTournament() {
    const id = this.selectedId();
    if (!id || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.editing.set(true);
    const raw = this.editForm.getRawValue();

    this.tournamentService
      .update(id, {
        naziv: raw.naziv!,
        grad: raw.grad!,
        lokacija: raw.lokacija || undefined,
        broj_grupa: Number(raw.broj_grupa),
        datum_pocetka: raw.datum_pocetka || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editing.set(false);
          this.showEditForm.set(false);
          this.tournaments.update((list) =>
            list.map((t) => (t.id === id ? { ...t, naziv: raw.naziv!, grad: raw.grad! } : t)),
          );
          this.refreshDetail();
        },
        error: (err) => {
          this.editing.set(false);
          this.actionMsg.set(err.error?.message ?? 'Izmena nije uspela.');
        },
      });
  }

  deleteTournament() {
    const t = this.selected();
    if (!t) return;

    if (!confirm(`Obrisi "${t.naziv}" ?`)) return;

    this.deleting.set(true);
    this.tournamentService
      .remove(t.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          const preostali = this.tournaments().filter((x) => x.id !== t.id);
          this.tournaments.set(preostali);
          this.selected.set(null);
          this.selectedId.set(null);
          if (preostali.length > 0) {
            this.selectTournament(preostali[0].id);
          }
        },
        error: (err) => {
          this.deleting.set(false);
          this.actionMsg.set(err.error?.message ?? 'Brisanje nije uspelo.');
        },
      });
  }
}
