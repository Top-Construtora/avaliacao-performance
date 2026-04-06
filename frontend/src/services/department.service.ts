import { api } from '../config/api';

export const departmentService = {
  async getAll(): Promise<any[]> {
    try {
      const response = await api.get('/departments');
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      return [];
    }
  },

  async getById(id: string): Promise<any | null> {
    try {
      const response = await api.get(`/departments/${id}`);
      return response.data || response || null;
    } catch (error) {
      console.error('Erro ao buscar departamento:', error);
      return null;
    }
  },

  async create(department: any): Promise<any> {
    const response = await api.post('/departments', department);
    return response.data || response;
  },

  async update(id: string, department: any): Promise<any> {
    const response = await api.put(`/departments/${id}`, department);
    return response.data || response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
};
