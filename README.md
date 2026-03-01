# 💰 SmartBudget

Aplicativo de controle financeiro pessoal com backend escalável e app mobile.

## 🏗️ Arquitetura

```
smart-budget/
├── backend/          # NestJS API
├── mobile/           # React Native (Expo)
└── infra/            # AWS CDK Infrastructure
```

## ✨ Features

### Backend
- **Auth**: JWT + Refresh Tokens com rotação automática
- **Dashboard**: Dados agregados com cache Redis (TTL 5min)
- **Transactions**: CRUD completo com paginação
- **Categories**: Organização de gastos por categoria
- **Goals**: Metas financeiras com acompanhamento
- **Rate Limiting**: 3/seg, 20/10seg, 100/min
- **Health Checks**: `/health` com status de DB, Memory, Disk
- **Swagger**: Documentação em `/api/docs`

### Mobile
- Telas de Login/Registro estilizadas
- Dashboard moderno com pull-to-refresh
- Navegação por tabs (Início, Transações, Categorias, Metas)
- CRUD de transações com seleção de categoria
- Persistência de sessão (AsyncStorage)
- Suporte a tema claro

### Infraestrutura (AWS CDK)
- VPC com 3 tiers (public, private, isolated)
- ECS Fargate com auto-scaling (2-10 réplicas)
- Application Load Balancer
- RDS PostgreSQL 15
- ElastiCache Redis
- Secrets Manager

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure suas variáveis
npm run start:dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Infraestrutura
```bash
cd infra
npm install
npm run deploy:dev
```

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=smartbudget
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION_DAYS=7
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/register` | Cadastro |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Renovar tokens |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/dashboard` | Dados agregados |
| GET | `/api/v1/transactions` | Listar (paginado) |
| POST | `/api/v1/transactions` | Criar |
| GET | `/api/v1/transactions/:id` | Buscar por ID |
| PUT | `/api/v1/transactions/:id` | Atualizar |
| DELETE | `/api/v1/transactions/:id` | Remover |
| GET | `/api/v1/categories` | Listar categorias |
| POST | `/api/v1/categories` | Criar |
| PUT | `/api/v1/categories/:id` | Atualizar |
| DELETE | `/api/v1/categories/:id` | Remover |
| GET | `/api/v1/goals` | Listar metas |
| POST | `/api/v1/goals` | Criar |
| PUT | `/api/v1/goals/:id` | Atualizar |
| POST | `/api/v1/goals/:id/contribute` | Contribuir |
| DELETE | `/api/v1/goals/:id` | Remover |

## 🧪 Testes

```bash
cd backend
npm test          # 75 testes unitários
npm run test:cov  # Com cobertura
```

## 🐳 Docker

```bash
cd backend
docker build -t smart-budget-api .
docker run -p 3000:3000 smart-budget-api
```

## 📱 Mobile (Expo)

Para testar no dispositivo físico:
1. Configure seu IP em `mobile/src/services/env.local.ts`
2. Execute `npx expo start`
3. Escaneie o QR code com Expo Go

## 🛠️ Tech Stack

**Backend**
- NestJS v11
- TypeORM + PostgreSQL
- cache-manager + Redis
- Passport JWT
- Swagger/OpenAPI
- Jest

**Mobile**
- React Native (Expo)
- MobX State Management
- React Navigation
- Axios
- AsyncStorage

**Infra**
- AWS CDK
- ECS Fargate
- ALB
- RDS PostgreSQL
- ElastiCache Redis

## 📄 Licença

MIT