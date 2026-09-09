import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Award } from './award.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { Player } from '../players/player.entity';
import { TeamTournament } from '../tournaments/team-tournament.entity';
import { CreateAwardDto } from './dto/create-award.dto';
import { AwardType } from './award-type.enum';
import { AwardSuggestion } from './award-suggestion.interface';
import { PlayersService } from '../players/players.service';
import { TournamentStatus } from '../tournaments/tournament-status.enum';

@Injectable()
export class AwardsService {
  constructor(
    @InjectRepository(Award)
    private awardsRepository: Repository<Award>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(TeamTournament)
    private teamTournamentRepository: Repository<TeamTournament>,
    private playersService: PlayersService,
  ) {}

  async findByTournament(tournamentId: number): Promise<Award[]> {
    return this.awardsRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: { player: { team: true } },
    });
  }

  async findByPlayer(playerId: number): Promise<Award[]> {
    return this.awardsRepository.find({
      where: { player: { id: playerId } },
      relations: { tournament: true },
    });
  }

  async getSuggestions(tournamentId: number): Promise<AwardSuggestion[]> {
    const strelci = await this.playersService.getTopScorers(tournamentId, 1);
    const golmani = await this.playersService.getTopGoalkeepers(
      tournamentId,
      1,
    );

    const najboljiStrelac = strelci[0];
    const najboljiGolman = golmani[0];

    return [
      {
        tip: AwardType.NAJBOLJI_STRELAC,
        predlog: najboljiStrelac
          ? {
              player_id: najboljiStrelac.player_id,
              ime: najboljiStrelac.ime,
              prezime: najboljiStrelac.prezime,
              team_naziv: najboljiStrelac.team_naziv,
              razlog: `${najboljiStrelac.golovi} golova na turniru`,
            }
          : null,
      },
      {
        tip: AwardType.NAJBOLJI_GOLMAN,
        predlog: najboljiGolman
          ? {
              player_id: najboljiGolman.player_id,
              ime: najboljiGolman.ime,
              prezime: najboljiGolman.prezime,
              team_naziv: najboljiGolman.team_naziv,
              razlog: `${najboljiGolman.clean_sheets} meceva bez primljenog gola, ${najboljiGolman.odbrane} odbrana`,
            }
          : null,
      },
      {
        tip: AwardType.NAJBOLJI_IGRAC,
        predlog: null,
      },
    ];
  }

  async create(tournamentId: number, dto: CreateAwardDto): Promise<Award> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new NotFoundException('Turnir nije pronadjen');
    }

    if (tournament.status !== TournamentStatus.ZAVRSEN) {
      throw new BadRequestException(
        'Nagrade se dodeljuju tek po zavrsetku turnira',
      );
    }

    const player = await this.playersRepository.findOne({
      where: { id: dto.player_id },
      relations: { team: true },
    });
    if (!player) {
      throw new NotFoundException('Igrac nije pronadjen');
    }

    const ucescePotvrda = await this.teamTournamentRepository.findOne({
      where: {
        team: { id: player.team.id },
        tournament: { id: tournamentId },
      },
    });
    if (!ucescePotvrda) {
      throw new BadRequestException(
        'Tim ovog igraca nije ucestvovao na turniru',
      );
    }

    const postojeca = await this.awardsRepository.findOne({
      where: { tournament: { id: tournamentId }, tip: dto.tip },
    });
    if (postojeca) {
      throw new ConflictException(
        'Ova nagrada je vec dodeljena na ovom turniru',
      );
    }

    const award = this.awardsRepository.create({
      tournament,
      player,
      tip: dto.tip,
    });
    return this.awardsRepository.save(award);
  }

  async remove(awardId: number): Promise<void> {
    const award = await this.awardsRepository.findOne({
      where: { id: awardId },
    });
    if (!award) {
      throw new NotFoundException('Nagrada nije pronadjena');
    }
    await this.awardsRepository.remove(award);
  }
}
