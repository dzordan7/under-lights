import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, zip, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TeamService } from '../../core/services/team.service';
import { PlayerService, PlayerFormData } from '../../core/services/player.service';
import { TournamentService } from '../../core/services/tournament.service';
import { Team, Player, Position, TeamTournament } from '../../core/models/team.model';
import { Tournament, TournamentStatus } from '../../core/models/tournament.model';

@Component({
  selector: 'app-my-team',
  imports: [ReactiveFormsModule],
  templateUrl: './my-team.html',
  styleUrl: './my-team.scss',
})
export class MyTeam implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);
  private tournamentService = inject(TournamentService);
  private destroy$ = new Subject<void>();

  positionOptions = [
    { value: Position.GK, label: 'Golman' },
    { value: Position.DEF, label: 'Odbrana' },
    { value: Position.MID, label: 'Vezni' },
    { value: Position.FWD, label: 'Napad' },
  ];

  loading = signal(true);
  team = signal<Team | null>(null);
  players = signal<Player[]>([]);
  registrations = signal<TeamTournament[]>([]);
  openTournaments = signal<Tournament[]>([]);

  registeredIds = computed(() => new Set(this.registrations().map((r) => r.tournament?.id)));
  availableTournaments = computed(() =>
    this.openTournaments().filter((t) => !this.registeredIds().has(t.id)),
  );

  creatingTeam = signal(false);
  createTeamForm = this.fb.group({
    naziv: ['', [Validators.required]],
  });

  showPlayerForm = signal(false);
  editingPlayerId = signal<number | null>(null);
  savingPlayer = signal(false);
  playerForm = this.fb.group({
    ime: ['', [Validators.required]],
    prezime: ['', [Validators.required]],
    email: [''],
    broj_dresa: [1, [Validators.required, Validators.min(1)]],
    pozicija: [Position.MID, [Validators.required]],
    datum_rodjenja: [''],
    slika_url: [''],
  });

  registeringId = signal<number | null>(null);

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private load() {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    this.teamService
      .getMyTeam(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((team) => {
        this.team.set(team ?? null);
        if (!team) {
          this.loading.set(false);
          return;
        }
        this.loadTeamData(team.id);
      });
  }

  private loadTeamData(teamId: number) {
    zip(
      this.teamService.getPlayers(teamId),
      this.teamService.getRegistrations(teamId),
      this.tournamentService.getAll(undefined, TournamentStatus.PRIJAVE_OTVORENE),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([players, registrations, openTournaments]) => {
        this.players.set(players);
        this.registrations.set(registrations);
        this.openTournaments.set(openTournaments);
        this.loading.set(false);
      });
  }

  submitCreateTeam() {
    if (this.createTeamForm.invalid) {
      this.createTeamForm.markAllAsTouched();
      return;
    }
    this.creatingTeam.set(true);
    const naziv = this.createTeamForm.getRawValue().naziv!;
    this.teamService
      .create(naziv)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (team) => {
          this.creatingTeam.set(false);
          this.team.set(team);
          this.loadTeamData(team.id);
        },
        error: () => this.creatingTeam.set(false),
      });
  }

  openAddPlayer() {
    this.editingPlayerId.set(null);
    this.playerForm.reset({
      ime: '',
      prezime: '',
      email: '',
      broj_dresa: 1,
      pozicija: Position.MID,
      datum_rodjenja: '',
      slika_url: '',
    });
    this.showPlayerForm.set(true);
  }

  openEditPlayer(p: Player) {
    this.editingPlayerId.set(p.id);
    this.playerForm.reset({
      ime: p.ime,
      prezime: p.prezime,
      email: p.email ?? '',
      broj_dresa: p.broj_dresa,
      pozicija: p.pozicija,
      datum_rodjenja: p.datum_rodjenja ?? '',
      slika_url: p.slika_url ?? '',
    });
    this.showPlayerForm.set(true);
  }

  cancelPlayerForm() {
    this.showPlayerForm.set(false);
    this.editingPlayerId.set(null);
  }

  submitPlayer() {
    if (this.playerForm.invalid) {
      this.playerForm.markAllAsTouched();
      return;
    }
    const team = this.team();
    if (!team) return;

    const raw = this.playerForm.getRawValue();
    const data: PlayerFormData = {
      ime: raw.ime!,
      prezime: raw.prezime!,
      email: raw.email || undefined,
      broj_dresa: Number(raw.broj_dresa),
      pozicija: raw.pozicija as Position,
      datum_rodjenja: raw.datum_rodjenja || undefined,
      slika_url: raw.slika_url || undefined,
    };

    this.savingPlayer.set(true);
    const editingId = this.editingPlayerId();
    const request = editingId
      ? this.playerService.update(editingId, data)
      : this.playerService.create(team.id, data);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.savingPlayer.set(false);
        this.showPlayerForm.set(false);
        this.editingPlayerId.set(null);
        this.teamService
          .getPlayers(team.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((players) => this.players.set(players));
      },
      error: () => this.savingPlayer.set(false),
    });
  }

  removePlayer(p: Player) {
    if (!confirm(`Ukloniti igraca ${p.ime} ${p.prezime} iz tima?`)) return;

    this.playerService
      .remove(p.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.players.update((list) => list.filter((x) => x.id !== p.id));
      });
  }

  registerTournament(t: Tournament) {
    this.registeringId.set(t.id);
    this.tournamentService
      .register(t.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.registeringId.set(null);
          const team = this.team();
          if (team) {
            this.teamService
              .getRegistrations(team.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe((regs) => this.registrations.set(regs));
          }
        },
        error: () => this.registeringId.set(null),
      });
  }

  positionLabel(pozicija: string): string {
    return this.positionOptions.find((o) => o.value === pozicija)?.label ?? pozicija;
  }

  statusPillClass(status: string): string {
    switch (status) {
      case 'ODOBRENO':
        return 'pill-odobreno';
      case 'ODBIJENO':
        return 'pill-odbijeno';
      default:
        return 'pill-cekanje';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'ODOBRENO':
        return 'Odobreno';
      case 'ODBIJENO':
        return 'Odbijeno';
      default:
        return 'Na cekanju';
    }
  }
}
