
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const os = require('os');
const db = require('./db');
const multer = require('multer');
const crypto = require('crypto'); // Adicionado para gerar tokens
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PROJECT_ROOT = path.resolve(__dirname, '..'); 
const BACKUP_DIR = path.join(PROJECT_ROOT, '.backups');
const MEDIA_DIR = path.join(PROJECT_ROOT, 'media');

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, MEDIA_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Garante pastas
(async () => {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        await fs.mkdir(path.join(PROJECT_ROOT, 'src/staging_builds'), { recursive: true });
        await fs.mkdir(path.join(PROJECT_ROOT, 'src/active_modules'), { recursive: true });
        await fs.mkdir(MEDIA_DIR, { recursive: true });
        await fs.mkdir(path.join(PROJECT_ROOT, 'credenciais'), { recursive: true });
    } catch(e) {}
})();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

app.use('/media', express.static(MEDIA_DIR));

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- ROUTES ---

// Health & Stats
app.get('/api/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
      await db.query('SELECT 1');
      dbStatus = 'CONNECTED';
  } catch (e) {}

  res.json({ 
    status: 'ONLINE', 
    db: dbStatus,
    dbName: process.env.DB_NAME,
    os: os.type(),
    uptime: os.uptime()
  });
});

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [candidateCount] = await db.execute('SELECT COUNT(*) as total FROM candidates');
        const [keyCount] = await db.execute('SELECT COUNT(*) as total FROM api_keys WHERE is_active = 1');
        const [networkCount] = await db.execute('SELECT COUNT(*) as total FROM political_network');
        res.json({
            users: userCount[0].total,
            candidates: candidateCount[0].total,
            activeKeys: keyCount[0].total,
            networkNodes: networkCount[0].total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/modules/metrics', async (req, res) => {
    res.json([
        { name: 'Dashboard', status: 'ONLINE', latencyMs: 25, cpuUsage: 1.2, memoryUsage: 120 },
        { name: 'AICore', status: 'ONLINE', latencyMs: 150, cpuUsage: 5.5, memoryUsage: 450 },
        { name: 'Commerce', status: 'ONLINE', latencyMs: 40, cpuUsage: 0.8, memoryUsage: 80 }
    ]);
});

app.get('/api/modules/list', async (req, res) => {
    // Retorna lista de módulos do sistema disponíveis para inclusão em planos
    // Baseado na estrutura de ViewState do frontend e arquivos
    res.json([
        { id: 'DASHBOARD', name: 'Dashboard & KPIs' },
        { id: 'CANDIDATES', name: 'Busca & Scoring de Candidatos' },
        { id: 'NETWORK', name: 'Rede Política' },
        { id: 'AI_CORE', name: 'Núcleo Neural (Admin)' },
        { id: 'USERS', name: 'Gestão de Usuários' },
        { id: 'COMMERCE', name: 'Commerce & Financeiro' }
    ]);
});

// --- AUTH & USERS ---

// Public Auth Settings (Branding + Register Allowed)
app.get('/api/auth/settings', async (req, res) => {
    try {
        // Tenta buscar configs. Se falhar, retorna defaults seguros.
        let settings = {
            systemName: 'SIE 3xxx',
            logoUrl: '',
            allowRegistration: false
        };

        try {
            const [configs] = await db.execute("SELECT config_key, config_value FROM system_configs WHERE config_key IN ('SYSTEM_NAME', 'SYSTEM_LOGO', 'ALLOW_REGISTRATION')");
            configs.forEach(c => {
                if (c.config_key === 'SYSTEM_NAME') settings.systemName = c.config_value;
                if (c.config_key === 'SYSTEM_LOGO') settings.logoUrl = c.config_value;
                if (c.config_key === 'ALLOW_REGISTRATION') settings.allowRegistration = c.config_value === 'true' || c.config_value === '1';
            });
        } catch (dbError) {
            console.warn("DB Indisponível para configs públicas, usando defaults.");
        }

        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Erro crítico ao carregar configurações' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    // 1. Check if allowed
    try {
        const [config] = await db.execute("SELECT config_value FROM system_configs WHERE config_key = 'ALLOW_REGISTRATION'");
        const isAllowed = config.length > 0 && (config[0].config_value === 'true' || config[0].config_value === '1');
        
        if (!isAllowed) {
            return res.status(403).json({ error: 'O registro de novos usuários está desativado pelo administrador.' });
        }
    } catch(e) { return res.status(500).json({ error: 'Erro ao verificar configurações.' }); }

    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos' });

    try {
        // 2. Check duplicate
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email já cadastrado.' });

        // 3. Generate Secure Credential
        const credential = 'SIE-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // 4. Create User
        await db.execute(
            'INSERT INTO users (name, email, password_hash, access_credential, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [name, email, password, credential, 'USER', 'BASIC', 'ACTIVE'] 
        );
        
        // Retorna a credencial para o usuário salvar
        res.json({ success: true, credential, message: 'Usuário criado com sucesso.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { credential } = req.body;
    
    // 1. Emergency Fallback (Environment Variable)
    if (process.env.EMERGENCY_KEY && credential === process.env.EMERGENCY_KEY) {
        console.log("⚠️ EMERGENCY LOGIN ACTIVATED");
        return res.json({ success: true, user: { id: 0, name: 'ROOT_EMERGENCY', role: 'ADMIN', plan: 'ENTERPRISE', avatar: '' } });
    }

    if (!credential) return res.status(400).json({ error: 'Credencial necessária' });

    // 2. Maintenance Mode Logic (File-based fallback)
    let maintenanceMode = false;
    try {
        const [config] = await db.execute('SELECT config_value FROM system_configs WHERE config_key = ?', ['MAINTENANCE_MODE']);
        if(config.length > 0 && config[0].config_value === 'true') maintenanceMode = true;
    } catch(e) {}

    // Em modo manutenção, tentamos achar arquivo JSON que contenha essa credencial (Simulação)
    if (maintenanceMode) {
        // Lógica simplificada: em manutenção, o login via arquivo geralmente é por email/senha.
        // Para credencial, teríamos que varrer arquivos, o que é ineficiente. 
        // Assumimos DB para credencial ou Emergency Key no modo manutenção.
    }

    // 3. Normal DB Auth (Credential Only)
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE access_credential = ? AND status = "ACTIVE"', [credential]);
        
        if (rows.length === 0) return res.status(401).json({ error: 'Credencial inválida ou usuário inativo.' });
        
        const user = rows[0];
        
        // Atualiza last_login
        await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, plan: user.plan, avatar: user.avatar } });
    } catch (error) { res.status(500).json({ error: 'Erro interno ao validar credencial' }); }
});

