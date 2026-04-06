import { api } from '../config/api';

export const teamService = {
  async getAll(): Promise<any[]> {
    try {
      const response = await api.get('/teams');
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return [];
    }
  },

  async getById(id: string): Promise<any | null> {
    try {
      const response = await api.get(`/teams/${id}`);
      return response.data || response || null;
    } catch (error) {
      console.error('Erro ao buscar time:', error);
      return null;
    }
  },

  async create(team: any): Promise<any> {
    const response = await api.post('/teams', team);
    return response.data || response;
  },

  async update(id: string, team: any): Promise<any> {
    const response = await api.put(`/teams/${id}`, team);
    return response.data || response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  async getMembers(teamId: string): Promise<any[]> {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar membros do time:', error);
      return [];
    }
  },

  async addMember(teamId: string, userId: string): Promise<void> {
    await api.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },

  async replaceMembers(teamId: string, userIds: string[]): Promise<void> {
    await api.put(`/teams/${teamId}/members`, { user_ids: userIds });
  },

  async getUserTeams(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/teams/user/${userId}`);
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar times do usuário:', error);
      return [];
    }
  },

  async getAllMembers(): Promise<{ team_id: string; user: any }[]> {
    try {
      const response = await api.get('/teams/members/all');
      if (response && response.success) {
        return response.data || [];
      }
      return response.data || response || [];
    } catch (error) {
      console.error('Erro ao buscar todos os membros:', error);
      return [];
    }
  }
};
