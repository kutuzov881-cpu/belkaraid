// ============================================================
// КТ-ЖУРНАЛ — BACKEND СЕРВЕР (v3.0)
// Node.js + Express + SQLite + JWT-авторизация
// ============================================================

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const jwt = require('jsonwebtoken');

// Загрузка переменных из .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ============================================================
// КОНФИГУРАЦИЯ ИЗ .env
// ============================================================
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const AUTH_DISABLED = process.env.AUTH_DISABLED === 'true';

console.log('');
console.log('════════════════════════════════════════════════════════');
console.log('  ⚙️  Конфигурация:');
console.log('  ├─ Порт: ' + PORT);
console.log('  ├─ JWT истекает: ' + JWT_EXPIRES_IN);
console.log('  ├─ JWT секрет: ' + (JWT_SECRET.length > 20 ? '✅ длина ' + JWT_SECRET.length : '⚠️ СЛИШКОМ КОРОТКИЙ!'));
console.log('  └─ AUTH_DISABLED: ' + (AUTH_DISABLED ? '⚠️  true (авторизация ОТКЛЮЧЕНА)' : '✅ false (авторизация ВКЛЮЧЕНА)'));
console.log('════════════════════════════════════════════════════════');
console.log('');

if (JWT_SECRET === 'default_secret_change_me') {
    console.warn('⚠️ ВНИМАНИЕ: используется стандартный секрет! Измените JWT_SECRET в .env');
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Раздача статики
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// БАЗА ДАННЫХ
// ============================================================
const DB_PATH = path.join(__dirname, 'database.db');
const db = new Database(DB_PATH);

db.exec(`
    CREATE TABLE IF NOT EXISTS studies (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS desc_templates (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consumables (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS operations (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_studies_created ON studies(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_operations_created ON operations(created_at DESC);
`);

console.log('✅ База данных готова:', DB_PATH);

// ============================================================
// АВТОРИЗАЦИЯ — MIDDLEWARE requireAuth
// ============================================================
function requireAuth(req, res, next) {
    // Если AUTH_DISABLED=true — пропускаем всех (для отладки)
    if (AUTH_DISABLED) {
        req.user = { role: 'debug', name: 'Debug User' };
        return next();
    }

    // Извлекаем токен из заголовка Authorization
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            error: 'Требуется авторизация',
            code: 'NO_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Сессия истекла. Войдите снова.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({
            error: 'Неверный токен',
            code: 'INVALID_TOKEN'
        });
    }
}

// ============================================================
// АВТОРИЗАЦИЯ — ENDPOINTS
// ============================================================

