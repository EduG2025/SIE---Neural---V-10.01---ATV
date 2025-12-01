# Configuração de Ambiente (.env)

Este arquivo contém todas as variáveis necessárias para rodar o sistema **SIE 3xxx**.
Para instalação em produção, copie o conteúdo abaixo para um arquivo chamado `.env` na raiz do projeto.

## 1. Variáveis do Servidor

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `PORT` | Porta onde o servidor Node.js irá rodar | `3000` |
| `NODE_ENV` | Ambiente de execução | `production` |

## 2. Variáveis do Banco de Dados (MySQL)

Credenciais para conexão com o banco de dados da VPS.

| Variável | Descrição | Exemplo Real |
|----------|-----------|-------------|
| `DB_HOST` | IP do servidor MySQL | `127.0.0.1` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_NAME` | Nome do banco de dados | `sie301` |
| `DB_USER` | Usuário do banco | `sie301` |
| `DB_PASSWORD` | Senha do usuário | `SuaSenhaForte!` |

## 3. Inteligência Artificial

| Variável | Descrição |
|----------|-----------|
| `API_KEY` | Chave de API do Google Gemini (AI Studio). Necessário para Scoring de Candidatos e Núcleo Neural. |

---

## Exemplo Completo para Copiar

```env
# Server
PORT=3000
NODE_ENV=production

# Database Config
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sie301
DB_USER=sie301
DB_PASSWORD=Gegerminal180!

# AI Config
API_KEY=sua_chave_aqui_xyz123
```