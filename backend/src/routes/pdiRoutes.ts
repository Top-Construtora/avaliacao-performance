import { Router } from 'express';
import { pdiController } from '../controllers/pdiController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Rotas do PDI
router.post('/', pdiController.savePDI);
router.get('/all', pdiController.getAllPDIs);
router.get('/cycle/:cycleId', pdiController.getPDIsByCycle);
// Exportacao consolidada de todos os PDIs (admin/diretor)
router.get('/export/all/pdf', authorizeRoles(['director']) as any, pdiController.exportAllPDIsToPDF);
router.get('/export/all/docx', authorizeRoles(['director']) as any, pdiController.exportAllPDIsToDocx);
// Exportacao do PDI de um colaborador (permissao verificada no controller)
router.get('/:employeeId/export/pdf', pdiController.exportPDIToPDF);
router.get('/:employeeId/export/docx', pdiController.exportPDIToDocx);
router.get('/:employeeId', pdiController.getPDI);

export default router;