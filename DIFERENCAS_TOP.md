# Diferenças entre `avaliacao-performance` e `avaliacao-performance-top`

> Comparação completa entre o sistema atual (`avaliacao-performance`) e o sistema de referência (`avaliacao-performance-top`).
> Formato: `<` = atual | `>` = top (referência mais avançada)

---

## 2. BACKEND

### `backend/src/routes/index.ts`
Novas rotas registradas na versão `top`:
```
/teams          → teamRoutes
/competencies   → competencyRoutes
/interviews     → interviewRoutes
/satisfaction   → satisfactionRoutes
/recruitment    → recruitmentRoutes
```

### `backend/src/middleware/auth.ts`
- Versão `top` é substancialmente maior (134 linhas vs 99). Inclui lógica adicional de autenticação.

### `backend/src/middleware/errorHandler.ts`
- O handler agora loga **todos** os erros (não apenas 500+) com `console.error` e inclui `stack`, `path`, `method`.
- Parâmetro `_next` renomeado para `next`.
- Inclui `details: err` no response em desenvolvimento.

### `backend/src/controllers/authController.ts`
- Removidas validações extras no login (regex de email, validação de comprimento de senha).
- Removida a normalização `email.toLowerCase().trim()` antes de passar para o service.
- `error: unknown` → `error: any` com `console.error('Login error:', error)`.

### `backend/src/controllers/evaluationController.ts`
- **Novos endpoints**: `getSelfEvaluationById` e `getLeaderEvaluationById` (busca avaliação por ID específico).
- `getCycleDashboard` agora recebe `authReq.user?.email` como parâmetro adicional para filtragem.
- Removidos logs de debug (`console.log('📥 Controller...')`).

### `backend/src/services/authService.ts`
- Todos os métodos agora têm `try/catch` com `console.error` genérico.
- `error: unknown` → `error: any` em todos os lugares.
- Log prefixos `[authService]` removidos, substituídos por mensagens mais descritivas.
- `updateProfile` agora também usa `try/catch`.

### `backend/src/services/evaluationService.ts`
- `SupabaseClient` tipado como `any` em todos os métodos (antes usava `SupabaseClient` importado).
- Todos os métodos agora têm `try/catch` wrapping.
- `getCycleDashboard` recebe `currentUserEmail?: string` como parâmetro extra para filtragem de usuários restritos.
- Importa `filterRestrictedUsers`, `filterRestrictedEmployeeRelations`, etc. de `userFilterUtils`.

### `backend/src/services/userService.ts`
- Versão `top` é bem maior (571 linhas vs 400). Inclui métodos adicionais.
- Método `getUsers` expandido com lógica de filtros mais robusta.

### `backend/src/services/pdiService.ts`
- Versão `top` é maior (158 linhas vs 133). Lógica de PDI expandida.

### `backend/src/services/salaryService.ts`
- Versão `top` é ligeiramente maior (1048 vs 1045 linhas). Pequenas diferenças de lógica.
- `SupabaseClient<Database>` → `any` em todas as assinaturas de método.

### `backend/src/types/index.ts`
- Ambas as versões têm ~472 linhas. Diferenças menores nos tipos.

### `backend/src/types/supabase.ts` e `backend/src/types/salary.ts`
- Diferenças de tipos/schema.

### `backend/src/utils/userFilterUtils.ts` *(NOVO em top)*
- Utilitário para filtrar usuários restritos com funções:
  - `filterRestrictedUsers`
  - `filterRestrictedEmployeeRelations`
  - `filterEvaluationRestrictedUsers`
  - `filterEvaluationRestrictedEmployeeRelations`

### `backend/database/` *(NOVO em top)*
Migrations SQL adicionais:
- `add_committee_deliberations.sql` — estrutura para deliberações do comitê
- `add_ninebox_promotion.sql` — campo de promoção no Nine Box
- `add_potential_details.sql` — detalhes de potencial
- `fix_rls_policies.sql` — correções de RLS
- `fix_user_salaries.sql` — correções de salários
- `rls_policies.sql` — políticas RLS completas

