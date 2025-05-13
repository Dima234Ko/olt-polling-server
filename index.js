import { config } from 'dotenv'; // Подключение переменных окружения из .env
import express from 'express';
import ntuRouter from './src/ntuRouter.js';

// Инициализация переменных окружения
config();

const app = express();

// Парсинг JSON-тела запроса
app.use(express.json());

// Подключение маршрутов
app.use('/api', ntuRouter);

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Получение порта из переменных окружения или использование 5000 по умолчанию
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));