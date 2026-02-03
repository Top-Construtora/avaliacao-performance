# Avaliação de Performance

![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/Licenca-Privado-red)

Sistema de avaliacao de desempenho, gestao de carreira e desenvolvimento pessoal com suporte **multi-tenant** para multiplos clientes. Monorepo com frontend React e backend Express, ambos em TypeScript. Cada cliente (NAUE, LUSAH, HAURA) possui banco de dados Supabase e deploy independentes.

---

## Funcionalidades

### Avaliacao de Desempenho
- **Ciclos de avaliacao** com abertura e fechamento controlado
- **Autoavaliacao** de competencias tecnicas, comportamentais e organizacionais
- **Avaliacao do lider** com analise de potencial
- **Consenso** consolidando multiplas avaliacoes
- **Matriz Nine Box** (Performance x Potencial) com visualizacao interativa e guia explicativo
- **Codigo Cultural** - competencias organizacionais configuraveis

### Gestao de Carreira & Salarios
- **Trilhas de carreira** com cargos e progressao definida
- **Classes salariais** com niveis e multiplicadores
- **Regras de progressao** entre cargos
- **Atribuicao de colaboradores** a trilhas e faixas salariais
- **Relatorios salariais** por departamento e cargo

### PDI (Plano de Desenvolvimento Individual)
- Criacao de planos com itens de acao por competencia
- Prazos: curto, medio e longo prazo
- Acompanhamento de status em 5 niveis
- Integracao com ciclos de avaliacao

### Gestao Organizacional
- **Usuarios** com 3 papeis: Diretor, Lider, Colaborador
- **Departamentos** e **equipes** com hierarquia
- **Dashboards** especificos por papel
- **Notificacoes** persistentes
- **Tema escuro/claro**

### Relatorios & Exportacao
- Dashboard analitico de avaliacoes
- Exportacao em **PDF** (jsPDF + AutoTable)
- Exportacao em **Excel** (XLSX / ExcelJS)
- Relatorios de trilha de carreira

### Multi-Tenant
- **3 ambientes** independentes (NAUE, LUSAH, HAURA)
- Bancos de dados Supabase separados por cliente
- Deploy independente no Vercel (frontend) e Render (backend)
- Script CLI para troca rapida de ambiente (`npm run switch-env`)

---

## Arquitetura

```
avaliacao-performance/
├── frontend/          # React 18 + Vite + Tailwind CSS
├── backend/           # Express 4 + TypeScript + Supabase
├── env-config.json    # Configuracao dos 3 ambientes
├── switch-env.js      # CLI para troca de ambiente
└── package.json       # Scripts do monorepo (concurrently)
```

---

## Pre-requisitos