---

## 3. FRONTEND

### `frontend/src/main.tsx`
- Versão `top` **remove** o `ErrorBoundary` que envolvia o `App`.
- Versão atual: `<ErrorBoundary><App /></ErrorBoundary>`
- Versão top: `<App />`

### `frontend/src/config/api.ts`
- **URL de produção**: `avaliacao-performance-naue.onrender.com` → `avaliacao-performance-top.onrender.com`
- **Token storage**: `sessionStorage` → `localStorage` (persiste entre sessões)
- **Timeout**: Adicionado `AbortController` com timeout de 60 segundos
- **Refresh de token**: Lógica automática de renovação de token em erros 401 (não havia antes). Se renovar com sucesso, refaz a requisição. Se falhar, faz logout e redireciona para `/login`.
- **Parâmetro `isRetry`**: Método `request` recebe `isRetry: boolean` para evitar loop infinito no refresh.
- **Download**: Método `downloadFile` expandido com `try/catch` e tratamento de erros detalhado.

### `frontend/src/App.tsx`
- Versão `top` é maior (496 linhas vs 406).
- Novos módulos/rotas adicionadas:
  - `/interviews` — Entrevistas
  - `/recruitment` — Vagas/Recrutamento
  - `/satisfaction` — Pesquisas de Satisfação
  - `/pdi-calendar` — Calendário PDI
  - `/forgot-password` — Página de esqueceu a senha
- Dashboard separado por role: `AdminDashboard`, `DirectorDashboard`, `LeaderDashboard`, `CollaboratorDashboard` (no atual, existe apenas um `Dashboard` único).
- `Guia NineBox` removido da rota (agora pode estar no Sidebar sem rota própria, ou integrado).

### `frontend/src/context/AuthContext.tsx`
- Versão `top` é muito maior (493 linhas vs 298).
- Novo campo em `AuthContextType`: `sessionExpired: boolean`
- Novo método: `signInWithMicrosoft()` — login com Microsoft/OAuth
- Usa `useRef` (adicionado import)
- Importa `userService` de `../services/user.service`
- Lógica de detecção de sessão expirada

### `frontend/src/types/user.ts`
- Única diferença: campo `must_change_password?: boolean` adicionado na interface `User` (suporta fluxo de primeiro login).

### `frontend/src/components/Sidebar.tsx`
- Versão `top` é muito maior (671 linhas vs 386).
- **Novo comportamento collapsed**: quando a sidebar está colapsada e o usuário hover em um item com dropdown, aparece um popup lateral (`collapsedDropdown`) com os sub-itens.
- **Novos itens de navegação** na versão `top`:
  - `Entrevistas` → `/interviews`
  - `Calendário PDI` → `/pdi-calendar`
  - `Vagas` → `/recruitment`
  - `Pesquisas` → `/satisfaction`
- **Removido** da sidebar: `Guia NineBox` e `Relatórios` (foram removidos ou reorganizados).
- **Removido** da sidebar: `Meu PDI` com `allowedRoles: ['director', 'leader', 'collaborator']` — agora reorganizado.

### `frontend/src/pages/home/Dashboard.tsx`
- Versão `top` é muito menor (24 linhas vs 205). Agora o Dashboard é apenas um roteador que renderiza o dashboard específico por role (`AdminDashboard`, `DirectorDashboard`, `LeaderDashboard`, `CollaboratorDashboard`).

### `frontend/src/pages/auth/Login.tsx`
- Versão `top` é maior (341 linhas vs 192).
- Adicionado link para "Esqueceu a senha?" → `/forgot-password`
- Provável adição do botão de login com Microsoft

### `frontend/src/pages/evaluations/NineBoxGuide.tsx`
- **Dark mode**: classes `dark:bg-gray-800` → `dark:bg-yt-surface`, `dark:border-gray-700` → `dark:border-yt-border`
- **Cores de ícones**: `green-800`/`green-700` → `teal-800`/`teal-700`
- **Texto**: "Performance →" → "performance →" (minúsculo)
- **Cores de legenda**: `bg-green-400`/`bg-green-600` → `bg-teal-400`/`bg-teal-600`

