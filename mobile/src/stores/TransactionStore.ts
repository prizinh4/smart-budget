import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../services/api';
import { authStore } from './AuthStore';

export class TransactionStore {
  transactions: any[] = [];
  page = 1;
  lastPage = 1;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchTransactions(page = 1, limit = 10) {
    if (!authStore.token) return;
    this.loading = true;
    try {
      const response = await api.get('/transactions', { params: { page, limit } });
      runInAction(() => {
        this.transactions = response.data.data;
        this.page = response.data.page;
        this.lastPage = response.data.lastPage;
      });
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async nextPage() {
    if (this.page < this.lastPage) {
      await this.fetchTransactions(this.page + 1);
    }
  }

  async prevPage() {
    if (this.page > 1) {
      await this.fetchTransactions(this.page - 1);
    }
  }
}

export const transactionStore = new TransactionStore();