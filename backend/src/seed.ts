import { DataSource } from 'typeorm';
import { User } from './user/user.entity';
import { Category, CategoryType } from './category/category.entity';
import { Transaction, TransactionType } from './transaction/transaction.entity';
import { Goal, GoalStatus } from './goal/goal.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'smartbudget',
  entities: [User, Category, Transaction, Goal, RefreshToken],
  synchronize: true,
});

// Predefined system categories
const systemCategories = [
  // Expense categories
  { name: 'Alimentação', type: CategoryType.EXPENSE, icon: '🍔', color: '#FF6B6B' },
  { name: 'Transporte', type: CategoryType.EXPENSE, icon: '🚗', color: '#4ECDC4' },
  { name: 'Moradia', type: CategoryType.EXPENSE, icon: '🏠', color: '#45B7D1' },
  { name: 'Saúde', type: CategoryType.EXPENSE, icon: '💊', color: '#96CEB4' },
  { name: 'Educação', type: CategoryType.EXPENSE, icon: '📚', color: '#FFEAA7' },
  { name: 'Lazer', type: CategoryType.EXPENSE, icon: '🎮', color: '#DDA0DD' },
  { name: 'Vestuário', type: CategoryType.EXPENSE, icon: '👕', color: '#FF8C00' },
  { name: 'Contas', type: CategoryType.EXPENSE, icon: '📄', color: '#87CEEB' },
  { name: 'Compras', type: CategoryType.EXPENSE, icon: '🛒', color: '#FFB6C1' },
  { name: 'Assinaturas', type: CategoryType.EXPENSE, icon: '📺', color: '#9370DB' },
  { name: 'Pet', type: CategoryType.EXPENSE, icon: '🐕', color: '#8B4513' },
  { name: 'Viagem', type: CategoryType.EXPENSE, icon: '✈️', color: '#00CED1' },
  { name: 'Presente', type: CategoryType.EXPENSE, icon: '🎁', color: '#FF69B4' },
  { name: 'Outros (Despesa)', type: CategoryType.EXPENSE, icon: '📦', color: '#A9A9A9' },
  
  // Income categories
  { name: 'Salário', type: CategoryType.INCOME, icon: '💰', color: '#2ECC71' },
  { name: 'Freelance', type: CategoryType.INCOME, icon: '💻', color: '#3498DB' },
  { name: 'Investimentos', type: CategoryType.INCOME, icon: '📈', color: '#9B59B6' },
  { name: 'Vendas', type: CategoryType.INCOME, icon: '🏷️', color: '#E67E22' },
  { name: 'Aluguel', type: CategoryType.INCOME, icon: '🏢', color: '#1ABC9C' },
  { name: 'Bonificação', type: CategoryType.INCOME, icon: '🎯', color: '#F39C12' },
  { name: 'Reembolso', type: CategoryType.INCOME, icon: '💵', color: '#27AE60' },
  { name: 'Outros (Receita)', type: CategoryType.INCOME, icon: '✨', color: '#95A5A6' },
];