- [Node.js](https://nodejs.org/) >= 18.x
- Conta no [Supabase](https://supabase.com/) com projeto configurado

## Instalacao

```bash
# Instalar todas as dependencias (raiz + frontend + backend)
npm run install:all
```

## Executando

```bash
# Frontend + Backend simultaneamente (recomendado)
npm run dev

# Apenas frontend (http://localhost:5173)
npm run dev:frontend

# Apenas backend (http://localhost:3001)
npm run dev:backend

# Trocar ambiente (NAUE / LUSAH / HAURA)
npm run switch-env
```

## Build

```bash
# Build do frontend (producao)
npm run build:frontend

# Build do backend (compila TypeScript)
npm run build:backend
```

## Outros comandos

```bash
# Limpar todos os node_modules
npm run clean

# Limpar e reinstalar tudo
npm run clean:install
```

---

## Frontend

### Estrutura

```
frontend/src/
├── components/         # 17 componentes reutilizaveis
│   ├── Layout.tsx              # Wrapper principal (Header + Sidebar)
│   ├── ProtectedRoute.tsx      # Guard de rota por autenticacao
│   ├── RoleGuard.tsx           # Guard de rota por papel
│   ├── PermissionGuard.tsx     # Guard de rota por permissao
│   ├── CriteriaRating.tsx      # Rating interativo de competencias
│   ├── EvaluationSection.tsx   # Secao de avaliacao
│   ├── PDIViewer.tsx           # Visualizacao do PDI
│   ├── UserProfileFields.tsx   # Campos do perfil do usuario
│   ├── UserSalaryAssignment.tsx # Atribuicao salarial
│   ├── StatusBadge.tsx         # Badge de status
│   ├── ThemeToggle.tsx         # Alternancia escuro/claro
│   └── ...
├── pages/              # 30 paginas organizadas por dominio
│   ├── auth/                   # Login, Reset de Senha
│   ├── home/                   # Dashboard (Admin, Diretor, Lider, Colaborador)
│   ├── evaluations/            # Autoavaliacao, Lider, Consenso, Nine Box
│   ├── pdi/                    # Meu PDI, Gestao de PDIs
│   ├── management/             # Ciclos, Salarios, Codigo Cultural
│   ├── users/                  # CRUD de usuarios
│   ├── teams/                  # CRUD de equipes
│   ├── departments/            # CRUD de departamentos
│   ├── career/                 # Trilhas de carreira
│   ├── reports/                # Relatorios e Dashboard analitico
│   ├── settings/               # Configuracoes do usuario
│   ├── notifications/          # Historico de notificacoes
│   └── help/                   # Pagina de ajuda
├── services/           # 7 servicos de API
│   ├── auth.service.ts
│   ├── evaluation.service.ts
│   ├── user.service.ts
│   ├── departments.service.ts
│   ├── salary.service.ts
│   ├── pdiService.ts
│   └── supabase.service.ts
├── hooks/              # 6 hooks customizados
│   ├── useEvaluation.ts
│   ├── usePermissions.ts
│   ├── useSalaryManagement.ts
│   ├── useOrganizationalCompetencies.ts
│   ├── useAuthNavigation.ts
│   └── useSupabaseData.ts
├── context/            # 4 Context Providers
│   ├── AuthContext.tsx          # Autenticacao e tokens
│   ├── EvaluationContext.tsx    # Ciclos, PDI, Nine Box
│   ├── ThemeContext.tsx         # Tema escuro/claro
│   └── UserContext.tsx          # Dados do usuario
├── types/              # 7 arquivos de tipos TypeScript
├── config/
│   └── api.ts                  # Cliente API centralizado com refresh de token
└── lib/
    └── supabase.ts             # Cliente Supabase
```

### Principais Bibliotecas

| Biblioteca | Uso |
|---|---|
| **React 18** | Framework UI |
| **Vite** | Build tool com HMR |
| **Tailwind CSS** | Estilizacao utility-first |
| **Framer Motion** | Animacoes suaves |
| **Chart.js** + react-chartjs-2 | Graficos e analytics |
| **Lucide React** | Icones |
| **jsPDF** + jspdf-autotable | Exportacao PDF |
| **XLSX** | Exportacao Excel |
| **React Hot Toast** | Notificacoes toast |
| **React Table** | Tabelas de dados |
| **Space Grotesk** | Fonte customizada |

### Variaveis de Ambiente (frontend)

Crie `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_USE_SUPABASE_AUTH=true
```

---

## Backend

### Estrutura

```
backend/src/
├── app.ts              # Configuracao Express (CORS, Helmet, rotas)
├── config/
│   └── supabase.ts     # Cliente Supabase
├── controllers/        # 6 controllers
│   ├── authController.ts
│   ├── evaluationController.ts
│   ├── userController.ts
│   ├── departmentController.ts
│   ├── salaryController.ts
│   └── pdiController.ts
├── routes/             # 7 arquivos de rotas
│   ├── authRoutes.ts
│   ├── evaluationRoutes.ts
│   ├── userRoutes.ts
│   ├── departmentRoutes.ts
│   ├── salaryRoutes.ts
│   ├── pdiRoutes.ts
│   └── index.ts
├── services/           # 6 servicos de negocio
│   ├── authService.ts
│   ├── evaluationService.ts
│   ├── userService.ts
│   ├── exportService.ts
│   ├── salaryService.ts
│   └── pdiService.ts
├── middleware/
│   ├── auth.ts         # Verificacao JWT + Supabase Auth
│   └── errorHandler.ts # Handler global de erros
├── types/              # Definicoes TypeScript
├── utils/              # salaryBusinessRules, pdiUtils
└── database/
    └── migrations/     # Scripts SQL
```

### Endpoints da API

#### Autenticacao (`/api/auth`)
| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/login` | Login com email/senha |
| POST | `/register` | Cadastro de usuario |
| POST | `/logout` | Logout |
| GET | `/profile` | Perfil do usuario autenticado |

#### Usuarios (`/api/users`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar usuarios (com filtros) |
| POST | `/` | Criar usuario |
| GET | `/:id` | Detalhes do usuario |
| PUT | `/:id` | Atualizar usuario |
| DELETE | `/:id` | Remover usuario |
| GET | `/leader/:id/subordinates` | Listar subordinados |

#### Avaliacoes (`/api/evaluations`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/cycles` | Listar ciclos |
| GET | `/cycles/current` | Ciclo atual |
| POST | `/cycles` | Criar ciclo |
| PUT | `/cycles/:id/open` | Abrir ciclo |
| PUT | `/cycles/:id/close` | Fechar ciclo |
| POST | `/self` | Criar autoavaliacao |
| POST | `/leader` | Criar avaliacao do lider |
| GET | `/employee/:id` | Avaliacoes do colaborador |
| GET | `/cycles/:id/nine-box` | Dados da Matriz Nine Box |
| GET | `/cycles/:id/dashboard` | Dashboard do ciclo |

#### PDI (`/api/pdi`)
| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/` | Salvar PDI |
| GET | `/:employeeId` | PDI do colaborador |
| PUT | `/:pdiId` | Atualizar PDI |
| GET | `/cycle/:cycleId` | PDIs do ciclo |

#### Departamentos (`/api/departments`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar departamentos |
| POST | `/` | Criar departamento |
| PUT | `/:id` | Atualizar departamento |
| DELETE | `/:id` | Remover departamento |

#### Salarios & Carreira (`/api/salary`)
| Metodo | Rota | Descricao |
|---|---|---|
| CRUD | `/classes` | Classes salariais |
| CRUD | `/positions` | Cargos |
| CRUD | `/levels` | Niveis salariais |
| CRUD | `/career-tracks` | Trilhas de carreira |
| CRUD | `/track-positions` | Cargos nas trilhas |
| CRUD | `/progression-rules` | Regras de progressao |
| POST | `/assign-user` | Atribuir colaborador a trilha |
| POST | `/progress-user` | Progredir colaborador |
| GET | `/reports/*` | Relatorios salariais |

#### Outros
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/test` | Endpoint de teste |
| GET | `/api/health` | Health check |

### Variaveis de Ambiente (backend)

Crie `backend/.env`:

```env
# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key

# JWT
JWT_SECRET=sua-chave-secreta
```

---

## Multi-Tenant (Troca de Ambiente)

O sistema suporta 3 clientes com bancos de dados independentes:

| Ambiente | Cliente | Frontend | Backend |
|---|---|---|---|
| **banco1** | NAUE | avaliacao-performance-naue.vercel.app | avaliacao-performance-naue.onrender.com |
| **banco2** | LUSAH | avaliacao-performance-lusah.vercel.app | avaliacao-performance-pgu5.onrender.com |
| **banco3** | HAURA | avaliacao-performance-haura.vercel.app | avaliacao-performance-haura.onrender.com |

Para trocar de ambiente localmente:

```bash
npm run switch-env
# Selecione: 1 (NAUE), 2 (LUSAH) ou 3 (HAURA)
```

O script atualiza automaticamente `frontend/.env.local` e `backend/.env` com as credenciais do ambiente selecionado.

---

## Banco de Dados (Supabase)

### Tabelas principais

| Grupo | Tabelas |
|---|---|
| **Autenticacao** | `users` (com papeis, departamento, cargo, salario) |
| **Organizacao** | `departments`, `teams`, `team_members` |
| **Avaliacao** | `evaluation_cycles`, `self_evaluations`, `leader_evaluations`, `evaluation_competencies`, `competencies` |
| **Carreira** | `salary_classes`, `job_positions`, `salary_levels`, `career_tracks`, `track_positions`, `progression_rules`, `user_salary_history` |
| **PDI** | `personal_development_plans`, `pdi_items` |
| **Auditoria** | `audit_logs` |

### Tipos customizados

```sql
contract_type ENUM: 'CLT', 'PJ', 'Estagiário', 'Temporário'
progression_type ENUM: 'salary_level', 'position', 'promotion'
```

### Papeis de Usuario

| Papel | Acesso |
|---|---|
| **Diretor** | Dashboard RH, gestao de ciclos, relatorios, Nine Box, gestao de usuarios |
| **Lider** | Avaliacao de subordinados, PDI da equipe, dashboard de equipe |
| **Colaborador** | Autoavaliacao, visualizacao do proprio PDI, dashboard pessoal |

---

## Seguranca

- **Helmet** para headers HTTP seguros
- **CORS** com whitelist de origens permitidas (por ambiente)
- **Rate Limiting** contra abuso de requisicoes
- **Supabase Auth** para autenticacao gerenciada
- **JWT** com refresh automatico de tokens
- **Guards de rota** por papel no frontend (RoleGuard, PermissionGuard)
- **Middleware de autorizacao** no backend

## Deploy

| Componente | Plataforma |
|---|---|
| Frontend | Vercel (build estatico) |
| Backend | Render (3 instancias, uma por cliente) |
| Banco de dados | Supabase (3 projetos PostgreSQL independentes) |

```bash
# Build de producao do frontend
npm run build:frontend

# Build do backend
npm run build:backend

# Iniciar backend em producao
cd backend && npm start
```

---

Desenvolvido por **GIO**
