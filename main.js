const express = require('express');
const app = express();
const port = 80;

const SECRET_TOKEN = 'rahasia-12';

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
            message: 'Akses Ditolak:karakter atau kata kunci yang mencurigakan.' 
        });
    }

    next();
};

const checkAuthToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Akses Tidak Sah: Token otorisasi tidak ditemukan.' 
        });
    }

    const token = authHeader.split(' ')[1]; 
    
    if (token === SECRET_TOKEN) {
        next();
    } else {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Akses Tidak Sah: Token tidak valid.' 
        });
    }
};

app.use(express.json());
app.use(checkSqlInjection); 

app.get('/', (req, res) =>
    res.send(`Congratualations! Your Express server is running on port ${port}`)
);

app.get('/dummy-get', (req, res) =>
    res.json({
        status: 'success',
        method: 'GET',
        message: 'Data publik berhasil diambil.',
        data: { id: 1, nama: 'data penting' },
    })
);

app.post('/dummy-post', checkAuthToken, (req, res) => {
    const { body } = req;
    res.status(201).json({
        status: 'success',
        method: 'POST',
        message: 'Data berhasil dibuat (API POST Terproteksi).',
        data_yang_diterima: body,
    });
});

app.delete('/dummy-delete/:id', checkAuthToken, (req, res) => {
    const { id } = req.params;
    res.json({
        status: 'success',
        method: 'DELETE',
        message: `Data dengan nomor urut ${id} berhasil dihapus (API DELETE Terproteksi).`,
    });
});

app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
);