// Sample users to create
const usersData = [
  { email: 'joao@exemplo.com', password: 'Senha123!' },
  { email: 'maria@exemplo.com', password: 'Senha123!' },
  { email: 'carlos@exemplo.com', password: 'Senha123!' },
  { email: 'ana@exemplo.com', password: 'Senha123!' },
  { email: 'pedro@exemplo.com', password: 'Senha123!' },
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomBetween(0, daysBack));
  return date;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('🌱 Initializing database connection...');
  await dataSource.initialize();
  
  console.log('🧹 Cleaning database...');
  // Clean tables using raw query to handle empty tables
  await dataSource.query('TRUNCATE TABLE transaction, goal, category, refresh_tokens, "user" RESTART IDENTITY CASCADE');
  
  console.log('📁 Creating system categories...');
  const categoryRepo = dataSource.getRepository(Category);
  const createdCategories: Category[] = [];
  
  for (const catData of systemCategories) {
    const category = categoryRepo.create({
      ...catData,
      isSystem: true,
      user: null as any,
    });
    const saved = await categoryRepo.save(category);
    createdCategories.push(saved as Category);
  }
  console.log(`   ✓ Created ${createdCategories.length} system categories`);
  
  const expenseCategories = createdCategories.filter(c => c.type === CategoryType.EXPENSE);
  const incomeCategories = createdCategories.filter(c => c.type === CategoryType.INCOME);
  
  console.log('👥 Creating users...');
  const userRepo = dataSource.getRepository(User);
  const transactionRepo = dataSource.getRepository(Transaction);
  const goalRepo = dataSource.getRepository(Goal);
  
  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = userRepo.create({
      email: userData.email,
      password: hashedPassword,
    });
    const savedUser = await userRepo.save(user);
    console.log(`   ✓ Created user: ${userData.email}`);
    
    // Create transactions for this user (30-60 transactions over last 90 days)
    const numTransactions = randomBetween(30, 60);
    console.log(`   📊 Creating ${numTransactions} transactions...`);
    
    for (let i = 0; i < numTransactions; i++) {
      const isExpense = Math.random() > 0.35; // 65% expenses, 35% income
      const category = isExpense 
        ? randomElement(expenseCategories) 
        : randomElement(incomeCategories);
      
      let amount: number;
      let title: string;
      
      if (isExpense) {
        switch (category.name) {
          case 'Alimentação':
            amount = randomBetween(15, 150);
            title = randomElement(['Almoço', 'Jantar', 'Supermercado', 'Lanche', 'Café', 'iFood', 'Restaurante']);
            break;
          case 'Transporte':
            amount = randomBetween(5, 200);
            title = randomElement(['Uber', '99', 'Combustível', 'Estacionamento', 'Metrô', 'Ônibus', 'Pedágio']);
            break;
          case 'Moradia':
            amount = randomBetween(500, 3000);
            title = randomElement(['Aluguel', 'Condomínio', 'IPTU', 'Manutenção', 'Reforma']);
            break;
          case 'Saúde':
            amount = randomBetween(30, 500);
            title = randomElement(['Farmácia', 'Consulta médica', 'Exames', 'Plano de saúde', 'Academia']);
            break;
          case 'Educação':
            amount = randomBetween(50, 800);
            title = randomElement(['Curso online', 'Livros', 'Mensalidade', 'Material escolar', 'Workshop']);
            break;
          case 'Lazer':
            amount = randomBetween(20, 300);
            title = randomElement(['Cinema', 'Show', 'Jogo', 'Bar', 'Parque', 'Streaming', 'Happy hour']);
            break;
          case 'Vestuário':
            amount = randomBetween(50, 400);
            title = randomElement(['Roupa', 'Calçado', 'Acessórios', 'Moda']);
            break;
          case 'Contas':
            amount = randomBetween(80, 400);
            title = randomElement(['Luz', 'Água', 'Internet', 'Telefone', 'Gás']);
            break;
          case 'Compras':
            amount = randomBetween(30, 500);
            title = randomElement(['Amazon', 'Mercado Livre', 'Magazine Luiza', 'Shopee', 'Eletrônicos']);
            break;
          case 'Assinaturas':
            amount = randomBetween(15, 100);
            title = randomElement(['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO Max', 'iCloud']);
            break;
          case 'Pet':
            amount = randomBetween(50, 300);
            title = randomElement(['Ração', 'Veterinário', 'Petshop', 'Vacina', 'Brinquedos pet']);
            break;
          case 'Viagem':
            amount = randomBetween(200, 2000);
            title = randomElement(['Passagem', 'Hotel', 'Passeio', 'Aluguel de carro']);
            break;
          case 'Presente':
            amount = randomBetween(50, 500);
            title = randomElement(['Presente aniversário', 'Presente Natal', 'Lembrança', 'Flores']);
            break;
          default:
            amount = randomBetween(20, 200);
            title = 'Despesa diversa';
        }
      } else {
        switch (category.name) {
          case 'Salário':
            amount = randomBetween(3000, 12000);
            title = randomElement(['Salário mensal', 'Adiantamento', '13º salário', 'Férias']);
            break;
          case 'Freelance':
            amount = randomBetween(500, 5000);
            title = randomElement(['Projeto freelance', 'Consultoria', 'Trabalho extra']);
            break;
          case 'Investimentos':
            amount = randomBetween(100, 3000);
            title = randomElement(['Dividendos', 'Rendimento CDB', 'Ações', 'FIIs', 'Poupança']);
            break;
          case 'Vendas':
            amount = randomBetween(50, 2000);
            title = randomElement(['Venda online', 'Venda produto', 'Desapego']);
            break;
          case 'Aluguel':
            amount = randomBetween(800, 3000);
            title = 'Recebimento aluguel';
            break;
          case 'Bonificação':
            amount = randomBetween(500, 5000);
            title = randomElement(['Bônus', 'PLR', 'Comissão', 'Premiação']);
            break;
          case 'Reembolso':
            amount = randomBetween(50, 500);
            title = randomElement(['Reembolso empresa', 'Devolução', 'Cashback']);
            break;
          default:
            amount = randomBetween(100, 1000);
            title = 'Receita diversa';
        }
      }
      
      const transaction = transactionRepo.create({
        title,
        amount,
        type: isExpense ? TransactionType.EXPENSE : TransactionType.INCOME,
        category,
        user: savedUser,
        createdAt: randomDate(90),
      });
      await transactionRepo.save(transaction);
    }
    
    // Create goals for this user (2-4 goals)
    const numGoals = randomBetween(2, 4);
    console.log(`   🎯 Creating ${numGoals} goals...`);
    
    const goalTemplates = [
      { name: 'Fundo de Emergência', targetAmount: 10000, icon: '🏦', color: '#2ECC71' },
      { name: 'Viagem dos Sonhos', targetAmount: 8000, icon: '✈️', color: '#3498DB' },
      { name: 'Carro Novo', targetAmount: 50000, icon: '🚗', color: '#E74C3C' },
      { name: 'Curso Especialização', targetAmount: 5000, icon: '🎓', color: '#9B59B6' },
      { name: 'Notebook Novo', targetAmount: 6000, icon: '💻', color: '#1ABC9C' },
      { name: 'Entrada Apartamento', targetAmount: 80000, icon: '🏠', color: '#F39C12' },
      { name: 'Casamento', targetAmount: 30000, icon: '💒', color: '#FF6B9D' },
      { name: 'Reserva de Investimentos', targetAmount: 20000, icon: '📈', color: '#00D4AA' },
    ];
    
    const selectedGoals = [...goalTemplates].sort(() => Math.random() - 0.5).slice(0, numGoals);
    
    for (const goalData of selectedGoals) {
      const currentAmount = randomBetween(0, Math.floor(goalData.targetAmount * 0.7));
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + randomBetween(3, 18));
      
      const goal = goalRepo.create({
        name: goalData.name,
        description: `Meta para ${goalData.name.toLowerCase()}`,
        targetAmount: goalData.targetAmount,
        currentAmount,
        status: currentAmount >= goalData.targetAmount ? GoalStatus.COMPLETED : GoalStatus.ACTIVE,
        deadline,
        icon: goalData.icon,
        color: goalData.color,
        user: savedUser,
      });
      await goalRepo.save(goal);
    }
  }
  
  console.log('\n✅ Seed completed successfully!\n');
  console.log('='.repeat(50));
  console.log('📋 USERS CREATED (all with password: Senha123!)');
  console.log('='.repeat(50));
  for (const userData of usersData) {
    console.log(`   📧 ${userData.email}`);
  }
  console.log('='.repeat(50));
  
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
