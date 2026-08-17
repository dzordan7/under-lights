import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './tournament.entity';
import { TeamTournament } from './team-tournament.entity';
import { Team } from '../teams/team.entity';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, TeamTournament, Team])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService, TypeOrmModule],
})
export class TournamentsModule {}
