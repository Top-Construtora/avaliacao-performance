import { useState, useEffect, useCallback } from 'react';
import { evaluationService } from '../services/evaluation.service';
import { usersService } from '../services/supabase.service';
import { dataCacheService } from '../services/dataCache.service';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData,
  SelfEvaluation,
  LeaderEvaluation
} from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PdiData {
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}

interface DeliveryCriterion {
  id: string;
  name: string;
  description: string;
  category: 'deliveries';
  position: number;
}

interface UseEvaluationReturn {
  loading: boolean;
  cyclesLoading: boolean;
  currentCycle: EvaluationCycle | null;
  cycles: EvaluationCycle[];
  dashboard: CycleDashboard[];
  employees: UserWithDetails[];
  subordinates: UserWithDetails[];
  nineBoxData: NineBoxData[];
  deliveriesCriteria: DeliveryCriterion[];
  loadCurrentCycle: () => Promise<void>;
  loadAllCycles: () => Promise<void>;
  loadDashboard: (cycleId: string) => Promise<void>;
  loadNineBoxData: (cycleId: string) => Promise<void>;
  loadSubordinates: () => Promise<void>;
  createCycle: (cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  openCycle: (cycleId: string) => Promise<void>;
  closeCycle: (cycleId: string) => Promise<void>;
  saveSelfEvaluation: (data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    toolkit?: {
      knowledge?: string[];
      tools?: string[];
      strengths_internal?: string[];
      qualities?: string[];
    };
  }) => Promise<void>;
  saveLeaderEvaluation: (data: {
    cycleId: string;
    employeeId: string;
    evaluatorId: string;
    competencies: EvaluationCompetency[];
    potentialScore: number;
    potentialDetails?: Record<string, { name: string; score: number }>;
    feedback?: {
      strengths_internal?: string;
      improvements?: string;
      observations?: string;
    };
    pdi?: {
      goals: string[];
      actions: string[];
      resources?: string[];
      timeline?: string;
    };
  }) => Promise<void>;
  createConsensus: (data: Partial<ConsensusMeeting>) => Promise<void>;
  completeConsensus: (meetingId: string, performanceScore: number, potentialScore: number, notes: string) => Promise<void>;
  getEmployeeEvaluations: (cycleId: string, employeeId: string) => Promise<EvaluationExtended[]>;
  getSelfEvaluations: (employeeId: string, cycleId?: string) => Promise<SelfEvaluation[]>;
  getLeaderEvaluations: (employeeId: string, cycleId?: string) => Promise<LeaderEvaluation[]>;
  checkExistingEvaluation: (cycleId: string, employeeId: string, type: 'self' | 'leader') => Promise<boolean>;
  getNineBoxByEmployeeId: (employeeId: string) => NineBoxData | undefined;
  savePDI: (pdiData: PdiData) => Promise<PdiData>;
  loadPDI: (employeeId: string) => Promise<PdiData | null>;
  reloadEmployees: () => Promise<void>;
}

