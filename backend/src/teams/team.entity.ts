import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Player } from 'src/players/player.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  naziv!: string;

  @Column({ nullable: true })
  logo_url?: string;

  @OneToOne(() => User, (user) => user.tim)
  @JoinColumn({ name: 'kapiten_id' })
  kapiten!: User;

  @OneToMany(() => Player, (player) => player.team)
  igraci!: Player[];

  @CreateDateColumn()
  created_at!: Date;
}
