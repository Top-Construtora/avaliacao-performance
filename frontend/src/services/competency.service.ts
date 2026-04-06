import { api } from '../config/api';

export interface OrganizationalCompetency {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export const competencyService = {
  async getOrganizationalCompetencies(): Promise<OrganizationalCompetency[]> {
    try {
      const response = await api.get('/competencies/organizational');
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar competências organizacionais:', error);
      return [];
    }
  },

  async getOrganizationalCompetencyById(id: string): Promise<OrganizationalCompetency | null> {
    try {
      const response = await api.get(`/competencies/organizational/${id}`);
      return response.data || response || null;
    } catch (error) {
      console.error('Erro ao buscar competência:', error);
      return null;
    }
  },

  async createOrganizationalCompetency(data: Omit<OrganizationalCompetency, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizationalCompetency> {
    const response = await api.post('/competencies/organizational', data);
    return response.data || response;
  },

  async updateOrganizationalCompetency(id: string, data: Partial<OrganizationalCompetency>): Promise<OrganizationalCompetency> {
    const response = await api.put(`/competencies/organizational/${id}`, data);
    return response.data || response;
  },

  async deleteOrganizationalCompetency(id: string): Promise<void> {
    await api.delete(`/competencies/organizational/${id}`);
  },
};
