
# SIE 3xxx - Setup Automatizado para VPS

Este documento contém o script necessário para configurar o ambiente do zero em um servidor Ubuntu 22.04/24.04 (compatível com CloudPanel).

## Instruções Rápidas

1. Acesse sua VPS via SSH como root.
2. Crie o arquivo de setup: `nano setup.sh`
3. Cole o código abaixo.
4. Dê permissão de execução: `chmod +x setup.sh`
5. Execute: `./setup.sh`

---

## Código do Script (setup.sh)

```bash
#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   SIE 3xxx - INSTALADOR AUTOMATIZADO (VPS)         ${NC}"
echo -e "${BLUE}   Ambiente: Node.js + React + MySQL + PM2          ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Atualizar Sistema
echo -e "\n${GREEN}[1/7] Atualizando pacotes do sistema...${NC}"
apt update && apt upgrade -y
apt install -y curl git unzip build-essential

# 2. Instalar Node.js 20 (LTS)
echo -e "\n${GREEN}[2/7] Instalando Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js já instalado: $(node -v)"
fi

# 3. Instalar PM2 Global
echo -e "\n${GREEN}[3/7] Instalando PM2 (Gerenciador de Processos)...${NC}"
npm install -g pm2

# 4. Configurar Diretório do Projeto
PROJECT_DIR=$(pwd)
echo -e "\n${GREEN}[4/7] Configurando projeto em: $PROJECT_DIR ${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}ERRO: package.json não encontrado! Execute este script na raiz do projeto.${NC}"
    exit 1
fi

# 5. Instalar Dependências
echo -e "\n${GREEN}[5/7] Instalando dependências (npm install)...${NC}"
npm install

# 6. Build do Frontend
echo -e "\n${GREEN}[6/7] Compilando Frontend (npm run build)...${NC}"
npm run build

# 7. Configuração do Banco de Dados
echo -e "\n${GREEN}[7/7] Configuração do Banco de Dados${NC}"
read -p "Deseja configurar o banco de dados agora? (s/n): " CONFIGURE_DB

if [[ "$CONFIGURE_DB" == "s" || "$CONFIGURE_DB" == "S" ]]; then
    read -p "Host do MySQL (default: 127.0.0.1): " DB_HOST
    DB_HOST=${DB_HOST:-127.0.0.1}
    
    read -p "Nome do Banco (default: sie301): " DB_NAME
    DB_NAME=${DB_NAME:-sie301}
    
    read -p "Usuário do MySQL (default: sie301): " DB_USER
    DB_USER=${DB_USER:-sie301}
    
    read -s -p "Senha do MySQL: " DB_PASS
    echo ""

    # Criar .env
    echo "PORT=3000" > .env
    echo "NODE_ENV=production" >> .env
    echo "DB_HOST=$DB_HOST" >> .env
    echo "DB_PORT=3306" >> .env
    echo "DB_NAME=$DB_NAME" >> .env
    echo "DB_USER=$DB_USER" >> .env
    echo "DB_PASSWORD=$DB_PASS" >> .env
    
    # Importar Schema
    if [ -f "database/schema.sql" ]; then
        echo "Importando Schema..."
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/schema.sql
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Banco de dados configurado com sucesso!${NC}"
        else
            echo -e "${RED}Erro ao importar SQL. Verifique as credenciais.${NC}"
        fi
    else
        echo -e "${RED}Arquivo database/schema.sql não encontrado.${NC}"
    fi
else
    echo "Pulei a etapa de banco de dados. Configure o .env manualmente."
fi

# Finalização
echo -e "\n${BLUE}====================================================${NC}"
echo -e "${GREEN}INSTALAÇÃO CONCLUÍDA!${NC}"
echo -e "Para iniciar o servidor, execute:"
echo -e "  ${BLUE}pm2 start server/index.js --name sie-app${NC}"
echo -e "  ${BLUE}pm2 save${NC}"
echo -e "${BLUE}====================================================${NC}"
```
