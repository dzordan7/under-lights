import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { PlayerMatchStats } from './player-match-stats.entity';
import { TeamTournament } from '../tournaments/team-tournament.entity';
import { Player } from '../players/player.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, PlayerMatchStats, TeamTournament, Player]),
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService, TypeOrmModule],
})
export class MatchesModule {}
