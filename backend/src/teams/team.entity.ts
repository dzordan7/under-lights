import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

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

  @CreateDateColumn()
  created_at!: Date;
}
