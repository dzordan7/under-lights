import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './player.entity';
import { Team } from '../teams/team.entity';
import { PlayerMatchStats } from '../matches/player-match-stats.entity';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Team, PlayerMatchStats])],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService, TypeOrmModule],
})
export class PlayersModule {}
