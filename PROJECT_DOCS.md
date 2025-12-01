# SIE 3xxx - Documentação Técnica (Produção)

Este documento detalha a arquitetura, endpoints e estrutura de diretórios para manutenção e expansão do sistema na VPS.

## 1. Estrutura de Diretórios na VPS
O sistema deve ser instalado preferencialmente em `/home/jennyai-sie/htdocs/sie.jennyai.space/`.

```
/ (Raiz do Projeto)
├── credenciais/            # [Maintenance Mode] Armazena JSONs de login temporário
├── database/
│   └── schema.sql          # Script SQL para criação/reset do banco
├── dist/                   # [Build] Arquivos estáticos gerados pelo Vite (Frontend)
├── media/                  # [Storage] Uploads (Logos, Fotos) servidos publicamente
├── server/
│   ├── index.js            # [Backend] API Server & File System Manager
│   └── db.js               # [Backend] Conexão MySQL (Pool)
├── src/
│   ├── active_modules/     # Módulos ativos aprovados pela IA
│   ├── components/         # Componentes React principais
│   │   ├── AICore.tsx      # Núcleo Neural (Root Control + IDE)
│   │   ├── CommerceManager.tsx
│   │   └── ...
│   ├── services/           # Camada de comunicação com API
│   │   ├── aiRegistry.ts   # Gestão de Chaves e Fallback
│   │   └── geminiService.ts
│   ├── staging_builds/     # [Staging] Rascunhos gerados pela IA
│   ├── types.ts            # Definições TypeScript
│   ├── App.tsx             # Roteamento e Auth
│   ├── index.css           # Tailwind CSS
│   └── index.tsx           # Entrypoint
├── .backups/               # [Snapshot] Backups automáticos de arquivos alterados
├── .env                    # Variáveis de Ambiente (Segredos)
├── package.json            # Dependências e Scripts
├── setup.sh                # Script de Instalação Automática
├── tailwind.config.js      # Configuração de Estilos
└── vite.config.ts          # Configuração de Build
```

## 2. API Endpoints (Backend Node.js)

### Autenticação & Sistema
- `POST /api/auth/login` - Autenticação por Credencial Única.
- `POST /api/auth/register` - Criação de conta (se permitido).
- `GET /api/auth/settings` - Configurações públicas (Logo, Nome).
- `GET /api/health` - Status do servidor, DB e OS.
- `GET /api/dashboard/stats` - KPIs gerais.

### Módulos de Negócio
- `GET/POST/DELETE /api/users` - Gestão de Usuários.
- `GET/POST/DELETE /api/candidates` - Gestão de Candidatos.
- `GET /api/network` - Visualização da Rede Política.

### Commerce & Planos
- `GET/POST/DELETE /api/plans` - Gestão de Planos de Assinatura.
- `GET/POST /api/payments` - Gestão de Pagamentos.
- `PUT /api/payments/:id/confirm` - Confirmação manual de pagamento.
- `GET /api/modules/list` - Lista módulos disponíveis para inclusão em planos.

### Configurações & IA
- `GET/PUT /api/configs/:key` - Configurações do Sistema (CRUD).
- `POST /api/upload/logo` - Upload de Branding.
- `GET/POST/PUT/DELETE /api/keys` - Gestão de Chaves de IA.

### Sistema de Arquivos (Root Access)
- `GET /api/fs/list` - Listar arquivos da VPS.
- `GET /api/fs/read` - Ler conteúdo.
- `POST /api/fs/write` - Salvar arquivo (com backup automático).
- `POST /api/terminal/exec` - Executar comandos Shell (npm, git, etc).

## 3. Módulos do Sistema (Plugins)

Os módulos são componentes React localizados em `src/components`. O **Commerce Manager** permite vincular o acesso a estes módulos através dos Planos.

| ID (DB) | Componente | Descrição |
|---|---|---|
| `DASHBOARD` | Dashboard.tsx | Visão geral e Gráficos |
| `CANDIDATES` | CandidateSearch.tsx | Busca e Scoring IA |
| `NETWORK` | PoliticalNetwork.tsx | Grafo de conexões |
| `AI_CORE` | AICore.tsx | IDE, Terminal e Gestão Root |
| `COMMERCE` | CommerceManager.tsx | Financeiro e Planos |
| `USERS` | UserManagement.tsx | CRUD de Usuários |

## 4. Comandos de Manutenção (VPS)

```bash
# Iniciar Servidor (Background)
pm2 start server/index.js --name sie-app

# Ver logs em tempo real
pm2 logs sie-app

# Recompilar Frontend após alterações manuais
npm run build
```