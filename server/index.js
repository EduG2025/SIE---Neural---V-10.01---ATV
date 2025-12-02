
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const os = require('os');
const db = require('./db');
const multer = require('multer');
const crypto = require('crypto');
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

// Garante pastas críticas
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
    // Simula métricas reais baseadas no sistema
    const cpuLoad = os.loadavg()[0];
    const freeMem = os.freemem() / 1024 / 1024;
    
    res.json([
        { name: 'Dashboard', status: 'ONLINE', latencyMs: Math.round(Math.random() * 50 + 20), cpuUsage: cpuLoad.toFixed(2), memoryUsage: 120 },
        { name: 'AICore', status: 'ONLINE', latencyMs: Math.round(Math.random() * 100 + 50), cpuUsage: (cpuLoad * 2).toFixed(2), memoryUsage: 450 },
        { name: 'Commerce', status: 'ONLINE', latencyMs: Math.round(Math.random() * 30 + 10), cpuUsage: cpuLoad.toFixed(2), memoryUsage: 80 }
    ]);
});

app.get('/api/modules/list', async (req, res) => {
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
app.get('/api/auth/settings', async (req, res) => {
    try {
        let settings = { systemName: 'SIE 3xxx', logoUrl: '', allowRegistration: false };
        try {
            const [configs] = await db.execute("SELECT config_key, config_value FROM system_configs WHERE config_key IN ('SYSTEM_NAME', 'SYSTEM_LOGO', 'ALLOW_REGISTRATION')");
            configs.forEach(c => {
                if (c.config_key === 'SYSTEM_NAME') settings.systemName = c.config_value;
                if (c.config_key === 'SYSTEM_LOGO') settings.logoUrl = c.config_value;
                if (c.config_key === 'ALLOW_REGISTRATION') settings.allowRegistration = c.config_value === 'true' || c.config_value === '1';
            });
        } catch (dbError) {
             console.warn("[WARN] DB Unreachable for Auth Settings. Using defaults.");
        }
        res.json(settings);
    } catch (e) {
        // Fallback seguro para não quebrar a tela de login
        res.json({ systemName: 'SIE 3xxx (Offline Mode)', logoUrl: '', allowRegistration: false });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const [config] = await db.execute("SELECT config_value FROM system_configs WHERE config_key = 'ALLOW_REGISTRATION'");
        const isAllowed = config.length > 0 && (config[0].config_value === 'true' || config[0].config_value === '1');
        if (!isAllowed) return res.status(403).json({ error: 'Registro desativado.' });
    } catch(e) { return res.status(500).json({ error: 'Erro config.' }); }

    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos' });

    try {
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email já cadastrado.' });

        const credential = 'SIE-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        await db.execute(
            'INSERT INTO users (name, email, password_hash, access_credential, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [name, email, password, credential, 'USER', 'BASIC', 'ACTIVE'] 
        );
        res.json({ success: true, credential });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { credential } = req.body;
    
    // 1. Verificação de Chave de Emergência (Bypass DB)
    if (process.env.EMERGENCY_KEY && credential === process.env.EMERGENCY_KEY) {
        console.warn(`[SECURITY ALERT] Login de Emergência (ROOT) realizado em ${new Date().toISOString()}`);
        return res.json({ 
            success: true, 
            user: { 
                id: 0, 
                name: 'ROOT_EMERGENCY', 
                role: 'ADMIN', 
                plan: 'ENTERPRISE', 
                avatar: '',
                status: 'ACTIVE'
            } 
        });
    }

    if (!credential) return res.status(400).json({ error: 'Credencial necessária' });

    // 2. Modo de Manutenção (File Based Auth) - Se ativo no ENV ou DB falhar
    if (process.env.MAINTENANCE_MODE === 'true') {
        // ... Lógica de arquivos JSON aqui se implementada ...
    }

    // 3. Login Padrão (MySQL)
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE access_credential = ? AND status = "ACTIVE"', [credential]);
        if (rows.length === 0) return res.status(401).json({ error: 'Credencial inválida.' });
        
        const user = rows[0];
        // Async update login time (não bloqueia resposta)
        db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]).catch(e => console.error(e));
        
        res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, plan: user.plan, avatar: user.avatar } });
    } catch (error) { 
        console.error("Login DB Error:", error);
        res.status(500).json({ error: 'Erro interno ou Banco de Dados indisponível. Use chave de emergência.' }); 
    }
});

