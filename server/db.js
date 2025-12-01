const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do Pool de Conexões (Ideal para SaaS)
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'sie301',
  password: process.env.DB_PASSWORD, // Lerá do arquivo .env
  database: process.env.DB_NAME || 'sie301',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão inicial
pool.getConnection()
  .then(conn => {
    console.log(`✅ [DB_CONNECT] Conectado com sucesso ao MySQL: ${process.env.DB_NAME} em ${process.env.DB_HOST}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ [DB_ERROR] Falha ao conectar no MySQL:', err.message);
  });

module.exports = pool;