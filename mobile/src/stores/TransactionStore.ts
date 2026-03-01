import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../services/api";

interface CreateTransactionDto {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId?: string;
}

export class TransactionStore {
  transactions: any[] = [];
  total: number = 0;
  page: number = 1;
  lastPage: number = 1;
  loading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchTransactions(page: number = 1, limit: number = 10) {
    this.loading = true;
    try {
      const res = await api.get(`/transactions?page=${page}&limit=${limit}`);
      runInAction(() => {
        this.transactions = res.data.data;
        this.total = res.data.total;
        this.page = res.data.page;
        this.lastPage = res.data.lastPage;
        this.loading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.loading = false;
      });
      console.error("Error fetching transactions:", err);
    }
  }

  async createTransaction(data: CreateTransactionDto) {
    try {
      await api.post('/transactions', data);
      await this.fetchTransactions();
    } catch (err) {
      console.error("Error creating transaction:", err);
    }
  }

  async deleteTransaction(id: string) {
    try {
      await api.delete(`/transactions/${id}`);
      runInAction(() => {
        this.transactions = this.transactions.filter(t => t.id !== id);
      });
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  }
}

export const transactionStore = new TransactionStore();