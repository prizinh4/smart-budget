import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  targetAmount: number;

  @Column('decimal', { default: 0 })
  currentAmount: number;

  @ManyToOne(() => User, user => user.id)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}