app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email, role, plan, status, avatar, last_login FROM users');
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    const { name, email, role, plan, status } = req.body;
    const credential = 'SIE-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
        await db.execute('INSERT INTO users (name, email, password_hash, access_credential, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [name, email, 'default123', credential, role, plan, status]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, email, role, plan, status } = req.body;
    try {
        await db.execute('UPDATE users SET name=?, email=?, role=?, plan=?, status=? WHERE id=?', [name, email, role, plan, status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CANDIDATES ---
app.get('/api/candidates', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM candidates ORDER BY score DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/candidates', async (req, res) => {
    const { name, party, state } = req.body;
    try {
        await db.execute('INSERT INTO candidates (name, party, state) VALUES (?, ?, ?)', [name, party, state]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/candidates/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM candidates WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NETWORK ---
app.get('/api/network', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM political_network');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CONFIGS & BRANDING ---
app.get('/api/configs', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM system_configs');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/configs/:key', async (req, res) => {
    const { value } = req.body;
    try {
        await db.execute(
            'INSERT INTO system_configs (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
            [req.params.key, value]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upload de Logo (Branding)
app.post('/api/upload/logo', upload.single('logo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const fileUrl = `/media/${req.file.filename}`;
    try {
        await db.execute(
            'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
            ['SYSTEM_LOGO', fileUrl, 'Logo do Sistema']
        );
        res.json({ success: true, url: fileUrl });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// --- AI KEYS ---
app.get('/api/keys', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM api_keys');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/keys', async (req, res) => {
    const { provider, key_value, label, priority } = req.body;
    try {
        await db.execute('INSERT INTO api_keys (provider, key_value, label, priority) VALUES (?, ?, ?, ?)', [provider, key_value, label, priority]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/keys/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM api_keys WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/keys/:id', async (req, res) => {
    const { is_active } = req.body;
    try {
        await db.execute('UPDATE api_keys SET is_active=? WHERE id=?', [is_active, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- COMMERCE (PLANS & PAYMENTS) ---
app.get('/api/plans', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM plans');
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/plans', async (req, res) => {
    const { name, price, duration_days, trial_days, features } = req.body;
    try {
        await db.execute(
            'INSERT INTO plans (name, price, duration_days, trial_days, features_json) VALUES (?, ?, ?, ?, ?)',
            [name, price, duration_days, trial_days, JSON.stringify(features || [])]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/plans/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM plans WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payments', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT p.*, u.name as user_name FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY created_at DESC');
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/payments', async (req, res) => {
    const { user_id, plan_id, amount, method, transaction_id } = req.body;
    try {
        await db.execute(
            'INSERT INTO payments (user_id, plan_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, plan_id, amount, method, transaction_id, 'PENDING']
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/payments/:id/confirm', async (req, res) => {
    try {
        await db.execute("UPDATE payments SET status = 'COMPLETED', confirmed_by_admin_id = 1 WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- FILE SYSTEM (FS) & TERMINAL ---
app.get('/api/fs/list', async (req, res) => {
  const fullPath = path.resolve(PROJECT_ROOT, req.query.path || '');
  if (!fullPath.startsWith(PROJECT_ROOT)) return res.status(403).json({ error: 'Acesso negado.' });
  try {
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    res.json(files.map(f => ({
        name: f.name,
        type: f.isDirectory() ? 'DIRECTORY' : 'FILE',
        path: path.relative(PROJECT_ROOT, path.join(fullPath, f.name)).replace(/\\/g, '/'),
        isProtected: f.name === 'server' || f.name.includes('AICore')
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/fs/read', async (req, res) => {
    const fullPath = path.resolve(PROJECT_ROOT, req.query.path);
    if (!fullPath.startsWith(PROJECT_ROOT)) return res.status(403).json({ error: 'Acesso negado.' });
    try {
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json({ content });
    } catch (e) { res.status(404).json({ error: 'Arquivo não encontrado' }); }
});

app.post('/api/fs/write', async (req, res) => {
    const fullPath = path.resolve(PROJECT_ROOT, req.body.path);
    if (!fullPath.startsWith(PROJECT_ROOT)) return res.status(403).json({ error: 'Acesso negado.' });
    try {
        // Create Snapshot
        const snapshotName = `${path.basename(fullPath)}.${Date.now()}.bak`;
        try {
            await fs.copyFile(fullPath, path.join(BACKUP_DIR, snapshotName));
        } catch(e) {} // Ignora se arquivo novo

        await fs.writeFile(fullPath, req.body.content, 'utf-8');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/terminal/exec', async (req, res) => {
    exec(req.body.command, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
        res.json({ output: stdout, error: stderr, exitCode: error ? error.code : 0 });
    });
});

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.listen(PORT, () => console.log(`SIE 3xxx rodando na porta ${PORT}`));
