import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Award } from './award.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { Player } from '../players/player.entity';
import { TeamTournament } from '../tournaments/team-tournament.entity';
import { PlayersModule } from '../players/players.module';
import { AwardsService } from './awards.service';
import { AwardsController } from './awards.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Award, Tournament, Player, TeamTournament]),
    PlayersModule,
  ],
  controllers: [AwardsController],
  providers: [AwardsService],
  exports: [AwardsService, TypeOrmModule],
})
export class AwardsModule {}
