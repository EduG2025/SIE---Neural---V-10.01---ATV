
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

O dashboard exibirá o status "SISTEMA OPERANTE" apenas se a conexão com o banco for bem-sucedida.
