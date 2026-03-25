// src/services/dataCache.service.ts
// Cache centralizado para evitar chamadas duplicadas às APIs

import { departmentsService, usersService, teamsService } from './supabase.service';
import type { DepartmentWithDetails, UserWithDetails, TeamWithDetails } from '../types/supabase';

interface CacheData {
  users: UserWithDetails[] | null;
  teams: TeamWithDetails[] | null;
  departments: DepartmentWithDetails[] | null;
  timestamp: number;
}

// Cache com TTL de 30 segundos
const CACHE_TTL = 30000;

let cache: CacheData = {
  users: null,
  teams: null,
  departments: null,
  timestamp: 0,
};

// Promessa em andamento para evitar chamadas duplicadas simultâneas
let loadingPromise: Promise<CacheData> | null = null;

function isCacheValid(): boolean {
  return Date.now() - cache.timestamp < CACHE_TTL &&
         cache.users !== null &&
         cache.teams !== null &&
         cache.departments !== null;
}

async function loadAllData(): Promise<CacheData> {
  // Se cache ainda é válido, retorna imediatamente
  if (isCacheValid()) {
    return cache;
  }

  // Se já está carregando, aguarda a promessa existente
  if (loadingPromise) {
    return loadingPromise;
  }

  // Criar nova promessa de carregamento
  loadingPromise = (async () => {
    try {
      console.log('🔄 Cache: Carregando todos os dados...');

      const [users, teams, departments] = await Promise.all([
        usersService.getAll(),
        teamsService.getAll(),
        departmentsService.getAll(),
      ]);

      cache = {
        users: users || [],
        teams: teams || [],
        departments: departments || [],
        timestamp: Date.now(),
      };

      console.log('✅ Cache: Dados carregados com sucesso');
      return cache;
    } catch (error) {
      console.error('❌ Cache: Erro ao carregar dados:', error);
      throw error;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export const dataCacheService = {
  // Carregar todos os dados (com cache)
  async loadAll(): Promise<void> {
    await loadAllData();
  },

  // Obter usuários do cache
  async getUsers(): Promise<UserWithDetails[]> {
    const data = await loadAllData();
    return data.users || [];
  },

  // Obter times do cache
  async getTeams(): Promise<TeamWithDetails[]> {
    const data = await loadAllData();
    return data.teams || [];
  },

  // Obter departamentos do cache
  async getDepartments(): Promise<DepartmentWithDetails[]> {
    const data = await loadAllData();
    return data.departments || [];
  },

  // Obter todos os dados de uma vez (mais eficiente)
  async getAll(): Promise<{
    users: UserWithDetails[];
    teams: TeamWithDetails[];
    departments: DepartmentWithDetails[];
  }> {
    const data = await loadAllData();
    return {
      users: data.users || [],
      teams: data.teams || [],
      departments: data.departments || [],
    };
  },

  // Invalidar cache (após criar/atualizar/deletar)
  invalidate(): void {
    console.log('🗑️ Cache: Invalidado');
    cache = {
      users: null,
      teams: null,
      departments: null,
      timestamp: 0,
    };
    loadingPromise = null;
  },

  // Forçar recarga
  async reload(): Promise<void> {
    this.invalidate();
    await loadAllData();
  },

  // Verificar se cache é válido
  isValid(): boolean {
    return isCacheValid();
  },
};
