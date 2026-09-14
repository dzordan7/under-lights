import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, zip, switchMap, takeUntil, take } from 'rxjs';
import { TournamentService } from '../../../core/services/tournament.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Tournament,
  TournamentStatus,
  Group,
  TopScorer,
  TopGoalkeeper,
} from '../../../core/models/tournament.model';
import { TeamTournament } from '../../../core/models/team.model';
import { Match, MatchPhase, MatchStatus } from '../../../core/models/match.model';
import { Award, AwardType } from '../../../core/models/award.model';
import { Role } from '../../../core/models/user.model';

type Tab = 'tabela' | 'raspored' | 'zreb' | 'statistika' | 'nagrade';

interface GroupStandings {
  group: Group;
  rows: TeamTournament[];
}

interface BracketRound {
  faza: MatchPhase;
  label: string;
  matches: Match[];
}

const FAZA_REDOSLED: MatchPhase[] = [
  MatchPhase.OSMINA,
  MatchPhase.CETVRTFINALE,
  MatchPhase.POLUFINALE,
  MatchPhase.FINALE,
];

const FAZA_LABEL: Record<MatchPhase, string> = {
  [MatchPhase.GRUPNA]: 'Grupna faza',
  [MatchPhase.OSMINA]: 'Osmina finala',
  [MatchPhase.CETVRTFINALE]: 'Cetvrtfinale',
  [MatchPhase.POLUFINALE]: 'Polufinale',
  [MatchPhase.FINALE]: 'Finale',
};

@Component({
  selector: 'app-tournament-detail',
  imports: [],
  templateUrl: './tournament-detail.html',
  styleUrl: './tournament-detail.scss',
})
export class TournamentDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private tournamentService = inject(TournamentService);
  authService = inject(AuthService);
  Role = Role;
  TournamentStatus = TournamentStatus;

  private destroy$ = new Subject<void>();

  loading = signal(true);
  error = signal<string | null>(null);

  tournament = signal<Tournament | null>(null);
  groups = signal<Group[]>([]);
  standings = signal<TeamTournament[]>([]);
  matches = signal<Match[]>([]);

  activeTab = signal<Tab>('tabela');

  statsLoaded = signal(false);
  topScorers = signal<TopScorer[]>([]);
  topGoalkeepers = signal<TopGoalkeeper[]>([]);

  awardsLoaded = signal(false);
  awards = signal<Award[]>([]);

  registering = signal(false);
  registerMsg = signal<string | null>(null);

  groupStandings = computed<GroupStandings[]>(() => {
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
          const golRazlikaA = a.postignuti_golovi - a.primljeni_golovi;
          const golRazlikaB = b.postignuti_golovi - b.primljeni_golovi;
          if (golRazlikaB !== golRazlikaA) return golRazlikaB - golRazlikaA;
          return b.postignuti_golovi - a.postignuti_golovi;
        }),
      }));
  });

  groupMatches = computed(() => this.matches().filter((m) => m.faza === MatchPhase.GRUPNA));

  bracketRounds = computed<BracketRound[]>(() => {
    const knockout = this.matches().filter((m) => m.faza !== MatchPhase.GRUPNA);
    return FAZA_REDOSLED.map((faza) => ({
      faza,
      label: FAZA_LABEL[faza],
      matches: knockout.filter((m) => m.faza === faza),
    })).filter((round) => round.matches.length > 0);
  });

  odigranoBroj = computed(
    () => this.groupMatches().filter((m) => m.status === MatchStatus.ODIGRAN).length,
  );

  canRegister = computed(() => {
    const t = this.tournament();
    return (
      !!t &&
      t.status === TournamentStatus.PRIJAVE_OTVORENE &&
      this.authService.hasRole(Role.KAPITEN)
    );
  });

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          this.error.set(null);
          this.resetLazyTabs();

          return zip(
            this.tournamentService.getOne(id),
            this.tournamentService.getGroups(id),
            this.tournamentService.getStandings(id),
            this.tournamentService.getMatches(id),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ([tournament, groups, standings, matches]) => {
          this.tournament.set(tournament);
          this.groups.set(groups);
          this.standings.set(standings);
          this.matches.set(matches);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Turnir nije moguce ucitati.');
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);

    const t = this.tournament();
    if (!t) return;

    if (tab === 'statistika' && !this.statsLoaded()) {
      this.loadStats(t.id);
    }
    if (tab === 'nagrade' && !this.awardsLoaded()) {
      this.loadAwards(t.id);
    }
  }

  register() {
    const t = this.tournament();
    if (!t) return;

    this.registering.set(true);
    this.registerMsg.set(null);

    this.tournamentService
      .register(t.id)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.registering.set(false);
          this.registerMsg.set('Prijava poslata — ceka odobrenje organizatora.');
        },
        error: (err) => {
          this.registering.set(false);
          this.registerMsg.set(err.error?.message ?? 'Prijava nije uspela.');
        },
      });
  }

  statusPillClass(status: TournamentStatus): string {
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

  private resetLazyTabs() {
    this.statsLoaded.set(false);
    this.awardsLoaded.set(false);
    this.activeTab.set('tabela');
  }

  private loadStats(tournamentId: number) {
    zip(
      this.tournamentService.getTopScorers(tournamentId),
      this.tournamentService.getTopGoalkeepers(tournamentId),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([scorers, keepers]) => {
        this.topScorers.set(scorers);
        this.topGoalkeepers.set(keepers);
        this.statsLoaded.set(true);
      });
  }

  private loadAwards(tournamentId: number) {
    this.tournamentService
      .getAwards(tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((awards) => {
        this.awards.set(awards);
        this.awardsLoaded.set(true);
      });
  }
}
