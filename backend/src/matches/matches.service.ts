import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match } from './match.entity';
import { PlayerMatchStats } from './player-match-stats.entity';
import { TeamTournament } from '../tournaments/team-tournament.entity';
import { Player } from '../players/player.entity';
import { CompleteMatchDto, PlayerStatsDto } from './dto/complete-match.dto';
import { MatchStatus } from './match-status.enum';
import { Position } from '../players/position.enum';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(PlayerMatchStats)
    private statsRepository: Repository<PlayerMatchStats>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    private dataSource: DataSource,
  ) {}

  async findOne(id: number): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: { teamA: true, teamB: true, tournament: true, group: true },
    });
    if (!match) {
      throw new NotFoundException('Mec nije pronadjen');
    }
    return match;
  }

  async findStats(matchId: number): Promise<PlayerMatchStats[]> {
    return this.statsRepository.find({
      where: { match: { id: matchId } },
      relations: { player: true },
    });
  }

  async completeMatch(matchId: number, dto: CompleteMatchDto): Promise<Match> {
    const match = await this.findOne(matchId);

    if (match.status === MatchStatus.ODIGRAN) {
      throw new ConflictException('Rezultat ovog meca je vec unet');
    }

    const statsInput = dto.stats ?? [];

    if (statsInput.length > 0) {
      await this.validateStats(match, statsInput, dto);
    }

    await this.dataSource.transaction(async (manager) => {
      match.rezultat_a = dto.rezultat_a;
      match.rezultat_b = dto.rezultat_b;
      match.status = MatchStatus.ODIGRAN;
      await manager.save(Match, match);

      for (const input of statsInput) {
        const primljeni = input.primljeni_golovi ?? 0;
        const odbrane = input.odbrane ?? 0;
        const jeGolman = odbrane > 0 || input.primljeni_golovi !== undefined;

        const stats = manager.create(PlayerMatchStats, {
          player: { id: input.player_id } as Player,
          match: { id: matchId } as Match,
          golovi: input.golovi ?? 0,
          asistencije: input.asistencije ?? 0,
          zuti_kartoni: input.zuti_kartoni ?? 0,
          crveni_kartoni: input.crveni_kartoni ?? 0,
          odbrane,
          primljeni_golovi: primljeni,
          clean_sheet: jeGolman && primljeni === 0,
        });
        await manager.save(PlayerMatchStats, stats);
      }

      await this.updateStandings(manager, match);
    });

    return this.findOne(matchId);
  }

  private async validateStats(
    match: Match,
    statsInput: PlayerStatsDto[],
    dto: CompleteMatchDto,
  ): Promise<void> {
    const playerIds = statsInput.map((s) => s.player_id);
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== playerIds.length) {
      throw new BadRequestException('Isti igrac je naveden vise puta');
    }

    const players = await this.playerRepository.find({
      where: playerIds.map((id) => ({ id })),
      relations: { team: true },
    });

    if (players.length !== playerIds.length) {
      throw new BadRequestException('Neki od navedenih igraca ne postoji');
    }

    let golovaTimA = 0;
    let golovaTimB = 0;

    for (const input of statsInput) {
      const player = players.find((p) => p.id === input.player_id)!;
      const teamId = player.team.id;

      if (teamId !== match.teamA.id && teamId !== match.teamB.id) {
        throw new BadRequestException(
          `Igrac ${player.ime} ${player.prezime} ne pripada nijednom timu iz ovog meca`,
        );
      }

      if (teamId === match.teamA.id) {
        golovaTimA += input.golovi ?? 0;
      } else {
        golovaTimB += input.golovi ?? 0;
      }
    }

    if (golovaTimA !== dto.rezultat_a || golovaTimB !== dto.rezultat_b) {
      throw new BadRequestException(
        `Zbir golova igraca (${golovaTimA}:${golovaTimB}) ne odgovara rezultatu meca (${dto.rezultat_a}:${dto.rezultat_b})`,
      );
    }
  }

  private async updateStandings(manager: any, match: Match): Promise<void> {
    const tournamentId = match.tournament.id;
    const golA = match.rezultat_a!;
    const golB = match.rezultat_b!;

    const statsA = await this.findRegistration(
      manager,
      match.teamA.id,
      tournamentId,
    );
    const statsB = await this.findRegistration(
      manager,
      match.teamB.id,
      tournamentId,
    );

    statsA.odigrano += 1;
    statsB.odigrano += 1;

    statsA.postignuti_golovi += golA;
    statsA.primljeni_golovi += golB;
    statsB.postignuti_golovi += golB;
    statsB.primljeni_golovi += golA;

    if (golA > golB) {
      statsA.pobede += 1;
      statsA.bodovi += 3;
      statsB.porazi += 1;
    } else if (golB > golA) {
      statsB.pobede += 1;
      statsB.bodovi += 3;
      statsA.porazi += 1;
    } else {
      statsA.neresenio += 1;
      statsB.neresenio += 1;
      statsA.bodovi += 1;
      statsB.bodovi += 1;
    }

    await manager.save(TeamTournament, [statsA, statsB]);
  }

  private async findRegistration(
    manager: any,
    teamId: number,
    tournamentId: number,
  ): Promise<TeamTournament> {
    const registration = await manager.findOne(TeamTournament, {
      where: { team: { id: teamId }, tournament: { id: tournamentId } },
    });
    if (!registration) {
      throw new NotFoundException(
        `Prijava tima ${teamId} na turnir ${tournamentId} nije pronadjena`,
      );
    }
    return registration;
  }
}
