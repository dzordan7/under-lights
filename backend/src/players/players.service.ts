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
import { PlayerMatchStats } from '../matches/player-match-stats.entity';
import { Position } from './position.enum';
import {
  PlayerProfile,
  PlayerTournamentStats,
  TopScorer,
  TopGoalkeeper,
} from './player-stats.interface';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(PlayerMatchStats)
    private statsRepository: Repository<PlayerMatchStats>,
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

  async getProfile(playerId: number): Promise<PlayerProfile> {
    const player = await this.playersRepository.findOne({
      where: { id: playerId },
      relations: { team: true },
    });
    if (!player) {
      throw new NotFoundException('Igrac nije pronadjen');
    }

    const sveStatistike = await this.statsRepository.find({
      where: { player: { id: playerId } },
      relations: { match: { tournament: true } },
    });

    const poTurnirima = this.grupisiPoTurnirima(sveStatistike);

    const ukupno = sveStatistike.reduce(
      (zbir, s) => ({
        odigrano: zbir.odigrano + 1,
        golovi: zbir.golovi + s.golovi,
        asistencije: zbir.asistencije + s.asistencije,
      }),
      { odigrano: 0, golovi: 0, asistencije: 0 },
    );

    return {
      id: player.id,
      ime: player.ime,
      prezime: player.prezime,
      pozicija: player.pozicija,
      broj_dresa: player.broj_dresa,
      slika_url: player.slika_url,
      team: {
        id: player.team.id,
        naziv: player.team.naziv,
      },
      ukupno,
      po_turnirima: poTurnirima,
    };
  }

  private grupisiPoTurnirima(
    statistike: PlayerMatchStats[],
  ): PlayerTournamentStats[] {
    const mapa = new Map<number, PlayerTournamentStats>();

    for (const s of statistike) {
      const turnir = s.match.tournament;
      if (!turnir) continue;

      if (!mapa.has(turnir.id)) {
        mapa.set(turnir.id, {
          tournament_id: turnir.id,
          tournament_naziv: turnir.naziv,
          odigrano: 0,
          golovi: 0,
          asistencije: 0,
          zuti_kartoni: 0,
          crveni_kartoni: 0,
          odbrane: 0,
          primljeni_golovi: 0,
          clean_sheets: 0,
        });
      }

      const zbir = mapa.get(turnir.id)!;
      zbir.odigrano += 1;
      zbir.golovi += s.golovi;
      zbir.asistencije += s.asistencije;
      zbir.zuti_kartoni += s.zuti_kartoni;
      zbir.crveni_kartoni += s.crveni_kartoni;
      zbir.odbrane += s.odbrane;
      zbir.primljeni_golovi += s.primljeni_golovi;
      zbir.clean_sheets += s.clean_sheet ? 1 : 0;
    }

    return Array.from(mapa.values());
  }

  async getTopScorers(tournamentId: number, limit = 10): Promise<TopScorer[]> {
    const statistike = await this.statsRepository.find({
      where: { match: { tournament: { id: tournamentId } } },
      relations: { player: { team: true }, match: true },
    });

    const mapa = new Map<number, TopScorer>();

    for (const s of statistike) {
      const p = s.player;
      if (!mapa.has(p.id)) {
        mapa.set(p.id, {
          player_id: p.id,
          ime: p.ime,
          prezime: p.prezime,
          team_naziv: p.team?.naziv ?? '',
          slika_url: p.slika_url,
          golovi: 0,
          asistencije: 0,
          odigrano: 0,
        });
      }
      const zbir = mapa.get(p.id)!;
      zbir.golovi += s.golovi;
      zbir.asistencije += s.asistencije;
      zbir.odigrano += 1;
    }

    return Array.from(mapa.values())
      .filter((x) => x.golovi > 0)
      .sort((a, b) => {
        if (b.golovi !== a.golovi) return b.golovi - a.golovi;
        return b.asistencije - a.asistencije;
      })
      .slice(0, limit);
  }

  async getTopGoalkeepers(
    tournamentId: number,
    limit = 10,
  ): Promise<TopGoalkeeper[]> {
    const statistike = await this.statsRepository.find({
      where: { match: { tournament: { id: tournamentId } } },
      relations: { player: { team: true }, match: true },
    });

    const mapa = new Map<number, TopGoalkeeper>();

    for (const s of statistike) {
      const p = s.player;
      if (p.pozicija !== Position.GK) continue;

      if (!mapa.has(p.id)) {
        mapa.set(p.id, {
          player_id: p.id,
          ime: p.ime,
          prezime: p.prezime,
          team_naziv: p.team?.naziv ?? '',
          slika_url: p.slika_url,
          odbrane: 0,
          primljeni_golovi: 0,
          clean_sheets: 0,
          odigrano: 0,
        });
      }
      const zbir = mapa.get(p.id)!;
      zbir.odbrane += s.odbrane;
      zbir.primljeni_golovi += s.primljeni_golovi;
      zbir.clean_sheets += s.clean_sheet ? 1 : 0;
      zbir.odigrano += 1;
    }

    return Array.from(mapa.values())
      .sort((a, b) => {
        if (b.clean_sheets !== a.clean_sheets)
          return b.clean_sheets - a.clean_sheets;
        return b.odbrane - a.odbrane;
      })
      .slice(0, limit);
  }
}