export const useEvaluation = (): UseEvaluationReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<EvaluationCycle | null>(null);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [dashboard, setDashboard] = useState<CycleDashboard[]>([]);
  const [employees, setEmployees] = useState<UserWithDetails[]>([]);
  const [subordinates, setSubordinates] = useState<UserWithDetails[]>([]);
  const [nineBoxData, setNineBoxData] = useState<NineBoxData[]>([]);
  const [deliveriesCriteria, setDeliveriesCriteria] = useState<DeliveryCriterion[]>([]);

  const loadCurrentCycle = useCallback(async () => {
    try {
      setLoading(true);
      const cycle = await evaluationService.getCurrentCycle();
      setCurrentCycle(cycle);
      if (!cycle) {
        const allCycles = await evaluationService.getAllCycles();
        const activeCycle = allCycles.find(c => c.status === 'open');
        if (activeCycle) {
          setCurrentCycle(activeCycle);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ciclo atual:', error);
      toast.error('Erro ao carregar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllCycles = useCallback(async () => {
    try {
      setCyclesLoading(true);
      const data = await evaluationService.getAllCycles();
      setCycles(data || []);
    } catch (error) {
      console.error('Erro ao carregar ciclos:', error);
      setCycles([]);
      toast.error('Erro ao carregar ciclos de avaliação');
    } finally {
      setCyclesLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      const data = await evaluationService.getCycleDashboard(cycleId);
      setDashboard(data);
      if (!data || data.length === 0) {
        toast('Nenhum dado encontrado para este ciclo', { icon: 'ℹ️', duration: 3000 });
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
      setDashboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNineBoxData = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      const data = await evaluationService.getNineBoxData(cycleId);
      setNineBoxData(data);
    } catch (error) {
      console.error('Erro ao carregar dados NineBox:', error);
      toast.error('Erro ao carregar matriz 9-Box');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubordinates = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const allUsers = await usersService.getAll();
      const subs = allUsers.filter(u => u.reports_to === user.id);
      setSubordinates(subs);
    } catch (error) {
      console.error('Erro ao carregar subordinados:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCycle = useCallback(async (cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      await evaluationService.createCycle({ ...cycle, created_by: user?.id || '' });
      toast.success('Ciclo de avaliação criado com sucesso!');
      await loadAllCycles();
    } catch (error) {
      console.error('Erro ao criar ciclo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar ciclo de avaliação';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user, loadAllCycles]);

  const openCycle = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      await evaluationService.openCycle(cycleId);
      toast.success('Ciclo de avaliação aberto!');
      await loadAllCycles();
      await loadCurrentCycle();
    } catch (error) {
      console.error('Erro ao abrir ciclo:', error);
      toast.error('Erro ao abrir ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [loadAllCycles, loadCurrentCycle]);

  const closeCycle = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      await evaluationService.closeCycle(cycleId);
      toast.success('Ciclo de avaliação encerrado!');
      await loadAllCycles();
      await loadCurrentCycle();
    } catch (error) {
      console.error('Erro ao fechar ciclo:', error);
      toast.error('Erro ao fechar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [loadAllCycles, loadCurrentCycle]);

  const saveSelfEvaluation = useCallback(async (data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    toolkit?: {
      knowledge?: string[];
      tools?: string[];
      strengths_internal?: string[];
      qualities?: string[];
    };
  }) => {
    try {
      setLoading(true);
      await evaluationService.saveSelfEvaluation(
        data.cycleId,
        data.employeeId,
        data.competencies,
        data.toolkit
      );
      toast.success('Autoavaliação salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar autoavaliação:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar autoavaliação';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLeaderEvaluation = useCallback(async (data: {
    cycleId: string;
    employeeId: string;
    evaluatorId: string;
    competencies: EvaluationCompetency[];
    potentialScore: number;
    potentialDetails?: Record<string, { name: string; score: number }>;
    feedback?: {
      strengths_internal?: string;
      improvements?: string;
      observations?: string;
    };
    pdi?: {
      goals: string[];
      actions: string[];
      resources?: string[];
      timeline?: string;
    };
  }) => {
    try {
      setLoading(true);
      await evaluationService.saveLeaderEvaluation(
        data.cycleId,
        data.employeeId,
        data.evaluatorId,
        data.competencies,
        data.potentialScore,
        data.feedback,
        data.pdi,
        data.potentialDetails
      );
      toast.success('Avaliação do líder salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação do líder');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConsensus = useCallback(async (data: Partial<ConsensusMeeting>) => {
    try {
      setLoading(true);
      await evaluationService.createConsensusMeeting(data);
      toast.success('Reunião de consenso criada!');
    } catch (error) {
      console.error('Erro ao criar consenso:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar reunião de consenso';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeConsensus = useCallback(async (
    meetingId: string,
    performanceScore: number,
    potentialScore: number,
    notes: string
  ) => {
    try {
      setLoading(true);
      await evaluationService.completeConsensusMeeting(meetingId, performanceScore, potentialScore, notes);
      toast.success('Consenso finalizado com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar consenso:', error);
      toast.error('Erro ao finalizar consenso');
    } finally {
      setLoading(false);
    }
  }, []);

  const getEmployeeEvaluations = useCallback(async (cycleId: string, employeeId: string): Promise<EvaluationExtended[]> => {
    try {
      return await evaluationService.getEmployeeEvaluations(cycleId, employeeId);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }, []);

  const getSelfEvaluations = useCallback(async (employeeId: string, cycleId?: string): Promise<SelfEvaluation[]> => {
    try {
      return await evaluationService.getSelfEvaluations(employeeId, cycleId);
    } catch (error) {
      console.error('Erro ao buscar autoavaliações:', error);
      return [];
    }
  }, []);

  const getLeaderEvaluations = useCallback(async (employeeId: string, cycleId?: string): Promise<LeaderEvaluation[]> => {
    try {
      return await evaluationService.getLeaderEvaluations(employeeId, cycleId);
    } catch (error) {
      console.error('Erro ao buscar avaliações de líder:', error);
      return [];
    }
  }, []);

  const checkExistingEvaluation = useCallback(async (
    cycleId: string,
    employeeId: string,
    type: 'self' | 'leader'
  ): Promise<boolean> => {
    try {
      return await evaluationService.checkExistingEvaluation(cycleId, employeeId, type);
    } catch (error) {
      console.error('Erro ao verificar avaliação existente:', error);
      return false;
    }
  }, []);

  const getNineBoxByEmployeeId = (employeeId: string) => {
    return nineBoxData.find((item) => item.employee_id === employeeId);
  };

  const savePDI = async (pdiData: PdiData): Promise<PdiData> => {
    try {
      setLoading(true);
      const allItems = [
        ...pdiData.curtosPrazos.map(i => ({ ...i, prazo: 'curto' })),
        ...pdiData.mediosPrazos.map(i => ({ ...i, prazo: 'medio' })),
        ...pdiData.longosPrazos.map(i => ({ ...i, prazo: 'longo' })),
      ];
      const result = await evaluationService.savePDI({
        employeeId: pdiData.colaboradorId,
        goals: allItems.map(i => `Competência: ${i.competencia}. Resultados Esperados: ${i.resultadosEsperados}`),
        actions: allItems.map(i => `Como desenvolver: ${i.comoDesenvolver} (Prazo: ${i.calendarizacao}, Status: ${i.status}, Observação: ${i.observacao})`),
        timeline: pdiData.periodo,
        items: allItems,
      });
      toast.success('PDI salvo com sucesso!');
      return result;
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar PDI';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadPDI = useCallback(async (employeeId: string): Promise<PdiData | null> => {
    try {
      setLoading(true);
      const pdiDataFromApi = await evaluationService.getPDI(employeeId);

      if (pdiDataFromApi) {
        const curtosPrazos: ActionItem[] = [];
        const mediosPrazos: ActionItem[] = [];
        const longosPrazos: ActionItem[] = [];

        if (pdiDataFromApi.items && Array.isArray(pdiDataFromApi.items)) {
          pdiDataFromApi.items.forEach((item: ActionItem & { prazo?: string }) => {
            const actionItem: ActionItem = {
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              competencia: item.competencia || '',
              calendarizacao: item.calendarizacao || '',
              comoDesenvolver: item.comoDesenvolver || '',
              resultadosEsperados: item.resultadosEsperados || '',
              status: item.status || '1',
              observacao: item.observacao || ''
            };
            switch (item.prazo) {
              case 'curto': curtosPrazos.push(actionItem); break;
              case 'medio': mediosPrazos.push(actionItem); break;
              case 'longo': longosPrazos.push(actionItem); break;
              default: curtosPrazos.push(actionItem);
            }
          });
        } else if (pdiDataFromApi.goals && Array.isArray(pdiDataFromApi.goals)) {
          (pdiDataFromApi.goals as string[]).forEach((goal: string, index: number) => {
            const action = (pdiDataFromApi.actions as string[])?.[index] || '';
            const competenciaMatch = goal.match(/Competência: (.+?)\. Resultados Esperados: (.+)/);
            const competencia = competenciaMatch?.[1] || goal.split('.')[0] || 'N/A';
            const resultadosEsperados = competenciaMatch?.[2] || goal.split('.')[1] || 'N/A';
            let actionMatch = action.match(/Como desenvolver: (.+?) \(Prazo: (.+?), Status: (.+?), Observação: (.+?)\)\./);
            if (!actionMatch) {
              actionMatch = action.match(/Como desenvolver: (.+?) \(Prazo: (.+?), Status: (.+?), Observação: (.+?)\)/);
            }
            const comoDesenvolver = actionMatch?.[1] || action.replace(/Como desenvolver: /, '').split('(')[0].trim() || 'N/A';
            const calendarizacao = actionMatch?.[2] || 'N/A';
            const status = (actionMatch?.[3] || '1') as '1' | '2' | '3' | '4' | '5';
            const observacao = actionMatch?.[4] || 'N/A';
            const actionItem: ActionItem = {
              id: `item-${index}-${Date.now()}`,
              competencia,
              calendarizacao,
              comoDesenvolver,
              resultadosEsperados,
              status,
              observacao,
            };
            const total = (pdiDataFromApi.goals as string[]).length;
            if (index < total / 3) curtosPrazos.push(actionItem);
            else if (index < (total * 2) / 3) mediosPrazos.push(actionItem);
            else longosPrazos.push(actionItem);
          });
        }

        return {
          id: pdiDataFromApi.id,
          colaboradorId: pdiDataFromApi.employee_id,
          colaborador: '',
          cargo: '',
          departamento: '',
          periodo: pdiDataFromApi.timeline || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          curtosPrazos,
          mediosPrazos,
          longosPrazos,
          dataCriacao: pdiDataFromApi.created_at,
          dataAtualizacao: pdiDataFromApi.updated_at,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar PDI';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadEmployees = useCallback(async () => {
    try {
      dataCacheService.invalidate();
      const data = await usersService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao recarregar colaboradores:', error);
    }
  }, []);

  const loadOrganizationalCompetencies = useCallback(async () => {
    try {
      const { data: orgCompetencies } = await supabase
        .from('organizational_competencies')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (orgCompetencies && orgCompetencies.length > 0) {
        const mappedDeliveries: DeliveryCriterion[] = orgCompetencies.map((comp) => ({
          id: comp.id as string,
          name: comp.name as string,
          description: comp.description as string,
          category: 'deliveries' as const,
          position: comp.position as number
        }));
        setDeliveriesCriteria(mappedDeliveries);
      } else {
        setDeliveriesCriteria([]);
      }
    } catch (error) {
      console.error('Erro ao carregar competências organizacionais:', error);
      setDeliveriesCriteria([]);
    }
  }, []);

  useEffect(() => {
    loadCurrentCycle();
    loadOrganizationalCompetencies();

    const loadEmployees = async () => {
      try {
        const data = await usersService.getAll();
        setEmployees(data);
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
      }
    };

    loadEmployees();
  }, [loadCurrentCycle, loadOrganizationalCompetencies]);

  return {
    loading,
    cyclesLoading,
    currentCycle,
    cycles,
    dashboard,
    employees,
    subordinates,
    nineBoxData,
    deliveriesCriteria,
    loadCurrentCycle,
    loadAllCycles,
    loadDashboard,
    loadNineBoxData,
    loadSubordinates,
    createCycle,
    openCycle,
    closeCycle,
    saveSelfEvaluation,
    saveLeaderEvaluation,
    createConsensus,
    completeConsensus,
    getEmployeeEvaluations,
    getSelfEvaluations,
    getLeaderEvaluations,
    checkExistingEvaluation,
    getNineBoxByEmployeeId,
    savePDI,
    loadPDI,
    reloadEmployees,
  };
};
