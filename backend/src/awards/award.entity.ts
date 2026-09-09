import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Tournament } from '../tournaments/tournament.entity';
import { Player } from '../players/player.entity';
import { AwardType } from './award-type.enum';

@Entity()
@Unique(['tournament', 'tip'])
export class Award {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @Column({ type: 'enum', enum: AwardType })
  tip!: AwardType;

  @CreateDateColumn()
  created_at!: Date;
}