### `frontend/src/pages/evaluations/Consensus.tsx`
- Mais de 2900 linhas de diferença. Reescrita/grande refatoração da página de consenso.

### `frontend/src/services/user.service.ts`
- Tratamento de resposta normalizado: `response.data` com fallback para `response` diretamente.
- **Novos métodos**:
  - `checkEmailExists(email)` — verifica se email já existe
  - `addUserToTeams(userId, teamIds)` — adiciona usuário a times

### `frontend/src/services/pdiService.ts`
- Versão `top` muito maior (368 linhas vs 146).
- Novos métodos para gestão avançada de PDI.

### `frontend/src/hooks/useEvaluation.ts`, `useSalaryManagement.ts`, `useSupabaseData.ts`, `useOrganizationalCompetencies.ts`
- Diferenças internas de lógica.

### `frontend/src/hooks/usePeopleCommittee.ts` *(NOVO em top)*
- Hook para o módulo de Comitê de Gente.

### `frontend/src/components/FirstLoginPasswordModal.tsx` *(NOVO em top)*
- Modal que aparece no primeiro login para forçar troca de senha.
- Integrado com o campo `must_change_password` da interface `User`.

### `frontend/src/components/LoadingSpinner.tsx` *(NOVO em top)*
- Componente de spinner de carregamento reutilizável.

### `frontend/src/services/dataCache.service.ts` *(NOVO em top)*
- Service para cache de dados no frontend.

### Outros componentes com diferenças
| Componente | Tipo de mudança |
|---|---|
| `Button.tsx` | Variações de estilo/props |
| `CriteriaRating.tsx` | Lógica de rating |
| `CycleManagement.tsx` | Gestão de ciclos |
| `EvaluationSection.tsx` | Seção de avaliação |
| `Header.tsx` | Layout/estilo |
| `Layout.tsx` | Layout geral |
| `LeaderEvaluationHeader.tsx` | Header da avaliação do líder |
| `PDIViewer.tsx` | Visualizador de PDI |
| `PermissionGuard.tsx` | Guards de permissão |
| `PotentialAndPDI.tsx` | Componente de potencial |
| `ProtectedRoute.tsx` | Rota protegida |
| `RoleGuard.tsx` | Guard de roles |
| `StatusBadge.tsx` | Badge de status |
| `ThemeToggle.tsx` | Toggle de tema |
| `UserProfileFields.tsx` | Campos de perfil |
| `UserSalaryAssignment.tsx` | Atribuição de salário |

---

### Calendário PDI (`/pdi-calendar`)
- Frontend: `PdiCalendar.tsx`

### Dashboards por Role
- `AdminDashboard.tsx`
- `DirectorDashboard.tsx`
- `LeaderDashboard.tsx`
- `CollaboratorDashboard.tsx`

### Página Esqueceu a Senha (`/forgot-password`)
- Frontend: `ForgotPassword.tsx`

### Competências (API)
- Backend: `competencyController.ts`, `competencyRoutes.ts`
- Service: `competency.service.ts`

---

## 5. RESUMO EXECUTIVO

| Categoria | atual | top |
|---|---|---|
| Módulos de negócio | 8 | 13 (+5) |
| Dashboards por role | 1 único | 4 separados |
| Login | Email/senha | Email/senha|
| Token storage | `sessionStorage` | `localStorage` |
| Auto-refresh token | Não | Sim (em 401) |
| Request timeout | Não | 60 segundos |
| Primeiro login | Sem fluxo especial | Modal de troca de senha |
| Cor primária | Verde `#003b2b` | Azul escuro `#1e2938` |
| Cores adicionais | — | Teal, Blue, Gold (Top brand) |
| Fonte adicional | — | Lemon Milk |
| Dark mode | `gray-*` | `yt-*` (YouTube-style) |
| Migrations SQL | — | 6 arquivos adicionais |
| Filtros de usuário restritos | Não | Sim (`userFilterUtils`) |
| Cache de dados | Não | Sim (`dataCache.service.ts`) |
