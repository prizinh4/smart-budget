import { makeAutoObservable, runInAction } from "mobx";
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
      const res = await api.post("/auth/login", { email, password });

      console.log("LOGIN RESPONSE FULL:", JSON.stringify(res.data, null, 2));

      runInAction(() => {
        this.user = {
          id: res.data.id,
          email: res.data.email,
        };
        this.token = res.data.access_token;
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
        this.loading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.loading = false;
      });
      console.error(err);
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