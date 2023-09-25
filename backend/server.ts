import express from 'express';
// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (_req, _res) => {
    _res.send('Hello World');
});

app.listen(PORT, HOST, () => {
    console.log(`Running on http://${HOST}:${PORT} on Docker with TS!!!`);
});