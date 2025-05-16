import { config } from 'dotenv'; 
import express from 'express';
import ntuRouter from './src/ntuRouter.js';
import writeToFile from './src/writeLog.js'

config();

const app = express();
app.use(express.json());

// Middleware для обработки ошибок парсинга JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        writeToFile ('Передан не верный формат параметров');
        return res.status(400).json({
            success: false,
            error: 'Неверный формат параметров'
        });
    }
    next(err);
});

// Подключение маршрутов
app.use('/api', ntuRouter);

// Обработка ошибок 404
app.use((req, res) => {
    res.status(404).json({ error: 'Не верный маршрут' });
});

// Получение порта из переменных окружения или использование 5000 по умолчанию
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));