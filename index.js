const express = require('express');
const ntuRouter = require('./src/ntuRouter');

const app = express();

// Парсинг JSON-тела запроса
app.use(express.json());

// Подключение маршрутов
app.use('/api', ntuRouter);

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));