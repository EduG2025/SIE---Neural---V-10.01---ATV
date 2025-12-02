
# Configuração de Ambiente (.env)

Este arquivo documenta todas as variáveis de ambiente necessárias para a operação do **SIE 3xxx** em produção (VPS).
A configuração correta destas variáveis é crítica para a segurança e conectividade do sistema.

## 🔴 Chave de Emergência (Root Rescue)

A variável `EMERGENCY_KEY` é o recurso mais crítico de recuperação do sistema. Ela permite login imediato com privilégios de **ADMIN (ROOT)** ignorando completamente a conexão com o Banco de Dados.

**Quando usar:**
1. O MySQL caiu ou não está conectando.
2. Você perdeu o acesso de todas as contas Admin.
3. O sistema de arquivos corrompeu a tabela de usuários.

**Configuração:**
Adicione no seu arquivo `.env`:
```ini
EMERGENCY_KEY=SIE-ROOT-RESCUE-2024-X9Y8Z7
```
*(Use uma string longa, complexa e única).*

---

## 🔵 Banco de Dados (MySQL)

Credenciais para conexão persistente. O sistema não inicia sem isso (exceto para login de emergência).

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sie301
DB_USER=sie301
DB_PASSWORD=SuaSenhaForteDoBanco
```

## 🟢 Servidor & API

```ini
PORT=3000
NODE_ENV=production
# URL pública do sistema (usado para webhooks ou referências absolutas)
PUBLIC_URL=https://sie.jennyai.space
```

## 🟣 Inteligência Artificial

Chave inicial para o Gemini. Outras chaves podem ser adicionadas via painel (tabela `api_keys`).

```ini
API_KEY=AIzaSy...SuaChaveInicial
```

---

## Exemplo de Arquivo .env Completo

Copie e cole isso no arquivo `.env` na raiz do projeto:

```ini
PORT=3000
NODE_ENV=production

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sie301
DB_USER=sie301
DB_PASSWORD=Gegerminal180

# AI
API_KEY=AIzaSy_SUA_CHAVE_AQUI

# Security
EMERGENCY_KEY=SIE-ROOT-RESCUE-MASTER-KEY
```
