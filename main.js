const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const ACCESS_LOG_FILE = path.join(__dirname, 'access.log'); 
const JWT_SECRET = 'kunci-rahasia-jwt-anda'; 

const ADMIN_USERNAME = 'fik-dil-12';
const ADMIN_PASSWORD = 'password12';

// --- Utilitas ---

const maskSensitiveData = (data) => {
    if (data && typeof data === 'string' && data.length > 8) {
        const visibleLength = 4;
        const visiblePart = data.slice(-visibleLength); 
        const maskedLength = data.length > 20 ? 16 : data.length - visibleLength;
        const maskedPart = '*'.repeat(maskedLength);
        return maskedPart + visiblePart;
    }
    return data;
};

const getWitaTime = () => {
    const date = new Date();
    return date.toLocaleString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
    }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$2-$1T');
};

// --- Middleware Logging ---

const logRequestDetails = (req, res, next) => {
    const startTime = process.hrtime();
    let logBodyData = {}; 

    if (req.originalUrl === '/login' && req.method === 'POST' && req.body) {
        logBodyData.username = req.body.username || 'N/A';
        logBodyData.password = req.body.password ? maskSensitiveData(req.body.password) : 'N/A';
    }

    const authHeader = req.headers['authorization'];
    let token = 'N/A';
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    const maskedToken = maskSensitiveData(token);
    
    next();
    
    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6;
        
        const logData = {
            timestamp: getWitaTime(),
            status: res.statusCode,
            method: req.method,
            path: req.originalUrl,
            protocol: req.protocol,
            ip: req.ip || req.connection.remoteAddress,
            Host: req.headers.host,
            UserAgent: req.headers['user-agent'] || 'N/A',
            ...logBodyData,
            token: maskedToken,
            responseTimeMs: parseFloat(responseTime.toFixed(2))
        };
        
        const logEntry = JSON.stringify(logData) + '\n';
        
        console.log(`[ACCESS LOG] ${logEntry.trim()}`); 
        
        fs.appendFile(ACCESS_LOG_FILE, logEntry, (err) => {
            if (err) {
                console.error('Failed to write to access.log:', err);
            }
        });
    });
};

// --- Middleware Keamanan ---

const checkSqlInjection = (req, res, next) => {
    const sqlKeywords = /(\bSELECT\b|\bUNION\b|\bDROP\b|\bOR\b\s+1\s*=\s*1)/i;

    const checkData = (data) => {
        if (!data) return false;
        for (const key in data) {
            if (typeof data[key] === 'string' && sqlKeywords.test(data[key])) {
                return true;
            }
        }
        return false;
    };

    if (checkData(req.body) || checkData(req.query) || checkData(req.params)) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Karakter atau kata kunci yang mencurigakan terdeteksi.' 
        });
    }

    next();
};

const checkAuthToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Token JWT tidak ditemukan atau format salah.' 
        });
    }

    const token = authHeader.split(' ')[1]; 
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Token JWT tidak valid atau kadaluwarsa.' 
            });
        }
        
        req.user = decoded;
        next();
    });
};

// --- Konfigurasi dan Middleware Aplikasi ---

app.use(express.json());
app.use(logRequestDetails);
app.use(checkSqlInjection);

// --- Rute Aplikasi ---

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const payload = { id: 1, username: ADMIN_USERNAME, role: 'admin' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        
        return res.json({
            status: 'success',
            message: 'Login successful! Use this token for authorization.',
            token: token
        });
    }

    return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password credentials.'
    });
});

app.get('/', (req, res) =>
    res.send(`Congratulations! Your Express server is running on port ${port}`)
);

app.get('/dummy-get', (req, res) =>
    res.json({
        status: 'success',
        method: 'GET',
        message: 'API GET for data.',
        data: { id: 1, name: 'important data', description: 'This is data from the server.' },
    })
);

app.post('/dummy-post', checkAuthToken, (req, res) => {
    const { body } = req;
    console.log('Received body (raw):', body);
    res.status(201).json({
        status: 'success',
        method: 'POST',
        message: `Data successfully created (Authorized by ${req.user.role}).`,
        data_received: body,
    });
});

app.delete('/dummy-delete/:id', checkAuthToken, (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete item with ID: ${id}`);
    res.json({
        status: 'success',
        method: 'DELETE',
        message: `Item with ID ${id} successfully deleted (Authorized by ${req.user.role}).`,
    });
});

// --- Server Startup ---

app.listen(port, () => {
    console.log(`Application running on port ${port}!`);
    console.log(`[LOG FILE LOCATION] Check at: ${ACCESS_LOG_FILE}`);
});