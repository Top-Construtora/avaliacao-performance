import { Request, Response, NextFunction } from 'express';
import { pdiService } from '../services/pdiService';
import { AuthRequest } from '../middleware/auth';
import { PDIUtils } from '../utils/pdiUtils';
import { exportService } from '../services/exportService';

export const pdiController = {
  // Salvar PDI
  async savePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId, cycleId, leaderEvaluationId, periodo } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Campo obrigatório: employeeId'
        });
      }

      // Processar os dados do PDI vindos do frontend
      let processedItems;
      if (req.body.items && Array.isArray(req.body.items)) {
        processedItems = req.body.items;
      } else {
        processedItems = PDIUtils.processPDIData(req.body);
      }

      if (!processedItems || processedItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'O PDI deve conter pelo menos um item'
        });
      }

      // Validar items usando o método do service
      if (!pdiService.validatePDIItems(processedItems)) {
        return res.status(400).json({
          success: false,
          error: 'Estrutura dos itens do PDI inválida'
        });
      }

      const pdi = await pdiService.savePDI(authReq.supabase, {
        employeeId,
        items: processedItems,
        cycleId,
        leaderEvaluationId,
        periodo,
        status: 'active',
        createdBy: authReq.user?.id
      });

      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      next(error);
    }
  },

  // Buscar PDI
  async getPDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;

      const pdi = await pdiService.getPDI(authReq.supabase, employeeId);

      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Erro ao buscar PDI:', error);
      next(error);
    }
  },

  // Buscar todos os PDIs ativos (para calendário)
  async getAllPDIs(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const { data, error } = await authReq.supabase
        .from('development_plans')
        .select(`
          id,
          employee_id,
          status,
          items,
          periodo,
          timeline,
          created_at,
          updated_at,
          employee:users!development_plans_employee_id_fkey(id, name, email, position, department_id)
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      res.json({ success: true, data: data || [] });
    } catch (error) {
      console.error('Erro ao buscar todos os PDIs:', error);
      next(error);
    }
  },

  // Buscar PDIs por ciclo
  async getPDIsByCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;

      const pdis = await pdiService.getPDIsByCycle(authReq.supabase, cycleId);

      res.json({
        success: true,
        data: pdis
      });
    } catch (error) {
      console.error('Erro ao buscar PDIs por ciclo:', error);
      next(error);
    }
  },

  // Exportar PDI individual em PDF
  async exportPDIToPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;

      // Permissao: o proprio colaborador, lideres, diretores e admins
      const user = authReq.user;
      const isSelf = user?.id === employeeId;
      const isPrivileged = !!(user?.is_admin || user?.is_director || user?.is_leader);

      if (!isSelf && !isPrivileged) {
        return res.status(403).json({
          success: false,
          error: 'Voce nao tem permissao para exportar este PDI'
        });
      }

      const { buffer, employeeName } = await exportService.exportPDIToPDF(authReq.supabase, employeeId);
      const safeName = (employeeName || 'colaborador').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `pdi_${safeName}_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error: any) {
      console.error('[PDI PDF Export] Erro ao exportar:', error);
      if (error?.message === 'PDI nao encontrado para este colaborador') {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // Exportar todos os PDIs em um unico PDF (admin/diretor)
  async exportAllPDIsToPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const buffer = await exportService.exportAllPDIsToPDF(authReq.supabase);
      const fileName = `pdis_consolidado_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error: any) {
      console.error('[PDI PDF Export Bulk] Erro ao exportar:', error);
      if (error?.message === 'Nenhum PDI ativo encontrado') {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // Exportar PDI individual em DOCX
  async exportPDIToDocx(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;

      const user = authReq.user;
      const isSelf = user?.id === employeeId;
      const isPrivileged = !!(user?.is_admin || user?.is_director || user?.is_leader);

      if (!isSelf && !isPrivileged) {
        return res.status(403).json({
          success: false,
          error: 'Voce nao tem permissao para exportar este PDI'
        });
      }

      const { buffer, employeeName } = await exportService.exportPDIToDocx(authReq.supabase, employeeId);
      const safeName = (employeeName || 'colaborador').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `pdi_${safeName}_${Date.now()}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error: any) {
      console.error('[PDI DOCX Export] Erro ao exportar:', error);
      if (error?.message === 'PDI nao encontrado para este colaborador') {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // Exportar todos os PDIs em DOCX (admin/diretor)
  async exportAllPDIsToDocx(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const buffer = await exportService.exportAllPDIsToDocx(authReq.supabase);
      const fileName = `pdis_consolidado_${Date.now()}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error: any) {
      console.error('[PDI DOCX Export Bulk] Erro ao exportar:', error);
      if (error?.message === 'Nenhum PDI ativo encontrado') {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
};
