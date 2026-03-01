import { makeAutoObservable } from 'mobx';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthStore {
  user: any = null;
  token: string | null = null;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async login(email: string, password: string) {
    this.loading = true;
    try {
      const response = await api.post('/auth/login', { email, password });
      this.token = response.data.access_token;
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      if (this.token) {
        await AsyncStorage.setItem('token', this.token);
      }
    } finally {
      this.loading = false;
    }
  }

  async register(email: string, password: string) {
    this.loading = true;
    try {
      await api.post('/auth/register', { email, password });
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    this.user = null;
    this.token = null;
    api.defaults.headers.common['Authorization'] = '';
    await AsyncStorage.removeItem('token');
  }
}

export const authStore = new AuthStore();