import { makeAutoObservable, runInAction} from "mobx";
import { api, Goal, CreateGoalDto, GoalProgress } from '../services/api';
import { dashboardStore } from './DashboardStore';

export interface Contribution {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
}

class GoalStore {
  goals: Goal[] = [];
  contributions: Map<string, Contribution[]> = new Map();
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchGoals(status?: 'active' | 'completed' | 'cancelled') {
    this.loading = true;
    this.error = null;
    try {
      const params = status ? { status } : {};
      const res = await api.get<Goal[]>('/goals', { params });
      runInAction(() => {
        this.goals = res.data;
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to load goals';
        this.loading = false;
      });
    }
  }

  async createGoal(data: CreateGoalDto): Promise<Goal | null> {
    this.loading = true;
    this.error = null;
    try {
      const res = await api.post<Goal>('/goals', data);
      runInAction(() => {
        this.goals.push(res.data);
        this.loading = false;
      });
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to create goal';
        this.loading = false;
      });
      return null;
    }
  }

  async updateGoal(id: string, data: Partial<CreateGoalDto & { status?: string }>): Promise<Goal | null> {
    this.loading = true;
    try {
      const res = await api.put<Goal>(`/goals/${id}`, data);
      runInAction(() => {
        const index = this.goals.findIndex(g => g.id === id);
        if (index !== -1) {
          this.goals[index] = res.data;
        }
        this.loading = false;
      });
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to update goal';
        this.loading = false;
      });
      return null;
    }
  }

  async addContribution(id: string, amount: number, description?: string): Promise<Goal | null> {
    this.loading = true;
    try {
      const payload: { amount: number; description?: string } = { amount };
      if (description) payload.description = description;
      const res = await api.post<Goal>(`/goals/${id}/contribute`, payload);
      runInAction(() => {
        const index = this.goals.findIndex(g => g.id === id);
        if (index !== -1) {
          this.goals[index] = res.data;
        }
        this.loading = false;
      });
      // Refresh dashboard since contribution creates an expense transaction
      dashboardStore.fetchDashboard();
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to add contribution';
        this.loading = false;
      });
      return null;
    }
  }

  async getProgress(id: string): Promise<GoalProgress | null> {
    try {
      const res = await api.get<GoalProgress>(`/goals/${id}/progress`);
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to get progress';
      });
      return null;
    }
  }

  async getContributions(goalId: string): Promise<Contribution[]> {
    try {
      const res = await api.get<Contribution[]>(`/goals/${goalId}/contributions`);
      runInAction(() => {
        this.contributions.set(goalId, res.data);
      });
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to load contributions';
      });
      return [];
    }
  }

  async syncExistingAmount(goalId: string): Promise<boolean> {
    this.loading = true;
    try {
      await api.post<Goal>(`/goals/${goalId}/sync`);
      // Refresh contributions after sync
      const contribs = await this.getContributions(goalId);
      runInAction(() => {
        this.contributions.set(goalId, contribs);
        this.loading = false;
      });
      // Refresh dashboard since we created an expense
      dashboardStore.fetchDashboard();
      return true;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to sync goal';
        this.loading = false;
      });
      return false;
    }
  }

  async removeContribution(goalId: string, transactionId: string): Promise<Goal | null> {
    this.loading = true;
    try {
      const res = await api.delete<Goal>(`/goals/${goalId}/contributions/${transactionId}`);
      runInAction(() => {
        // Update goal in list
        const index = this.goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
          this.goals[index] = res.data;
        }
        // Remove from contributions cache
        const contribs = this.contributions.get(goalId);
        if (contribs) {
          this.contributions.set(goalId, contribs.filter(c => c.id !== transactionId));
        }
        this.loading = false;
      });
      // Refresh dashboard since transaction was deleted
      dashboardStore.fetchDashboard();
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to remove contribution';
        this.loading = false;
      });
      return null;
    }
  }

  async deleteGoal(id: string): Promise<boolean> {
    this.loading = true;
    try {
      await api.delete(`/goals/${id}`);
      runInAction(() => {
        this.goals = this.goals.filter(g => g.id !== id);
        this.loading = false;
      });
      return true;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to delete goal';
        this.loading = false;
      });
      return false;
    }
  }

  getGoalById(id: string): Goal | undefined {
    return this.goals.find(g => g.id === id);
  }

  get activeGoals(): Goal[] {
    return this.goals.filter(g => g.status === 'active');
  }

  get completedGoals(): Goal[] {
    return this.goals.filter(g => g.status === 'completed');
  }

  get totalProgress(): number {
    const active = this.activeGoals;
    if (active.length === 0) return 0;
    const totalTarget = active.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalCurrent = active.reduce((sum, g) => sum + Number(g.currentAmount), 0);
    return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
  }
}

export const goalStore = new GoalStore();
