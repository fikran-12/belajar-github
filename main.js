const express = require('express');
const app = express();
const port = 80;

app.use(express.json());

app.get('/', (req, res) =>
    res.send(`Congratualations! Your Express server is running on port ${port}`)
);

app.get('/dummy-get', (req, res) =>
    res.json({
    status: 'success',
    method: 'GET',
    message: 'API GET.',
    data: {
        id: 1,
        nama: 'data penting',
        deskripsi: 'Ini adalah data dari server.',
    },
})
);

app.post('/dummy-post', (req, res) => {
    const { body } = req;
    console.log('Received body:', body);
    res.status(201).json({
    status: 'success',
    method: 'POST',
    message: 'API POST.',
    data_yang_diterima: body,
});
});

app.delete('/dummy-delete/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete item with ID: ${id}`);
    res.json({
    status: 'success',
    method: 'DELETE',
    message: `Item dengan ID ${id} berhasil dihapus.API DELETE.`,
});
});

app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
);