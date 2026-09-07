import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Player } from '../players/player.entity';
import { Match } from './match.entity';

@Entity()
@Unique(['player', 'match'])
export class PlayerMatchStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ default: 0 })
  golovi!: number;

  @Column({ default: 0 })
  asistencije!: number;

  @Column({ default: 0 })
  zuti_kartoni!: number;

  @Column({ default: 0 })
  crveni_kartoni!: number;

  @Column({ default: 0 })
  odbrane!: number;

  @Column({ default: 0 })
  primljeni_golovi!: number;

  @Column({ default: false })
  clean_sheet!: boolean;
}
