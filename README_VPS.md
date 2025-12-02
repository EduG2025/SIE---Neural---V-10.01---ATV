
# SIE 3xxx - Instalação em Produção (VPS)

Este sistema foi configurado para operar exclusivamente com conexões reais ao banco de dados MySQL e APIs ativas.

## 1. Banco de Dados (Obrigatório)

O sistema **não funcionará** sem o banco de dados.

1. Acesse seu servidor MySQL.
2. Crie o banco `sie301`.
3. Importe a estrutura:
   ```bash
   mysql -u sie301 -p sie301 < database/schema.sql
   ```
   **Nota:** O arquivo `schema.sql` contém um SEED inicial (usuário admin, alguns candidatos e nós de rede) para que o painel não fique vazio na primeira execução.

## 2. Variáveis de Ambiente (.env)

Certifique-se de que o `.env` na raiz contém credenciais válidas.

```env
DB_HOST=127.0.0.1
DB_NAME=sie301
DB_USER=sie301
DB_PASSWORD=SuaSenhaReal
```

## 3. Iniciar Servidor

```bash
npm install
npm run build
node server/index.js
```

## 4. Configuração Nginx (Vhost Correto)

Para alta performance e segurança, utilize esta configuração no Nginx (CloudPanel/Ubuntu). Ela gerencia SSL, cache de assets estáticos e faz o proxy da API para o Node.js.

**Arquivo:** `/etc/nginx/sites-available/sie.jennyai.space` (ou configuração Vhost do painel).

```nginx
# ============================================
# 1. Redirecionamento HTTP para HTTPS (Porta 80)
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name sie.jennyai.space;

    # Redirecionamento 301 (permanente)
    return 301 https://$host$request_uri;
}

# ============================================
# 2. Configuração HTTPS (Porta 443)
# ============================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sie.jennyai.space;

    # Diretório base do frontend (Build React/Vite)
    root /home/jennyai-sie/htdocs/sie.jennyai.space/dist;
    index index.html;

    # SSL Configuration (Certbot / Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/sie.jennyai.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sie.jennyai.space/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Logs
    access_log /home/jennyai-sie/logs/nginx/access.log;
    error_log  /home/jennyai-sie/logs/nginx/error.log;

    # Limite de upload (ajustado para suportar logos grandes)
    client_max_body_size 100M;

    # =======================================
    # ASSETS estáticos com cache máximo
    # =======================================
    location /assets/ {
        alias /home/jennyai-sie/htdocs/sie.jennyai.space/dist/assets/;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # =======================================
    # Uploads permanentes (Media)
    # =======================================
    location /media/ {
        # Aponta para a pasta física criada pelo server/index.js
        alias /home/jennyai-sie/htdocs/sie.jennyai.space/media/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # =======================================
    # Proxy API — Node.js (Apenas o caminho /api/)
    # =======================================
    location /api {
        # O backend Node.js está rodando localmente na porta 3000
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Aumentar timeout para requisições longas de IA
        proxy_read_timeout 300s;
    }

    # =======================================
    # SPA FALLBACK — Lida com todas as outras rotas (o frontend)
    # =======================================
    location / {
        # Tenta servir o arquivo, se não encontrar, retorna o index.html
        # para que o roteador do frontend (React/Vite) possa lidar com a rota.
        try_files $uri $uri/ /index.html;
    }

    # Segurança: Bloqueia acesso a arquivos ocultos (ex: .env, .git)
    location ~ /\.ht {
        deny all;
    }
}
```

### Gerenciamento de Processo (PM2)

Para manter o backend rodando 24/7:

```bash
pm2 start server/index.js --name sie-backend
pm2 save
pm2 startup
```