// CRUD Usuários
app.get('/api/users', async (req, res) => {
    try { const [u] = await db.execute('SELECT id, name, email, role, plan, status, avatar, last_login FROM users'); res.json(u); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/users', async (req, res) => {
    const { name, email, role, plan, status } = req.body;
    const credential = 'SIE-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try { await db.execute('INSERT INTO users (name, email, password_hash, access_credential, role, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, email, '123', credential, role, plan, status]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/users/:id', async (req, res) => {
    const { name, email, role, plan, status } = req.body;
    try { await db.execute('UPDATE users SET name=?, email=?, role=?, plan=?, status=? WHERE id=?', [name, email, role, plan, status, req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/users/:id', async (req, res) => {
    try { await db.execute('DELETE FROM users WHERE id=?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- GENERIC API ROUTES ---

app.get('/api/candidates', async (req, res) => { try { const [r] = await db.execute('SELECT * FROM candidates'); res.json(r); } catch (e) { res.status(500).json({error:e.message}); }});
app.post('/api/candidates', async (req, res) => { try { await db.execute('INSERT INTO candidates (name, party, state, score, risk_level) VALUES (?, ?, ?, ?, ?)', [req.body.name, req.body.party, req.body.state, 0, 'LOW']); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});
app.delete('/api/candidates/:id', async (req, res) => { try { await db.execute('DELETE FROM candidates WHERE id=?', [req.params.id]); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});

app.get('/api/network', async (req, res) => { try { const [r] = await db.execute('SELECT * FROM political_network'); res.json(r); } catch (e) { res.status(500).json({error:e.message}); }});
app.get('/api/configs', async (req, res) => { try { const [r] = await db.execute('SELECT * FROM system_configs'); res.json(r); } catch (e) { res.status(500).json({error:e.message}); }});
app.put('/api/configs/:key', async (req, res) => { try { await db.execute('INSERT INTO system_configs (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)', [req.params.key, req.body.value]); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});
app.get('/api/keys', async (req, res) => { 
    try { 
        let query = 'SELECT * FROM api_keys';
        if (req.query.active_only === 'true') query += ' WHERE is_active = 1';
        const [r] = await db.execute(query); 
        res.json(r); 
    } catch (e) { res.status(500).json({error:e.message}); }
});
app.post('/api/keys', async (req, res) => { try { await db.execute('INSERT INTO api_keys (provider, key_value, label, priority) VALUES (?, ?, ?, ?)', [req.body.provider, req.body.key_value, req.body.label, req.body.priority]); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});
app.post('/api/keys/:id/report_error', async (req, res) => {
    try { 
        await db.execute('UPDATE api_keys SET error_count = error_count + 1 WHERE id = ?', [req.params.id]);
        await db.execute('UPDATE api_keys SET is_active = 0 WHERE id = ? AND error_count > 10', [req.params.id]);
        res.json({success:true}); 
    } catch (e) { res.status(500).json({error:e.message}); }
});

app.get('/api/plans', async (req, res) => { try { const [r] = await db.execute('SELECT * FROM plans'); res.json(r); } catch (e) { res.status(500).json({error:e.message}); }});
app.post('/api/plans', async (req, res) => { try { await db.execute('INSERT INTO plans (name, price, duration_days, trial_days, features_json, is_active) VALUES (?, ?, ?, ?, ?, ?)', [req.body.name, req.body.price, req.body.duration_days, req.body.trial_days, JSON.stringify(req.body.features), 1]); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});
app.delete('/api/plans/:id', async (req, res) => { try { await db.execute('DELETE FROM plans WHERE id=?', [req.params.id]); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});

app.get('/api/payments', async (req, res) => { try { const [r] = await db.execute('SELECT p.*, u.name as user_name FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC'); res.json(r); } catch (e) { res.status(500).json({error:e.message}); }});
app.post('/api/payments', async (req, res) => { try { await db.execute('INSERT INTO payments (user_id, plan_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?)', [req.body.user_id, req.body.plan_id, req.body.amount, req.body.method, req.body.transaction_id, 'PENDING']); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});
app.put('/api/payments/:id/confirm', async (req, res) => { try { await db.execute('UPDATE payments SET status = "COMPLETED" WHERE id = ?', [req.params.id]); res.json({success:true}); } catch (e) { res.status(500).json({error:e.message}); }});

// Upload Logo
app.post('/api/upload/logo', upload.single('logo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const url = `/media/${req.file.filename}`;
    // Salva no DB configs
    try {
        await db.execute('INSERT INTO system_configs (config_key, config_value) VALUES ("SYSTEM_LOGO", ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)', [url]);
    } catch(e) {}
    res.json({ success: true, url });
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
        res.json({ success: true, snapshot: snapshotName });
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
