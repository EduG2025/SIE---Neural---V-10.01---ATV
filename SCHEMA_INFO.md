# SIE 3xxx - Database Schema

Este é o esquema oficial de produção para o banco `sie301`.

```sql
CREATE DATABASE IF NOT EXISTS sie301 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sie301;

-- 1. Usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    access_credential VARCHAR(100) UNIQUE, -- Login Token
    role ENUM('ADMIN', 'USER', 'GUEST') DEFAULT 'USER',
    plan ENUM('BASIC', 'PRO', 'ENTERPRISE') DEFAULT 'BASIC',
    status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE',
    avatar VARCHAR(255),
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Configurações & Branding
CREATE TABLE IF NOT EXISTS system_configs (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    data_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE
);

-- 3. Planos de Assinatura
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT DEFAULT 30,
    trial_days INT DEFAULT 0,
    features_json JSON, -- Array de IDs de módulos ['DASHBOARD', 'AI_CORE']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- PIX, CARD, MANUAL
    transaction_id VARCHAR(255),
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    confirmed_by_admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 5. Chaves de IA (Multi-provider)
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider ENUM('GEMINI', 'OPENROUTER', 'HUGGINGFACE', 'DEEPSEEK', 'OTHER') DEFAULT 'GEMINI',
    key_value VARCHAR(255) NOT NULL,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 5, -- 1 = Maior prioridade
    usage_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Módulos Específicos (Candidatos, Rede)
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(50),
    state VARCHAR(2),
    score INT DEFAULT 0,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    photo_url VARCHAR(255),
    last_analysis_json JSON
);

CREATE TABLE IF NOT EXISTS political_network (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    type ENUM('CORE', 'ALLY', 'DONOR', 'RISK', 'NEUTRAL', 'OPPOSITION'),
    x INT, y INT, z INT -- Coordenadas para gráfico 3D/Scatter
);
```