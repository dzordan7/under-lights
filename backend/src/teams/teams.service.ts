import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async create(dto: CreateTeamDto, kapitenId: number): Promise<Team> {
    const existing = await this.teamsRepository.findOne({
      where: { kapiten: { id: kapitenId } },
    });
    if (existing) {
      throw new ConflictException('Vec vodite jedan tim');
    }

    const team = this.teamsRepository.create({
      naziv: dto.naziv,
      logo_url: dto.logo_url,
      kapiten: { id: kapitenId } as any,
    });
    return this.teamsRepository.save(team);
  }

  async findAll(): Promise<Team[]> {
    return this.teamsRepository.find({ relations: { kapiten: true } });
  }

  async findOne(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: { kapiten: true },
    });
    if (!team) {
      throw new NotFoundException('Tim nije pronadjen');
    }
    return team;
  }
}
