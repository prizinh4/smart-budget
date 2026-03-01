import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../services/api";

export class DashboardStore {
  totalIncome: number = 0;
  totalExpenses: number = 0;
  categoriesRanking: any[] = [];
  loading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchDashboard(userId: string) {
    this.loading = true;
    try {
      const res = await api.get(`/dashboard?userId=${userId}`);
      runInAction(() => {
        this.totalIncome = res.data.totalIncome;
        this.totalExpenses = res.data.totalExpenses;
        this.categoriesRanking = res.data.categoriesRanking;
        this.loading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.loading = false;
      });
      console.error("Error fetching dashboard:", err);
    }
  }
}

export const dashboardStore = new DashboardStore();