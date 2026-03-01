import { makeAutoObservable, runInAction } from "mobx";
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthStore {
  user: any = null;
  token: string | null = null;
  refreshToken: string | null = null;
  loading = false;
  error: string | null = null;
  initialized = false;

  constructor() {
    makeAutoObservable(this);
    this.loadStoredSession();
  }

  async loadStoredSession() {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        runInAction(() => {
          this.token = storedToken;
          this.refreshToken = storedRefreshToken;
          this.user = JSON.parse(storedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        });
      }
    } catch (err) {
      console.error('Error loading stored session:', err);
    } finally {
      runInAction(() => {
        this.initialized = true;
      });
    }
  }

  async login(email: string, password: string) {
    this.loading = true;
    this.error = null;
    try {
      const res = await api.post("/auth/login", { email, password });

      runInAction(() => {
        this.user = {
          id: res.data.id,
          email: res.data.email,
        };
        this.token = res.data.access_token;
        this.refreshToken = res.data.refresh_token;
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
        this.loading = false;
      });

      // Persistir sessão
      await AsyncStorage.setItem('token', res.data.access_token);
      await AsyncStorage.setItem('refreshToken', res.data.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(this.user));
    } catch (err: any) {
      runInAction(() => {
        this.loading = false;
        this.error = err.response?.data?.message || 'Email ou senha inválidos';
      });
      console.error(err);
    }
  }

  async register(email: string, password: string) {
    this.loading = true;
    this.error = null;
    try {
      await api.post('/auth/register', { email, password });
      runInAction(() => {
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.loading = false;
        this.error = err.response?.data?.message || 'Erro ao criar conta';
      });
    }
  }

  async logout() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.error = null;
    api.defaults.headers.common['Authorization'] = '';
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
  }
}

export const authStore = new AuthStore();