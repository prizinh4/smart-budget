import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';
import { Goal } from '../goal/goal.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('decimal')
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @ManyToOne(() => User, user => user.id)
  user: User;

  @ManyToOne(() => Category, category => category.id, { nullable: true })
  category: Category;

  @ManyToOne(() => Goal, { nullable: true, onDelete: 'SET NULL' })
  goal: Goal;

  @CreateDateColumn()
  createdAt: Date;
}