// POST /api/auth/login — вход
app.post('/api/auth/login', (req, res) => {
    try {
        const { role, password } = req.body;

        if (!role || !password) {
            return res.status(400).json({ error: 'Укажите роль и пароль' });
        }

        // Получаем настройки (там пароли)
        const row = db.prepare('SELECT data FROM settings WHERE id = ?').get('global');
        let settings = {};
        if (row) {
            settings = JSON.parse(row.data);
        }

        // Пароли по умолчанию
        const passwords = settings.passwords || {};
        const expectedPassword =
            passwords[role] ||
            (role === 'lab' ? 'lab' :
             role === 'doctor' ? 'doc' :
             role === 'admin' ? 'admin' :
             role === 'dept' ? 'dept' : null);

        if (!expectedPassword) {
            return res.status(400).json({ error: 'Неизвестная роль: ' + role });
        }

        if (password !== expectedPassword) {
            console.warn('❌ Неудачная попытка входа:', role, 'из', req.ip);
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        // Выдаём токен
        const payload = {
            role: role,
            name: role === 'lab' ? 'Лаборант' :
                  role === 'doctor' ? 'Врач' :
                  role === 'admin' ? 'Администратор' :
                  role === 'dept' ? 'Отделение' : role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        console.log('✅ Вход:', role, 'из', req.ip);

        res.json({
            ok: true,
            token: token,
            role: role,
            name: payload.name,
            expiresIn: JWT_EXPIRES_IN
        });

    } catch (err) {
        console.error('Ошибка login:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/verify — проверка токена
app.post('/api/auth/verify', requireAuth, (req, res) => {
    res.json({
        ok: true,
        user: req.user
    });
});

// ============================================================
// УНИВЕРСАЛЬНЫЙ CRUD (защищённый)
// ============================================================
function makeCRUD(tableName, routePath) {
    // GET — все
    app.get('/api/' + routePath, requireAuth, (req, res) => {
        try {
            const rows = db.prepare(
                'SELECT data FROM ' + tableName + ' ORDER BY created_at DESC'
            ).all();
            res.json(rows.map(r => JSON.parse(r.data)));
        } catch (err) {
            console.error('GET /api/' + routePath + ':', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET — один
    app.get('/api/' + routePath + '/:id', requireAuth, (req, res) => {
        try {
            const row = db.prepare(
                'SELECT data FROM ' + tableName + ' WHERE id = ?'
            ).get(req.params.id);
            if (!row) return res.status(404).json({ error: 'Не найдено' });
            res.json(JSON.parse(row.data));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST — создать или обновить
    app.post('/api/' + routePath, requireAuth, (req, res) => {
        try {
            const item = req.body;
            if (!item || !item.id) {
                return res.status(400).json({ error: 'Не указан id' });
            }

            const now = Date.now();
            const dataJson = JSON.stringify(item);

            const existing = db.prepare(
                'SELECT id FROM ' + tableName + ' WHERE id = ?'
            ).get(item.id);

            if (existing) {
                db.prepare(
                    'UPDATE ' + tableName + ' SET data = ?, updated_at = ? WHERE id = ?'
                ).run(dataJson, now, item.id);
            } else {
                db.prepare(
                    'INSERT INTO ' + tableName + ' (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)'
                ).run(item.id, dataJson, now, now);
            }

            res.json({ ok: true, id: item.id });
        } catch (err) {
            console.error('POST /api/' + routePath + ':', err);
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE — удалить
    app.delete('/api/' + routePath + '/:id', requireAuth, (req, res) => {
        try {
            db.prepare('DELETE FROM ' + tableName + ' WHERE id = ?').run(req.params.id);
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}

// ============================================================
// РЕГИСТРАЦИЯ CRUD
// ============================================================
makeCRUD('studies',        'studies');
makeCRUD('requests',       'requests');
makeCRUD('templates',      'templates');
makeCRUD('desc_templates', 'desc-templates');
makeCRUD('drugs',          'drugs');
makeCRUD('consumables',    'consumables');
makeCRUD('operations',     'operations');

// ============================================================
// НАСТРОЙКИ
// ============================================================
app.get('/api/settings', requireAuth, (req, res) => {
    try {
        const row = db.prepare('SELECT data FROM settings WHERE id = ?').get('global');
        if (!row) {
            return res.json({});
        }
        res.json(JSON.parse(row.data));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', requireAuth, (req, res) => {
    try {
        const data = req.body || {};
        const now = Date.now();
        const dataJson = JSON.stringify(data);

        const existing = db.prepare('SELECT id FROM settings WHERE id = ?').get('global');

        if (existing) {
            db.prepare('UPDATE settings SET data = ?, updated_at = ? WHERE id = ?')
              .run(dataJson, now, 'global');
        } else {
            db.prepare('INSERT INTO settings (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)')
              .run('global', dataJson, now, now);
        }

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// HEALTH CHECK (без авторизации — публичный)
// ============================================================
app.get('/api/health', (req, res) => {
    try {
        const studiesCount = db.prepare('SELECT COUNT(*) as c FROM studies').get().c;
        const requestsCount = db.prepare('SELECT COUNT(*) as c FROM requests').get().c;
        const templatesCount = db.prepare('SELECT COUNT(*) as c FROM templates').get().c;
        const operationsCount = db.prepare('SELECT COUNT(*) as c FROM operations').get().c;

        res.json({
            status: 'ok',
            time: new Date().toISOString(),
            version: '3.0.0',
            auth: {
                disabled: AUTH_DISABLED,
                jwtExpires: JWT_EXPIRES_IN
            },
            db: {
                studies: studiesCount,
                requests: requestsCount,
                templates: templatesCount,
                operations: operationsCount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// 404 — все остальные запросы
// ============================================================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint не найден: ' + req.method + ' ' + req.path });
});

// ============================================================
// ЗАПУСК СЕРВЕРА
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('  🚀 КТ-Журнал Backend Server v3.0 (с JWT-авторизацией)');
    console.log('════════════════════════════════════════════════════════');
    console.log('  Локально:  http://localhost:' + PORT);
    console.log('  В сети:    http://192.168.0.10:' + PORT);
    console.log('');
    console.log('  🔐 Авторизация: ' + (AUTH_DISABLED ? '⚠️  ОТКЛЮЧЕНА (режим отладки)' : '✅ ВКЛЮЧЕНА'));
    console.log('');
    console.log('  📋 Таблиц: 8');
    console.log('  🔗 API endpoints:');
    console.log('     POST   /api/auth/login         — вход, выдача токена');
    console.log('     POST   /api/auth/verify        — проверка токена');
    console.log('     GET    /api/health             — проверка сервера');
    console.log('     GET    /api/studies            — исследования');
    console.log('     GET    /api/requests           — заявки');
    console.log('     GET    /api/templates          — шаблоны исследований');
    console.log('     GET    /api/desc-templates     — шаблоны описаний');
    console.log('     GET    /api/drugs              — препараты');
    console.log('     GET    /api/consumables        — расходники');
    console.log('     GET    /api/operations         — операции склада');
    console.log('     GET    /api/settings           — настройки');
    console.log('════════════════════════════════════════════════════════');
    console.log('');

    if (AUTH_DISABLED) {
        console.log('⚠️  AUTH_DISABLED=true — все API endpoints открыты!');
        console.log('   Для production измените .env: AUTH_DISABLED=false');
        console.log('');
    }
});