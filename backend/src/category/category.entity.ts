import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: false })
  isSystem: boolean;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE', nullable: true })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}