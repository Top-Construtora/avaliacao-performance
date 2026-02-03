# CRM TOP Construtora

![Angular](https://img.shields.io/badge/Angular-20-dd0031?logo=angular&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/Licenca-Privado-red)

Sistema de gerenciamento de relacionamento com clientes (CRM) desenvolvido para a **TOP Construtora**. Frontend Angular 20 com componentes standalone e backend Express 5 com Supabase (PostgreSQL).

---

## Funcionalidades

### Gestao de Clientes
- Cadastro de **Pessoa Fisica (PF)** e **Pessoa Juridica (PJ)**
- Multiplos e-mails e telefones por cliente
- Upload de documentos, anexos e logo da empresa
- Busca e filtragem avancada

### Propostas Comerciais
- Criacao de propostas com selecao de servicos e precos personalizados
- Termos e condicoes configuraveis
- **Link publico** para visualizacao e assinatura pelo cliente
- Tipos: Full, Pontual, Individual, Recrutamento & Selecao
- Status: rascunho, enviada, assinada, rejeitada, expirada, convertida
- Duplicacao e conversao automatica em contratos

### Contratos
- Gerados a partir de propostas aprovadas
- Multiplos servicos por contrato com etapas de execucao
- Gestao de **parcelas e pagamentos** (metodos multiplos)
- Atribuicao de responsaveis da equipe
- Status: ativo, concluido, cancelado, suspenso
- Exportacao em PDF e Excel

### Servicos & Etapas
- Biblioteca de servicos reutilizaveis com categorias e duracao
- Etapas configuraveis por servico com ordenacao
- Acompanhamento de progresso por etapa
- Comentarios e anexos por etapa de servico

### Rotinas
- Agendamento de tarefas recorrentes por servico
- Comentarios por rotina com anexos
- Status de execucao e notificacoes de prazos

### Analytics & Relatorios
- **Dashboard** com metricas e indicadores (Chart.js)
- Estatisticas de contratos e propostas
- Relatorios exportaveis em **PDF** (PDFKit/jsPDF) e **Excel** (ExcelJS)
- Rastreamento de atividade

### Notificacoes
- Notificacoes em tempo real
- Centro de notificacoes e dropdown
- Toast notifications (ngx-toastr)
- Notificacoes por e-mail (Nodemailer)
- Jobs em background para alertas

### Planejamento Estrategico
- Matriz SWOT e SWOT cruzada
- OKRs (Objetivos e Resultados-Chave)
- Classificacao de riscos
- Arvore de problemas

---

## Identidade Visual

| Cor | Hex | Uso |
|---|---|---|
| **Primary** | `#1e6076` | Azul esverdeado principal |
| **Secondary** | `#12b0a0` | Verde agua |
| **Accent** | `#baa673` | Dourado |

---

## Arquitetura

```
gestao-top/
├── frontend/          # Angular 20 + standalone components
├── backend/           # Express 5 + Supabase
├── CLAUDE.md          # Diretrizes de desenvolvimento
└── README.md
```

---

## Pre-requisitos

- [Node.js](https://nodejs.org/) >= 18.x
- [Angular CLI](https://angular.dev/tools/cli) >= 20.x
- Conta no [Supabase](https://supabase.com/) com projeto configurado

## Instalacao

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

## Executando

```bash
# Frontend (http://localhost:4200)
cd frontend && npm start

# Backend com hot reload (http://localhost:3000)
cd backend && npm run dev
```

## Build

```bash
# Frontend - producao
cd frontend && npm run build

# Frontend - desenvolvimento
cd frontend && npm run build:development

# Backend - producao
cd backend && npm start
```

## Testes

```bash
# Frontend (Karma/Jasmine)
cd frontend && npm test

# Backend (Jest)
cd backend && npm test
cd backend && npm run test:coverage
cd backend && npm run lint
```

---

## Frontend

### Estrutura

```
frontend/src/app/
├── components/              # 74+ componentes reutilizaveis
│   ├── analytics-page/
│   ├── clients-table / client-view-page / new-client-page
│   ├── contracts-table / contract-view-page / contract-form
│   ├── contract-services-manager / contract-export-modal
│   ├── proposals-page / proposal-form / proposal-view-page
│   ├── send-proposal-modal / duplicate-proposal-modal
│   ├── proposal-to-contract-modal
│   ├── services-table / services-form / services-modal
│   ├── service-tracking-page / routines-page / routine-view-page
│   ├── installments-manager / installments-modal
│   ├── payment-methods-manager / payment-methods-selector
│   ├── dashboard-content / contract-stats-cards / proposal-stats-cards
│   ├── reports-page
│   ├── users-page / user-modal / settings-page
│   ├── header / sidebar / breadcrumb
│   ├── notification-center / notification-dropdown / notification-toast
│   ├── planejamento-estrategico-page / planejamento-form / planejamento-view
│   └── ...
├── pages/                   # 4 paginas de rota
│   ├── home/                       # Dashboard principal
│   ├── login/                      # Autenticacao
│   ├── access-denied/              # Acesso negado
│   └── public-proposal-view/       # Proposta publica
├── services/                # 30+ servicos Angular
│   ├── auth.ts, login.ts
│   ├── client.ts, client.service.ts, client-attachment.service.ts
│   ├── contract.ts, contract.service.ts, contract-export.service.ts
│   ├── proposal.ts, public-proposal.service.ts
│   ├── service.ts, service-stage.service.ts
│   ├── routine.service.ts, routine-attachment.service.ts
│   ├── user.ts, user.service.ts, profile-picture.service.ts
│   ├── analytics.ts, report.ts
│   ├── notification.service.ts, payment-method.service.ts
│   ├── planejamento-estrategico.service.ts
│   ├── modal.service.ts, search.service.ts
│   └── ...
├── guards/                  # 10 guards de rota
│   ├── auth-guard.ts, admin-guard.ts, admin-only-guard.ts
│   ├── admin-gerencial-guard.ts, user-guard.ts
│   └── must-change-password-guard.ts
├── interceptors/            # retry.interceptor.ts
├── directives/              # click-outside.directive.ts
├── types/                   # Definicoes TypeScript
└── app.routes.ts            # Configuracao de rotas
```

### Principais Bibliotecas

| Biblioteca | Uso |
|---|---|
| **Angular 20** | Framework UI com standalone components |
| **Chart.js** | Graficos do dashboard |
| **docx** | Geracao de documentos Word |
| **jsPDF** + **html2canvas** | Exportacao em PDF |
| **xlsx-js-style** | Exportacao em Excel |
| **pdfjs-dist** | Visualizacao de PDFs |
| **ngx-toastr** | Notificacoes toast |
| **CKEditor 5** / **TipTap** | Editores rich text |
| **RxJS** | Programacao reativa |

### Configuracao de Ambiente

```typescript
// environment.ts (desenvolvimento)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authUrl: 'http://localhost:3000/api/auth'
};

// environment.prod.ts (producao)
export const environment = {
  production: true,
  apiUrl: 'https://gestao-top.onrender.com/api',
  authUrl: 'https://gestao-top.onrender.com/api/auth'
};
```

---

## Backend

### Estrutura

```
backend/
├── server.js                # Entry point
└── src/
    ├── app.js               # Configuracao Express (CORS, Helmet, rotas)
    ├── config/
    │   ├── database.js      # Cliente Supabase + query handlers
    │   ├── auth.js          # Configuracao JWT
    │   ├── email.js         # Nodemailer SMTP
    │   └── rateLimiter.js   # Rate limiting
    ├── controllers/         # 29 controllers
    │   ├── authController.js
    │   ├── clientController.js
    │   ├── contractController.js
    │   ├── proposalController.js
    │   ├── serviceController.js
    │   ├── installmentController.js
    │   ├── analyticsController.js
    │   ├── reportController.js
    │   ├── notificationController.js
    │   ├── userController.js
    │   └── ...
    ├── routes/              # 31 arquivos de rotas
    ├── models/              # 20+ modelos de dados
    ├── services/            # 10+ servicos de negocio
    ├── middleware/           # 6 middlewares
    │   ├── authMiddleware.js
    │   ├── roleMiddleware.js
    │   ├── errorHandler.js
    │   ├── activityTracker.js
    │   └── contractAcessMiddleware.js
    ├── reportGenerators/    # pdfGenerator.js, excelGenerator.js
    ├── jobs/                # notificationJobs.js
    └── utils/               # validators, tokenGenerator
```

### Endpoints da API

#### Autenticacao (`/api/auth`)
| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/login` | Login com email/senha |
| POST | `/forgot-password` | Solicitar reset de senha |
| POST | `/reset-password` | Resetar senha |
| GET | `/verify` | Verificar token |

#### Clientes (`/api/clients`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar clientes |
| POST | `/` | Criar cliente (PF ou PJ) |
| GET | `/:id` | Detalhes do cliente |
| PUT | `/:id` | Atualizar cliente |
| DELETE | `/:id` | Remover cliente |
| POST | `/client-emails` | Adicionar e-mail |
| POST | `/client-phones` | Adicionar telefone |
| POST | `/client-attachments` | Upload de anexo |

#### Propostas (`/api/proposals`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar propostas |
| POST | `/` | Criar proposta |
| GET | `/:id` | Detalhes da proposta |
| PUT | `/:id` | Atualizar proposta |
| DELETE | `/:id` | Remover proposta |
| POST | `/:id/send` | Enviar para cliente |
| POST | `/:id/convert` | Converter em contrato |
| GET | `/public/:token` | Visualizacao publica |

#### Contratos (`/api/contracts`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar contratos |
| POST | `/` | Criar contrato |
| GET | `/:id` | Detalhes do contrato |
| PUT | `/:id` | Atualizar contrato |
| DELETE | `/:id` | Remover contrato |
| GET | `/:id/services` | Servicos do contrato |
| PUT | `/contract-service-stages/:id` | Atualizar etapa |

#### Outros
| Metodo | Rota | Descricao |
|---|---|---|
| CRUD | `/api/services` | Servicos e etapas |
| CRUD | `/api/users` | Gestao de usuarios |
| CRUD | `/api/installments` | Parcelas de pagamento |
| GET | `/api/analytics/*` | Metricas e indicadores |
| GET | `/api/reports/*` | Geracao de relatorios |
| CRUD | `/api/notifications` | Notificacoes |
| CRUD | `/api/routines` | Rotinas de servico |
| GET | `/api/payment-methods` | Metodos de pagamento |
| GET | `/api/planejamento-estrategico` | Planejamento estrategico |
| GET | `/health` | Health check |

### Variaveis de Ambiente

Crie `backend/.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key

# JWT
JWT_SECRET=sua-chave-secreta
JWT_EXPIRE=7d
JWT_RESET_EXPIRE=1h

# E-mail (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM="CRM TOP <noreply@top.com.br>"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Banco de Dados

### Tabelas principais

| Grupo | Tabelas |
|---|---|
| **Usuarios** | `users`, `roles`, `permissions`, `role_permissions` |
| **Clientes** | `clients`, `clients_pf`, `clients_pj`, `client_emails`, `client_phones`, `client_attachments` |
| **Propostas** | `proposals`, `proposal_services`, `proposal_terms` |
| **Contratos** | `contracts`, `contract_services`, `contract_installments`, `contract_payment_methods`, `contract_assignments` |
| **Servicos** | `services`, `service_stages`, `contract_service_stages`, `service_routines` |
| **Comentarios** | `contract_service_comments`, `service_comment_attachments`, `routine_comments`, `routine_comment_attachments` |
| **Sistema** | `notifications`, `contract_access_logs`, `proposal_access_logs` |

### Papeis de Usuario

| Papel | Acesso |
|---|---|
| **Admin** | Acesso total: usuarios, clientes, propostas, contratos, relatorios, configuracoes |
| **Admin Gerencial** | Acesso administrativo limitado (sem relatorios completos e gestao de usuarios) |
| **Usuario** | Acesso basico a rotinas e servicos atribuidos |

---

## Seguranca

- **Helmet** para headers HTTP seguros
- **CORS** configurado para o frontend
- **Rate Limiting** com `express-rate-limit` e `express-slow-down`
- **JWT** para autenticacao stateless (expiracao 7 dias)
- **bcryptjs** para hash de senhas
- **Joi** para validacao de entrada
- **Guards de rota** por papel no frontend (10 guards)
- **Middleware de autorizacao** por papel no backend
- **Rastreamento de atividade** em endpoints sensiveis

## Deploy

| Componente | Plataforma |
|---|---|
| Frontend | Vercel (build estatico) |
| Backend | Render (Node.js) |
| Banco de dados | Supabase (PostgreSQL gerenciado) |

---

Desenvolvido para **TOP Construtora**
