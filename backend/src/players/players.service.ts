import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';
import { Team } from '../teams/team.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  private async assertOwnsTeam(teamId: number, userId: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: { kapiten: true },
    });
    if (!team) {
      throw new NotFoundException('Tim nije pronadjen');
    }
    if (team.kapiten.id !== userId) {
      throw new ForbiddenException('Mozete upravljati samo svojim timom');
    }
    return team;
  }

  async create(
    teamId: number,
    dto: CreatePlayerDto,
    userId: number,
  ): Promise<Player> {
    const team = await this.assertOwnsTeam(teamId, userId);

    const player = this.playersRepository.create({
      ...dto,
      team,
    });
    return this.playersRepository.save(player);
  }

  async findAllForTeam(teamId: number): Promise<Player[]> {
    return this.playersRepository.find({ where: { team: { id: teamId } } });
  }

  async findOne(id: number): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: { team: true },
    });
    if (!player) {
      throw new NotFoundException('Igrac nije pronadjen');
    }
    return player;
  }

  async update(
    id: number,
    dto: UpdatePlayerDto,
    userId: number,
  ): Promise<Player> {
    const player = await this.findOne(id);
    await this.assertOwnsTeam(player.team.id, userId);

    Object.assign(player, dto);
    return this.playersRepository.save(player);
  }

  async remove(id: number, userId: number): Promise<void> {
    const player = await this.findOne(id);
    await this.assertOwnsTeam(player.team.id, userId);

    await this.playersRepository.remove(player);
  }
}
