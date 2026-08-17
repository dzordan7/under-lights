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
import { Team } from '../teams/team.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RegistrationStatus } from './registration-status.enum';
import { TournamentStatus } from './tournament-status.enum';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(TeamTournament)
    private teamTournamentRepository: Repository<TeamTournament>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
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
}
