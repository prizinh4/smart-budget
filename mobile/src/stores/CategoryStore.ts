import { makeAutoObservable, runInAction } from "mobx";
import { api, Category, CreateCategoryDto } from '../services/api';

class CategoryStore {
  categories: Category[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchCategories(type?: 'income' | 'expense') {
    this.loading = true;
    this.error = null;
    try {
      const params = type ? { type } : {};
      const res = await api.get<Category[]>('/categories', { params });
      runInAction(() => {
        this.categories = res.data;
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to load categories';
        this.loading = false;
      });
    }
  }

  async createCategory(data: CreateCategoryDto): Promise<Category | null> {
    this.loading = true;
    this.error = null;
    try {
      const res = await api.post<Category>('/categories', data);
      runInAction(() => {
        this.categories.push(res.data);
        this.loading = false;
      });
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to create category';
        this.loading = false;
      });
      return null;
    }
  }

  async updateCategory(id: string, data: Partial<CreateCategoryDto>): Promise<Category | null> {
    this.loading = true;
    try {
      const res = await api.put<Category>(`/categories/${id}`, data);
      runInAction(() => {
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
          this.categories[index] = res.data;
        }
        this.loading = false;
      });
      return res.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to update category';
        this.loading = false;
      });
      return null;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    this.loading = true;
    try {
      await api.delete(`/categories/${id}`);
      runInAction(() => {
        this.categories = this.categories.filter(c => c.id !== id);
        this.loading = false;
      });
      return true;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.message || 'Failed to delete category';
        this.loading = false;
      });
      return false;
    }
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  get incomeCategories(): Category[] {
    return this.categories.filter(c => c.type === 'income');
  }

  get expenseCategories(): Category[] {
    return this.categories.filter(c => c.type === 'expense');
  }
}

export const categoryStore = new CategoryStore();
