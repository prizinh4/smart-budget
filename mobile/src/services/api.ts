import axios from 'axios';
import { Platform } from 'react-native';

// Importa IP local (arquivo ignorado pelo git)
let localIp = 'localhost';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const envLocal = require('../config/env.local');
  localIp = envLocal.LOCAL_IP;
} catch {
  console.warn('env.local.ts not found, using localhost. Copy env.example.ts to env.local.ts and set your IP.');
}

let API_URL = 'http://localhost:3000/api/v1'; 

if (Platform.OS !== 'web') {
  API_URL = `http://${localIp}:3000/api/v1`;
}

export const api = axios.create({
  baseURL: API_URL,
});

// Category types
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

// Goal types
export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  deadline?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface GoalProgress {
  percentage: number;
  remaining: number;
}