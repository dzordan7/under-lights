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
}
