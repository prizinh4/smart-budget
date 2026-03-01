import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let API_URL = 'http://localhost:3000/api/v1'; 

if (Platform.OS !== 'web') {
  const debuggerHost = Constants.manifest?.debuggerHost?.split(':')[0];
  if (debuggerHost) {
    API_URL = `http://${debuggerHost}:3000/api/v1`;
  }
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