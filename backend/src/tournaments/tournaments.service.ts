import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Tournament } from './tournament.entity';
import { TeamTournament } from './team-tournament.entity';
import { Group } from './group.entity';
import { Match } from '../matches/match.entity';
import { Team } from '../teams/team.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RegistrationStatus } from './registration-status.enum';
import { TournamentStatus } from './tournament-status.enum';
import { MatchPhase } from '../matches/match-phase.enum';
import { MatchStatus } from '../matches/match-status.enum';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(TeamTournament)
    private teamTournamentRepository: Repository<TeamTournament>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {}

  async create(dto: CreateTournamentDto, adminId: number): Promise<Tournament> {
    const tournament = this.tournamentsRepository.create({
      naziv: dto.naziv,
      grad: dto.grad,
      lokacija: dto.lokacija,
      broj_grupa: dto.broj_grupa,
      datum_pocetka: dto.datum_pocetka,
      kreirao: { id: adminId } as any,
    });
    return this.tournamentsRepository.save(tournament);
  }

  async findAll(
    grad?: string,
    status?: TournamentStatus,
  ): Promise<Tournament[]> {
    const where: any = {};
    if (grad) {
      where.grad = ILike(`%${grad}%`);
    }
    if (status) {
      where.status = status;
    }
    return this.tournamentsRepository.find({ where });
  }

  async findOne(id: number): Promise<Tournament> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException('Turnir nije pronadjen');
    }
    return tournament;
  }

  async registerTeam(
    tournamentId: number,
    kapitenId: number,
  ): Promise<TeamTournament> {
    const tournament = await this.findOne(tournamentId);

    const team = await this.teamsRepository.findOne({
      where: { kapiten: { id: kapitenId } },
    });
    if (!team) {
      throw new BadRequestException('Morate imati tim da biste se prijavili');
    }

    const existing = await this.teamTournamentRepository.findOne({
      where: { team: { id: team.id }, tournament: { id: tournamentId } },
    });
    if (existing) {
      throw new ConflictException('Vec ste prijavljeni na ovaj turnir');
    }

    const registration = this.teamTournamentRepository.create({
      team,
      tournament,
      status_prijave: RegistrationStatus.NA_CEKANJU,
    });
    return this.teamTournamentRepository.save(registration);
  }

  async findRegistrations(tournamentId: number): Promise<TeamTournament[]> {
    return this.teamTournamentRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: { team: true },
    });
  }

  async updateRegistrationStatus(
    registrationId: number,
    status: RegistrationStatus,
    adminId: number,
  ): Promise<TeamTournament> {
    const registration = await this.teamTournamentRepository.findOne({
      where: { id: registrationId },
      relations: { tournament: true, team: true },
    });
    if (!registration) {
      throw new NotFoundException('Prijava nije pronadjena');
    }

    registration.status_prijave = status;
    return this.teamTournamentRepository.save(registration);
  }

  async generateGroupStage(tournamentId: number): Promise<Group[]> {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status !== TournamentStatus.PRIJAVE_OTVORENE) {
      throw new ConflictException(
        'Zreb je vec izvrsen ili turnir nije u fazi prijava',
      );
    }

    const approvedRegistrations = await this.teamTournamentRepository.find({
      where: {
        tournament: { id: tournamentId },
        status_prijave: RegistrationStatus.ODOBRENO,
      },
      relations: { team: true },
    });

    const minimumTeams = tournament.broj_grupa * 2;
    if (approvedRegistrations.length < minimumTeams) {
      throw new BadRequestException(
        `Potrebno je najmanje ${minimumTeams} odobrenih timova za ${tournament.broj_grupa} grupa (trenutno ima ${approvedRegistrations.length})`,
      );
    }

    const shuffled = this.shuffleArray(approvedRegistrations);

    const groups: Group[] = [];
    for (let i = 0; i < tournament.broj_grupa; i++) {
      const group = this.groupRepository.create({
        tournament,
        naziv: `Grupa ${String.fromCharCode(65 + i)}`,
      });
      groups.push(await this.groupRepository.save(group));
    }

    const groupAssignments = new Map<number, TeamTournament[]>();
    groups.forEach((g) => groupAssignments.set(g.id, []));

    shuffled.forEach((registration, index) => {
      const group = groups[index % tournament.broj_grupa];
      registration.group = group;
      groupAssignments.get(group.id)!.push(registration);
    });

    await this.teamTournamentRepository.save(shuffled);

    const matchesToCreate: Match[] = [];
    for (const group of groups) {
      const teamsInGroup = groupAssignments.get(group.id)!;
      for (let i = 0; i < teamsInGroup.length; i++) {
        for (let j = i + 1; j < teamsInGroup.length; j++) {
          const match = this.matchRepository.create({
            tournament,
            group,
            faza: MatchPhase.GRUPNA,
            status: MatchStatus.ZAKAZAN,
            teamA: teamsInGroup[i].team,
            teamB: teamsInGroup[j].team,
          });
          matchesToCreate.push(match);
        }
      }
    }
    await this.matchRepository.save(matchesToCreate);

    tournament.status = TournamentStatus.GRUPNA_FAZA;
    await this.tournamentsRepository.save(tournament);

    return groups;
  }

  async findGroups(tournamentId: number): Promise<Group[]> {
    return this.groupRepository.find({
      where: { tournament: { id: tournamentId } },
    });
  }

  async findMatches(tournamentId: number): Promise<Match[]> {
    return this.matchRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: { teamA: true, teamB: true, group: true },
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  async findStandings(tournamentId: number): Promise<TeamTournament[]> {
    const standings = await this.teamTournamentRepository.find({
      where: {
        tournament: { id: tournamentId },
        status_prijave: RegistrationStatus.ODOBRENO,
      },
      relations: { team: true, group: true },
    });

    return standings.sort((a, b) => {
      if (b.bodovi !== a.bodovi) {
        return b.bodovi - a.bodovi;
      }
      const golRazlikaA = a.postignuti_golovi - a.primljeni_golovi;
      const golRazlikaB = b.postignuti_golovi - b.primljeni_golovi;
      if (golRazlikaB !== golRazlikaA) {
        return golRazlikaB - golRazlikaA;
      }
      return b.postignuti_golovi - a.postignuti_golovi;
    });
  }

  async findStandingsByGroup(
    tournamentId: number,
  ): Promise<Map<number, TeamTournament[]>> {
    const standings = await this.teamTournamentRepository.find({
      where: {
        tournament: { id: tournamentId },
        status_prijave: RegistrationStatus.ODOBRENO,
      },
      relations: { team: true, group: true },
    });

    const byGroup = new Map<number, TeamTournament[]>();

    for (const entry of standings) {
      if (!entry.group) continue;
      const groupId = entry.group.id;
      if (!byGroup.has(groupId)) {
        byGroup.set(groupId, []);
      }
      byGroup.get(groupId)!.push(entry);
    }

    for (const [groupId, teams] of byGroup) {
      byGroup.set(groupId, this.sortStandings(teams));
    }

    return byGroup;
  }

  private sortStandings(teams: TeamTournament[]): TeamTournament[] {
    return [...teams].sort((a, b) => {
      if (b.bodovi !== a.bodovi) {
        return b.bodovi - a.bodovi;
      }
      const golRazlikaA = a.postignuti_golovi - a.primljeni_golovi;
      const golRazlikaB = b.postignuti_golovi - b.primljeni_golovi;
      if (golRazlikaB !== golRazlikaA) {
        return golRazlikaB - golRazlikaA;
      }
      return b.postignuti_golovi - a.postignuti_golovi;
    });
  }

  async generateKnockoutStage(tournamentId: number): Promise<Match[]> {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status !== TournamentStatus.GRUPNA_FAZA) {
      throw new ConflictException('Turnir nije u grupnoj fazi');
    }

    const nezavrseniMecevi = await this.matchRepository.count({
      where: {
        tournament: { id: tournamentId },
        faza: MatchPhase.GRUPNA,
        status: MatchStatus.ZAKAZAN,
      },
    });

    if (nezavrseniMecevi > 0) {
      throw new BadRequestException(
        `Grupna faza nije zavrsena — ostalo je jos ${nezavrseniMecevi} neodigranih meceva`,
      );
    }

    const byGroup = await this.findStandingsByGroup(tournamentId);
    const groupIds = Array.from(byGroup.keys()).sort((a, b) => a - b);

    const prvoplasirani: TeamTournament[] = [];
    const drugoplasirani: TeamTournament[] = [];

    for (const groupId of groupIds) {
      const teams = byGroup.get(groupId)!;
      if (teams.length < 2) {
        throw new BadRequestException(
          'Svaka grupa mora imati najmanje dva tima',
        );
      }
      prvoplasirani.push(teams[0]);
      drugoplasirani.push(teams[1]);
    }

    const ukupnoKvalifikovanih = prvoplasirani.length + drugoplasirani.length;
    const faza = this.odrediFazu(ukupnoKvalifikovanih);

    const parovi: Array<[TeamTournament, TeamTournament]> = [];
    const brojGrupa = groupIds.length;

    for (let i = 0; i < brojGrupa; i++) {
      const protivnickaGrupa = (i + 1) % brojGrupa;
      parovi.push([prvoplasirani[i], drugoplasirani[protivnickaGrupa]]);
    }

    const meceviZaKreiranje = parovi.map(([timA, timB]) =>
      this.matchRepository.create({
        tournament,
        group: undefined,
        faza,
        status: MatchStatus.ZAKAZAN,
        teamA: timA.team,
        teamB: timB.team,
      }),
    );

    const sacuvaniMecevi = await this.matchRepository.save(meceviZaKreiranje);

    tournament.status = TournamentStatus.ELIMINACIONA_FAZA;
    await this.tournamentsRepository.save(tournament);

    return sacuvaniMecevi;
  }

  private odrediFazu(brojTimova: number): MatchPhase {
    if (brojTimova >= 16) return MatchPhase.OSMINA;
    if (brojTimova >= 8) return MatchPhase.CETVRTFINALE;
    if (brojTimova >= 4) return MatchPhase.POLUFINALE;
    return MatchPhase.FINALE;
  }

  async advanceKnockoutRound(tournamentId: number): Promise<Match[]> {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status !== TournamentStatus.ELIMINACIONA_FAZA) {
      throw new ConflictException('Turnir nije u eliminacionoj fazi');
    }

    const trenutnaFaza = await this.nadjiTrenutnuFazu(tournamentId);

    const meceviFaze = await this.matchRepository.find({
      where: { tournament: { id: tournamentId }, faza: trenutnaFaza },
      relations: { teamA: true, teamB: true },
      order: { id: 'ASC' },
    });

    const neodigrani = meceviFaze.filter(
      (m) => m.status === MatchStatus.ZAKAZAN,
    );
    if (neodigrani.length > 0) {
      throw new BadRequestException(
        `Nisu odigrani svi mecevi trenutne faze ostalo je jos ${neodigrani.length}`,
      );
    }

    const pobednici = meceviFaze.map((m) => this.odrediPobednika(m));

    if (pobednici.length === 1) {
      tournament.status = TournamentStatus.ZAVRSEN;
      await this.tournamentsRepository.save(tournament);
      return [];
    }

    const sledecaFaza = this.odrediFazu(pobednici.length);

    const noviMecevi: Match[] = [];
    for (let i = 0; i < pobednici.length; i += 2) {
      noviMecevi.push(
        this.matchRepository.create({
          tournament,
          group: undefined,
          faza: sledecaFaza,
          status: MatchStatus.ZAKAZAN,
          teamA: pobednici[i],
          teamB: pobednici[i + 1],
        }),
      );
    }

    return this.matchRepository.save(noviMecevi);
  }

  private odrediPobednika(match: Match): Team {
    if (match.rezultat_a === match.rezultat_b) {
      throw new BadRequestException(
        `Mec ${match.id} je zavrsen nereseno u eliminacionoj fazi mora postojati pobednik`,
      );
    }
    return match.rezultat_a! > match.rezultat_b! ? match.teamA : match.teamB;
  }

  private async nadjiTrenutnuFazu(tournamentId: number): Promise<MatchPhase> {
    const redosled = [
      MatchPhase.OSMINA,
      MatchPhase.CETVRTFINALE,
      MatchPhase.POLUFINALE,
      MatchPhase.FINALE,
    ];

    let poslednja: MatchPhase | null = null;

    for (const faza of redosled) {
      const broj = await this.matchRepository.count({
        where: { tournament: { id: tournamentId }, faza },
      });
      if (broj > 0) {
        poslednja = faza;
      }
    }

    if (!poslednja) {
      throw new BadRequestException('Nema meceva eliminacione faze');
    }

    return poslednja;
  }

  async update(
    id: number,
    dto: Partial<CreateTournamentDto>,
  ): Promise<Tournament> {
    const tournament = await this.findOne(id);

    if (dto.naziv !== undefined) tournament.naziv = dto.naziv;
    if (dto.grad !== undefined) tournament.grad = dto.grad;
    if (dto.lokacija !== undefined) tournament.lokacija = dto.lokacija;
    if (dto.broj_grupa !== undefined) tournament.broj_grupa = dto.broj_grupa;
    if (dto.datum_pocetka !== undefined)
      tournament.datum_pocetka = dto.datum_pocetka;

    return this.tournamentsRepository.save(tournament);
  }

  async remove(id: number): Promise<void> {
    const tournament = await this.findOne(id);
    await this.tournamentsRepository.remove(tournament);
  }
}
